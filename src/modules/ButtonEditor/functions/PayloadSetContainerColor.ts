import { ContainerBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { sanitizeHex } from "../../../util/SanitizeHex";
import { type EditorDataType, initUserDataIfNecessary } from "./Common";
import { interactionReplySafely, interactionReplySafelyComponents } from "../../../util/InteractionReplySafely";
import { logDebug } from "../../../core/Log";


// Set the container color of the message being edited
// Skip supplying the color to delete
export const setContainerColor = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  const containerColor = interaction.options.getString('color');
  if (!containerColor) {
    logDebug(`Removed container color for ${interaction.user.globalName}'s editorData.`);
    const replyContainer = new ContainerBuilder()
    .setAccentColor(0x808080)
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`**Success**`),
      textDisplay => textDisplay
        .setContent(`Container color removed.`),
      textDisplay => textDisplay
        .setContent(`Message container visibility disabled.`)
    )
    await interactionReplySafelyComponents(interaction, [replyContainer]);
    return
  }
  const sanitizedColor = sanitizeHex(containerColor)
  if (!sanitizedColor) {
    logDebug(`Received invalid color "${containerColor}" for setcontainercolor.`);
    await interactionReplySafely(interaction, `Invalid color "\`${containerColor}\`".\nPlease provide a hex color code.`)
    return
  }
  userData.containerColor = sanitizedColor;
  logDebug(`Assigned container color ${sanitizedColor} for ${interaction.user.globalName}'s editorData.`);

  const replyContainer = new ContainerBuilder()
    .setAccentColor(Number('0x' + sanitizedColor))
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`**Success**`),
      textDisplay => textDisplay
        .setContent(`Container color is now set to "\`${containerColor}\`" (displayed on this message's container).`),
      textDisplay => textDisplay
        .setContent(`Message container visibility enabled.`)
    )

  await interactionReplySafelyComponents(interaction, [replyContainer]);
  
}