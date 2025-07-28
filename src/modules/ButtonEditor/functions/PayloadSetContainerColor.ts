import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { isValidHex } from "../../../util/IsValidHex";
import { type EditorDataType, initUserDataIfNecessary } from "./Common";


// Set the container color of the message being edited
// Skip supplying the color to delete
export const setContainerColor = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  const containerColor = interaction.options.getString('color');
  if (!containerColor || isValidHex(containerColor)) {
    userData.containerColor = containerColor || undefined;
    await interaction.reply({ content: `${containerColor ? "Updated" : "Removed"} the button message's container color.`, flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ content: `Invalid container color hex code. Please provide a 6-char hex value without the preceding #.`, flags: MessageFlags.Ephemeral });
  }
}