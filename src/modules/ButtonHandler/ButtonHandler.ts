import type { Database } from "better-sqlite3";
import { Module, type ModuleParams } from "../../structures/BaseModules";
import { Events, MessageFlags } from "discord.js";
import { handleSourceMismatch, verifySourceMatch } from "./functions/SourceMismatchReporter";
import { ButtonActionMappings } from "../ButtonEditor/functions/Common";
import { ConditionallyReply } from "./functions/ConditionallyReply";
import { interactionReplySafely } from "../../util/InteractionReplySafely";


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
        console.error("Failed to fetch button entry from database:")
        console.error(error)
        await interactionReplySafely(interaction, "Failed to locate info for this button. Please contact the bot administrator.");
        return;
      }

      if (!buttonData) {
        // A button was pressed whose ID is not in the database of buttons managed by the Button Message section.
        // This could be a button used in other parts of the bot, so return silently
        return;
      }

      // Check source integrity
      const errorStrings = verifySourceMatch(interaction, buttonData)
      if (errorStrings.length > 0) {
        await handleSourceMismatch(interaction, buttonData, errorStrings);
        return
      }

      // Sanity check interaction required fields 
      if (!interaction.guild || !interaction.member) {
        console.error(`Interaction somehow lacks guild or member.`);
        await interactionReplySafely(interaction, "Could not assign role: System error. \nPlease contact an administrator.");
        return
      }

      // Find the role to assign
      const roleToAssign = interaction.guild.roles.resolve(buttonData.role)
      if (!roleToAssign) {
        console.error(`Role specified by button ID ${buttonData.button_id} (role ID ${buttonData.role}) does not exist.`);
        await interactionReplySafely(interaction, "Could not assign role: Specified role seems to be missing. \nPlease contact an administrator.");
        return
      }

      // Resolve the member within the guild
      const member = interaction.guild.members.resolve(interaction.member.user.id)
      if (!member) {
        console.error(`Could not resolve user ${interaction.member.user.username} (ID ${interaction.member.user.id}) in guild ${interaction.guild.name} (ID ${interaction.guild.name}).`);
        await interactionReplySafely(interaction, "Could not assign role: System error. \nPlease contact an administrator.");
        return
      }

      // Check if user already has the role in question
      const memberAlreadyHasRole = member.roles.cache.some(role => role.id === roleToAssign.id)


      try {

        // Do the actual assign logic
        switch (buttonData.action) {
          case ButtonActionMappings.ASSIGN:
            if (memberAlreadyHasRole) {
              await ConditionallyReply(interaction, `You already have the role <@&${roleToAssign.id}>.`, buttonData.silent)
            } else {
              await member.roles.add(roleToAssign)
              await ConditionallyReply(interaction, `Assigned role <@&${roleToAssign.id}>.`, buttonData.silent)
            }
            break;
          case ButtonActionMappings.REMOVE:
            if (!memberAlreadyHasRole) {
              await ConditionallyReply(interaction, `You already don't have the role <@&${roleToAssign.id}>.`, buttonData.silent)
            } else {
              await member.roles.remove(roleToAssign)
              await ConditionallyReply(interaction, `Removed role <@&${roleToAssign.id}>.`, buttonData.silent)
            }
            break;
          case ButtonActionMappings.TOGGLE:
            if (memberAlreadyHasRole) {
              await member.roles.remove(roleToAssign)
              await ConditionallyReply(interaction, `Removed role <@&${roleToAssign.id}>.`, buttonData.silent)
            } else {
              await member.roles.add(roleToAssign)
              await ConditionallyReply(interaction, `Assigned role <@&${roleToAssign.id}>.`, buttonData.silent)
            }
            break;
        }
      } catch (error) {
        console.error("Failed to update roles for button press:")
        console.error(error)
        await interactionReplySafely(interaction, "Could not assign role: System error. \nPlease contact an administrator.");
      }
    })
  }
}