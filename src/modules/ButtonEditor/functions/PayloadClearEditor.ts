import { ContainerBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { type EditorDataType, initUserDataIfNecessary, resetEditorDataForUser } from "./Common";
import { interactionReplySafely, interactionReplySafelyComponents } from "../../../util/InteractionReplySafely";


// Remove button from message being edited
export const clearEditor = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  resetEditorDataForUser(editorData, interaction.user.id)
  const replyContainer = new ContainerBuilder()
    .setAccentColor(0x808080)
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`**Success**`),
      textDisplay => textDisplay
        .setContent(`Editor data cleared.`),
    )

  await interactionReplySafelyComponents(interaction, [replyContainer]);
}