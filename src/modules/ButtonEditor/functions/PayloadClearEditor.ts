import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { type EditorDataType, initUserDataIfNecessary, resetEditorDataForUser } from "./Common";


// Remove button from message being edited
export const clearEditor = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  resetEditorDataForUser(editorData, interaction.user.id)
  await interaction.reply({ content: `Editor data cleared.`, flags: MessageFlags.Ephemeral });
}