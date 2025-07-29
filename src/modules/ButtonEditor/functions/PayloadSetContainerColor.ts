import { ContainerBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { sanitizeHex } from "../../../util/SanitizeHex";
import { type EditorDataType, initUserDataIfNecessary } from "./Common";
import { interactionReplySafely, interactionReplySafelyComponents } from "../../../util/InteractionReplySafely";


// Set the container color of the message being edited
// Skip supplying the color to delete
export const setContainerColor = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  const containerColor = interaction.options.getString('color');
  if (!containerColor) {
    await interactionReplySafely(interaction, "Removed the button message's container color and disabled container visibility.");
    return
  }
  const sanitizedColor = sanitizeHex(containerColor)
  if (!sanitizedColor) {
    await interactionReplySafely(interaction, `Invalid color "\`${containerColor}\`".\nPlease provide a hex color code.`)
    return
  }
  userData.containerColor = sanitizedColor;

  const replyContainer = new ContainerBuilder()
    .setAccentColor(Number('0x' + sanitizedColor))
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`Container color set to "\`${containerColor}\`" (displayed on this message's container).`),
      textDisplay => textDisplay
        .setContent(`Message container visibility enabled.`)
    )

  await interactionReplySafelyComponents(interaction, [replyContainer]);
  
}