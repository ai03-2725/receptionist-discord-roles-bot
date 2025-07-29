import { type ChatInputCommandInteraction, MessageFlags, type Role, type APIRole } from "discord.js";
import { ButtonActionMappings, type EditorDataType, initUserDataIfNecessary } from "./Common";
import { interactionReplySafely } from "../../../util/InteractionReplySafely";
import { checkIfValidEmoji } from "../../../util/CheckIfValidEmoji";


// Add button to message being edited
export const addButton = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  if (userData.buttons.length >= 20) {
    await interactionReplySafely(interaction, `Cannot add more buttons beyond the current 20 per message due to Discord limitations (Max 5 rows - 4x rows of 5x buttons + 1x row reserved for the main message data).`);
    return
  }

  const emote = interaction.options.getString('emote')
  const label = interaction.options.getString('emote')

  // Either an emote or label must be provided
  if (!emote && !label) {
    await interactionReplySafely(interaction, `Please provide either an emote or label for this button.`);
    return
  }

  // If an emote is provided, verify that it's a valid emoji
  if (emote) {
    const validEmote = await checkIfValidEmoji(emote, interaction.guild!) // Guild should always exist since the command /buttoneditor is limited to guild text channels
    if (!validEmote) {
      await interactionReplySafely(interaction, `Emote "\`${emote}\`" doesn't seem to be a valid emoji within this guild/server.`)
      return;
    }
  }
  
  // Sanity checks passed, push button onto editor data
  userData.buttons.push({
    emote: interaction.options.getString('emote') || undefined,
    label: interaction.options.getString('label') || undefined,
    role: <Role | APIRole>interaction.options.getRole('role'), // Guaranteed to exist since it's a required role option field
    action: ButtonActionMappings[<"ASSIGN" | "REMOVE" | "TOGGLE">interaction.options.getString('action')], // Guaranteed to be one of these three since it's a required choice field
    silent: interaction.options.getBoolean('silent') || false
  })
  await interactionReplySafely(interaction, `Added button ID ${userData.buttons.length - 1}. There are now ${userData.buttons.length} buttons on this message.`);
}