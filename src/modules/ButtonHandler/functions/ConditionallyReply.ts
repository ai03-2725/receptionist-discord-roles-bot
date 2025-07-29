import { ContainerBuilder, MessageFlags, type ButtonInteraction, type CacheType } from "discord.js"
import { EndInteractionSilently } from "./EndInteractionSilently"
import { interactionReplySafely, interactionReplySafelyComponents } from "../../../util/InteractionReplySafely"


export const ConditionallyReply = async (interaction: ButtonInteraction<CacheType>, message: string, silent: boolean) => {
  if (silent) {
    EndInteractionSilently(interaction)
  } else {
    const replyContainer = new ContainerBuilder()
    .setAccentColor(0x808080)
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(message)
    )
    await interactionReplySafelyComponents(interaction, [replyContainer])
  }
}