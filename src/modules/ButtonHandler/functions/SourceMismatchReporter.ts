import { ButtonInteraction, type CacheType } from "discord.js";
import type { ButtonTableEntry } from "../ButtonHandler";
import { EndInteractionSilently } from "./EndInteractionSilently";
import { logError } from "../../../core/Log";
import { makeInteractionPrintable } from "../../../util/MakeInteractionPrintable";

// Checks the incoming interaction's guild, channel, and message ID against those recorded in the database to prevent source forgery
// Returns a list of error strings - length 0 means verification success
export const verifySourceMatch: (interaction: ButtonInteraction<CacheType>, buttonData: ButtonTableEntry) => string[] = (interaction, buttonData) => {

    let errorStrings = [];
    if (buttonData.guild_id !== interaction.guildId) {
      errorStrings.push(`Button data's guild ID (${buttonData.guild_id}) does not match the interaction's guild ID (${interaction.guildId || "None"}).`)
    }
    if (buttonData.channel_id !== interaction.channelId) {
      errorStrings.push(`Button data's channel ID (${buttonData.channel_id}) does not match the interaction's channel ID (${interaction.channelId}).`)
    }
    if (buttonData.message_id !== interaction.message.id) {
      errorStrings.push(`Button data's message ID (${buttonData.message_id}) does not match the interaction's message ID (${interaction.message.id}).`)
    }

    return errorStrings  
}


// Interaction handler that silently fails and reports source mismatch to console
export const handleSourceMismatch = async (interaction: ButtonInteraction<CacheType>, buttonData: ButtonTableEntry, errorStrings: string[]) => {

  logError("Possible security breach: Mismatch found between button's recorded sent location and interaction's location.\nPerhaps is someone trying to forge a button press?\n")

  logError("Discovered mismatches:")
  for (const errorString of errorStrings) {
    logError("- " + errorString)
  }
  logError("\nButton details:")
  logError(JSON.stringify(buttonData, null, 2))
  logError("\nInteraction details:")
  logError(makeInteractionPrintable(interaction))

  await EndInteractionSilently(interaction)
}
