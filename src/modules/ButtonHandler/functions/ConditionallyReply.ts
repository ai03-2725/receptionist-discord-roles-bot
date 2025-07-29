import { MessageFlags, type ButtonInteraction, type CacheType } from "discord.js"
import { EndInteractionSilently } from "./EndInteractionSilently"
import { interactionReplySafely } from "../../../util/InteractionReplySafely"


export const ConditionallyReply = async (interaction: ButtonInteraction<CacheType>, message: string, silent: boolean) => {
  if (silent) {
    EndInteractionSilently(interaction)
  } else {
    await interactionReplySafely(interaction, message)
  }
}