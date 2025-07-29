import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { type EditorDataType, initUserDataIfNecessary } from "./Common";
import { interactionReplySafely } from "../../../util/InteractionReplySafely";


// Remove button from message being edited
export const removeButton = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  const buttonId = interaction.options.getInteger('id')! // Guaranteed to exist since required
  if (!userData.buttons.at(buttonId)) {
    await interactionReplySafely(interaction, `Button ID ${buttonId} does not exist.`);
    return
  }
  userData?.buttons.splice(buttonId, 1)
  await interactionReplySafely(interaction, `Removed button ID ${buttonId}. There are now ${userData.buttons.length} buttons on this message.`);
}