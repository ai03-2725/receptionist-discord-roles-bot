import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { type EditorDataType, initUserDataIfNecessary, resetEditorDataForUser } from "./Common";
import { interactionReplySafely } from "../../../util/InteractionReplySafely";


// Remove button from message being edited
export const clearEditor = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  resetEditorDataForUser(editorData, interaction.user.id)
  await interactionReplySafely(interaction, `Editor data cleared.`)
}