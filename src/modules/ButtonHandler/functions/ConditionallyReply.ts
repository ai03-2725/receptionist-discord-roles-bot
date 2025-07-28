import { MessageFlags, type ButtonInteraction, type CacheType } from "discord.js"
import { EndInteractionSilently } from "./EndInteractionSilently"


export const ConditionallyReply = async (interaction: ButtonInteraction<CacheType>, message: string, silent: boolean) => {
  if (silent) {
    EndInteractionSilently(interaction)
  } else {
    await interaction.reply({content: message, flags: MessageFlags.Ephemeral})
  }
}