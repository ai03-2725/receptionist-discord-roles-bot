import type { ButtonInteraction, CacheType } from "discord.js"


export const EndInteractionSilently = async (interaction: ButtonInteraction<CacheType>) => {
  await interaction.deferReply()
  await interaction.deleteReply()
}