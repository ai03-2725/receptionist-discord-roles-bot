import type { ButtonInteraction, CacheType } from "discord.js"
import { logDebug } from "../../../core/Log"


export const EndInteractionSilently = async (interaction: ButtonInteraction<CacheType>) => {
  await interaction.deferReply()
  await interaction.deleteReply()
  logDebug("Silently ended interaction.")
}