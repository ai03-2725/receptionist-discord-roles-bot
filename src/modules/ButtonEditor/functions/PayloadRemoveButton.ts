import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { type EditorDataType, initUserDataIfNecessary } from "./Common";


// Remove button from message being edited
export const removeButton = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  const buttonId = interaction.options.getInteger('id')! // Guaranteed to exist since required
  if (!userData.buttons.at(buttonId)) {
    await interaction.reply({ content: `Button ID ${buttonId} does not exist.`, flags: MessageFlags.Ephemeral });
    return
  }
  userData?.buttons.splice(buttonId, 1)
  await interaction.reply({ content: `Removed button ID ${buttonId}. There are now ${userData.buttons.length} buttons on this message.`, flags: MessageFlags.Ephemeral });
}