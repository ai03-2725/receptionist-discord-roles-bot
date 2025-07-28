import { ButtonInteraction, type CacheType } from "discord.js";
import type { ButtonTableEntry } from "../ButtonHandler";

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

  console.error("Possible security breach: Mismatch found between button's recorded sent location and interaction's location.\nPerhaps is someone trying to forge a button press?\n")

  console.error("Discovered mismatches:")
  for (const errorString of errorStrings) {
    console.error("- " + errorString)
  }
  console.error("\nButton details:")
  console.error(JSON.stringify(buttonData, null, 2))
  console.error("\nInteraction details:")
  console.error(JSON.stringify(interaction, (key, value) => typeof value === "bigint" ? value.toString() : value, 2))

  await interaction.deferReply()
  await interaction.deleteReply()
}
