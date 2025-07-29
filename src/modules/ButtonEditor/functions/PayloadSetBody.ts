import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { type EditorDataType, initUserDataIfNecessary } from "./Common";
import { interactionReplySafely } from "../../../util/InteractionReplySafely";


// Set the body text of the message being edited
export const setBody = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  const body = interaction.options.getString('text');
  userData.body = body || undefined;
  await interactionReplySafely(interaction, `${body ? "Updated" : "Cleared"} the button message's body text.`);
}