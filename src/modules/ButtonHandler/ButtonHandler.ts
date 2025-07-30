import type { Database } from "better-sqlite3";
import { Module, type ModuleParams } from "../../structures/BaseModules";
import { Events, MessageFlags } from "discord.js";
import { handleSourceMismatch, verifySourceMatch } from "./functions/SourceMismatchReporter";
import { ButtonActionMappings, decodeCustomIdToRoleButton } from "../ButtonEditor/functions/Common";
import { ConditionallyReply } from "./functions/ConditionallyReply";
import { interactionReplySafely } from "../../util/InteractionReplySafely";
import { logAudit, logDebug, logError, logInfo } from "../../core/Log";
import { makeInteractionPrintable } from "../../util/MakeInteractionPrintable";


interface ButtonHandlerParams extends ModuleParams {
  //db: Database
}

export type ButtonTableEntry = {
  button_id: string,
  role: string,
  action: number,
  silent: boolean,
  guild_id: string,
  channel_id: string,
  message_id: string
}

export class ButtonHandler extends Module {

  constructor(params: ButtonHandlerParams) {
    super(params);

    this.client.on(Events.InteractionCreate, async interaction => {

      // Only respond to button presses
      if (!interaction.isButton()) {
        return
      }

      // Check if the button is a role assign button
      const parsedButton = decodeCustomIdToRoleButton(interaction.customId)
      if (!parsedButton) {
        return
      }

      // If it is, proceed
      logDebug("Button Handler: Received button interaction to handle:")
      logDebug(makeInteractionPrintable(interaction))

      // Make sure the required guild and member fields exist on the interaction
      if (!interaction.guild || !interaction.member) {
        logError(`Interaction somehow lacks guild or member.`);
        logError(`Interaction details:`)
        logError(makeInteractionPrintable(interaction))
        await interactionReplySafely(interaction, "Could not assign role: System error. \nPlease contact an administrator.");
        return
      }

      // Make sure guild is available before interacting with it
      if (!interaction.guild.available) {
        await interactionReplySafely(interaction, "Guild is currently unavailable - please try again later.");
        return
      }

      // Find the role to assign
      const roleToAssign = interaction.guild.roles.resolve(parsedButton.roleId);
      if (!roleToAssign) {
        logDebug(`Role specified by button ID ${interaction.customId} (role ID ${parsedButton.roleId}) does not exist. Perhaps the role was deleted?`);
        await interactionReplySafely(interaction, "Could not assign role: Specified role seems to be missing. \nPlease contact an administrator.");
        return
      }

      // Resolve the interaction's user to the member within the guild - the latter is needed for assigning roles to
      const member = interaction.guild.members.resolve(interaction.member.user.id);
      if (!member) {
        logError(`Could not resolve user ${interaction.member.user.username} (ID ${interaction.member.user.id}) in guild ${interaction.guild.name} (ID ${interaction.guild.name}).`);
        logError(`Interaction details:`)
        logError(makeInteractionPrintable(interaction))
        await interactionReplySafely(interaction, "Could not assign role: System error. \nPlease contact an administrator.");
        return
      }

      // Check if user already has the role in question
      // Make sure the user is cached to access their roles beforehand
      await member.fetch()
      const memberAlreadyHasRole = member.roles.cache.some(role => role.id === roleToAssign.id)
      logDebug(memberAlreadyHasRole ? `User already has specified role - using to switch behavior.` : `User currently doesn't have specified role.`)

      try {

        // Do the actual assign logic
        switch (parsedButton.buttonData.actionType) {
          case ButtonActionMappings.ASSIGN:
            if (memberAlreadyHasRole) {
              logAudit(`Skipping assigning role ${roleToAssign.name} (ID ${roleToAssign.id}) to user ${member.user.globalName} (ID ${member.id}) - member already has role.`)
              await ConditionallyReply(interaction, `You already have the role <@&${roleToAssign.id}>.`, parsedButton.buttonData.silent)
            } else {
              await member.roles.add(roleToAssign)
              logAudit(`Assigned role ${roleToAssign.name} (ID ${roleToAssign.id}) to user ${member.user.globalName} (ID ${member.id}).`)
              await ConditionallyReply(interaction, `Assigned role <@&${roleToAssign.id}>.`, parsedButton.buttonData.silent)
            }
            break;
          case ButtonActionMappings.REMOVE:
            if (!memberAlreadyHasRole) {
              logAudit(`Skipping removing role ${roleToAssign.name} (ID ${roleToAssign.id}) from user ${member.user.globalName} (ID ${member.id}) - member already doesn't have role.`)
              await ConditionallyReply(interaction, `You already don't have the role <@&${roleToAssign.id}>.`, parsedButton.buttonData.silent)
            } else {
              await member.roles.remove(roleToAssign)
              logAudit(`Removed role ${roleToAssign.name} (ID ${roleToAssign.id}) to user ${member.user.globalName} (ID ${member.id}).`)
              await ConditionallyReply(interaction, `Removed role <@&${roleToAssign.id}>.`, parsedButton.buttonData.silent)
            }
            break;
          case ButtonActionMappings.TOGGLE:
            if (memberAlreadyHasRole) {
              await member.roles.remove(roleToAssign)
              logAudit(`Toggle-removed role ${roleToAssign.name} (ID ${roleToAssign.id}) for user ${member.user.globalName} (ID ${member.id}).`)
              await ConditionallyReply(interaction, `Removed role <@&${roleToAssign.id}>.`, parsedButton.buttonData.silent)
            } else {
              await member.roles.add(roleToAssign)
              logAudit(`Toggle-enabled role ${roleToAssign.name} (ID ${roleToAssign.id}) for user ${member.user.globalName} (ID ${member.id}).`)
              await ConditionallyReply(interaction, `Assigned role <@&${roleToAssign.id}>.`, parsedButton.buttonData.silent)
            }
            break;
        }
      } catch (error) {
        logError("Failed to update roles for button press:")
        logError(error)
        logError("Interaction details:")
        logError(makeInteractionPrintable(interaction))
        await interactionReplySafely(interaction, "Could not assign role: System error. \nPlease contact an administrator.");
      }
    })
  }
}