import { type ChatInputCommandInteraction, MessageFlags, type Role, type APIRole } from "discord.js";
import { ButtonActionMappings, type EditorDataType, initUserDataIfNecessary } from "./Common";


// Add button to message being edited
export const addButton = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  if (userData.buttons.length >= 20) {
    await interaction.reply({ content: `Cannot add more buttons beyond the current 20 per message due to Discord limitations (Max 5 rows - 4x rows of 5x buttons + 1x row reserved for the main message data).`, flags: MessageFlags.Ephemeral });
    return
  }
  // Either an emote or label must be provided
  if (!interaction.options.getString('emote') && !interaction.options.getString('label')) {
    await interaction.reply({ content: `Please provide either an emote or label for this button.`, flags: MessageFlags.Ephemeral });
    return
  }

  // TODO: Sanity check emote
  userData.buttons.push({
    emote: interaction.options.getString('emote') || undefined,
    label: interaction.options.getString('label') || undefined,
    role: <Role | APIRole>interaction.options.getRole('role'), // Guaranteed to exist since it's a required role option field
    action: ButtonActionMappings[<"ASSIGN" | "REMOVE" | "TOGGLE">interaction.options.getString('action')], // Guaranteed to be one of these three since it's a required choice field
    silent: interaction.options.getBoolean('silent') || false
  })
  await interaction.reply({ content: `Added button ID ${userData.buttons.length - 1}. There are now ${userData.buttons.length} buttons on this message.`, flags: MessageFlags.Ephemeral });
}