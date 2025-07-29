import type { Database } from "better-sqlite3";
import { Module, type ModuleParams } from "../../structures/BaseModules";
import { Events, MessageFlags } from "discord.js";
import { handleSourceMismatch, verifySourceMatch } from "./functions/SourceMismatchReporter";
import { ButtonActionMappings } from "../ButtonEditor/functions/Common";
import { ConditionallyReply } from "./functions/ConditionallyReply";
import { interactionReplySafely } from "../../util/InteractionReplySafely";
import { logAudit, logDebug, logError, logInfo } from "../../core/Log";
import { makeInteractionPrintable } from "../../util/MakeInteractionPrintable";


interface ButtonHandlerParams extends ModuleParams {
  db: Database
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

  db: Database;

  constructor(params: ButtonHandlerParams) {
    super(params);
    this.db = params.db;

    this.client.on(Events.InteractionCreate, async interaction => {

      // Only respond to button presses
      if (!interaction.isButton()) {
        return
      }

      // Look up button in db
      const buttonId = interaction.customId;
      const buttonQuery = this.db.prepare('SELECT * FROM buttons WHERE button_id = ?');

      let buttonData: ButtonTableEntry | undefined = undefined;
      try {
        buttonData = <ButtonTableEntry | undefined>buttonQuery.get(buttonId);
      } catch (error) {
        logError("Failed to fetch button entry from database:")
        logError(error)
        await interactionReplySafely(interaction, "Failed to locate info for this button. Please contact the bot administrator.");
        return;
      }

      if (!buttonData) {
        // A button was pressed whose ID is not in the database of buttons managed by the Button Message section.
        // This could be a button used in other parts of the bot, so return silently
        return;
      }

      logDebug("Button Handler: Received button interaction to handle:")
      logDebug(makeInteractionPrintable(interaction))

      // Check source integrity
      const errorStrings = verifySourceMatch(interaction, buttonData)
      if (errorStrings.length > 0) {
        await handleSourceMismatch(interaction, buttonData, errorStrings);
        return
      }

      // Sanity check interaction required fields 
      if (!interaction.guild || !interaction.member) {
        logError(`Interaction somehow lacks guild or member.`);
        logError(`Interaction details:`)
        logError(makeInteractionPrintable(interaction))
        await interactionReplySafely(interaction, "Could not assign role: System error. \nPlease contact an administrator.");
        return
      }

      // Find the role to assign
      const roleToAssign = interaction.guild.roles.resolve(buttonData.role)
      if (!roleToAssign) {
        logDebug(`Role specified by button ID ${buttonData.button_id} (role ID ${buttonData.role}) does not exist. Perhaps the role was deleted?`);
        await interactionReplySafely(interaction, "Could not assign role: Specified role seems to be missing. \nPlease contact an administrator.");
        return
      }

      // Resolve the member within the guild
      const member = interaction.guild.members.resolve(interaction.member.user.id)
      if (!member) {
        logError(`Could not resolve user ${interaction.member.user.username} (ID ${interaction.member.user.id}) in guild ${interaction.guild.name} (ID ${interaction.guild.name}).`);
        logError(`Interaction details:`)
        logError(makeInteractionPrintable(interaction))
        await interactionReplySafely(interaction, "Could not assign role: System error. \nPlease contact an administrator.");
        return
      }

      // Check if user already has the role in question
      const memberAlreadyHasRole = member.roles.cache.some(role => role.id === roleToAssign.id)
      logDebug(memberAlreadyHasRole ? `User already has specified role - using to switch behavior.` : `User currently doesn't have specified role.`)


      try {

        // Do the actual assign logic
        switch (buttonData.action) {
          case ButtonActionMappings.ASSIGN:
            if (memberAlreadyHasRole) {
              logAudit(`Skipping assigning role ${roleToAssign.name} (ID ${roleToAssign.id}) to user ${member.user.globalName} (ID ${member.id}) - member already has role.`)
              await ConditionallyReply(interaction, `You already have the role <@&${roleToAssign.id}>.`, buttonData.silent)
            } else {
              await member.roles.add(roleToAssign)
              logAudit(`Assigned role ${roleToAssign.name} (ID ${roleToAssign.id}) to user ${member.user.globalName} (ID ${member.id}).`)
              await ConditionallyReply(interaction, `Assigned role <@&${roleToAssign.id}>.`, buttonData.silent)
            }
            break;
          case ButtonActionMappings.REMOVE:
            if (!memberAlreadyHasRole) {
              logAudit(`Skipping removing role ${roleToAssign.name} (ID ${roleToAssign.id}) from user ${member.user.globalName} (ID ${member.id}) - member already doesn't have role.`)
              await ConditionallyReply(interaction, `You already don't have the role <@&${roleToAssign.id}>.`, buttonData.silent)
            } else {
              await member.roles.remove(roleToAssign)
              logAudit(`Removed role ${roleToAssign.name} (ID ${roleToAssign.id}) to user ${member.user.globalName} (ID ${member.id}).`)
              await ConditionallyReply(interaction, `Removed role <@&${roleToAssign.id}>.`, buttonData.silent)
            }
            break;
          case ButtonActionMappings.TOGGLE:
            if (memberAlreadyHasRole) {
              await member.roles.remove(roleToAssign)
              logAudit(`Toggle-removed role ${roleToAssign.name} (ID ${roleToAssign.id}) for user ${member.user.globalName} (ID ${member.id}).`)
              await ConditionallyReply(interaction, `Removed role <@&${roleToAssign.id}>.`, buttonData.silent)
            } else {
              await member.roles.add(roleToAssign)
              logAudit(`Toggle-enabled role ${roleToAssign.name} (ID ${roleToAssign.id}) for user ${member.user.globalName} (ID ${member.id}).`)
              await ConditionallyReply(interaction, `Assigned role <@&${roleToAssign.id}>.`, buttonData.silent)
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