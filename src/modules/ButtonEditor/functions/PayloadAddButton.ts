import { type ChatInputCommandInteraction, MessageFlags, type Role, type APIRole, ContainerBuilder } from "discord.js";
import { ButtonActionMappings, type EditorDataType, initUserDataIfNecessary } from "./Common";
import { interactionReplySafely, interactionReplySafelyComponents } from "../../../util/InteractionReplySafely";
import { checkIfValidEmoji } from "../../../util/CheckIfValidEmoji";
import { logDebug, logWarn } from "../../../core/Log";


// Add button to message being edited
export const addButton = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  if (userData.buttons.length >= 20) {
    logDebug("Cancelled attempt to add more than 20 buttons.")
    await interactionReplySafely(interaction, `Cannot add more buttons beyond the current 20 per message due to Discord limitations (Max 5 rows - 4x rows of 5x buttons + 1x row reserved for the main message data).`);
    return
  }

  const emote = interaction.options.getString('emote')
  const label = interaction.options.getString('label')

  // Either an emote or label must be provided
  if (!emote && !label) {
    logDebug("Cancelled button add - missing both emote and label.")
    await interactionReplySafely(interaction, `Please provide either an emote or label for this button.`);
    return
  }

  // If an emote is provided, verify that it's a valid emoji
  if (emote) {
    const validEmote = await checkIfValidEmoji(emote, interaction.guild!) // Guild should always exist since the command /buttoneditor is limited to guild text channels
    if (!validEmote) {
      logDebug(`Cancelled button add - invalid emote ${emote}.`)
      await interactionReplySafely(interaction, `Emote "\`${emote}\`" doesn't seem to be a valid emoji within this guild/server.`)
      return;
    }
    logDebug(`Emote ${emote} verified as valid.`)
  }
  
  // Sanity checks passed, push button onto editor data
  userData.buttons.push({
    emote: emote || undefined,
    label: label || undefined,
    role: <Role | APIRole>interaction.options.getRole('role'), // Guaranteed to exist since it's a required role option field
    action: ButtonActionMappings[<"ASSIGN" | "REMOVE" | "TOGGLE">interaction.options.getString('action')], // Guaranteed to be one of these three since it's a required choice field
    silent: interaction.options.getBoolean('silent') || false
  })
  logDebug(`Added button to user ${interaction.user.globalName}'s editor data.`)

  // Reply 
  const replyContainer = new ContainerBuilder()
    .setAccentColor(0x808080)
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`**Success**`),
      textDisplay => textDisplay
        .setContent(`Button added. There ${userData.buttons.length === 1 ? "is" : "are"} now ${userData.buttons.length} button${userData.buttons.length !== 1 ? "s" : ""} on this message.`),
      textDisplay => textDisplay
        .setContent(`Added data is shown below for confirmation.`)
    )
    .addSeparatorComponents(
      separator => separator
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(
`- Button ID: ${userData.buttons.length - 1}
- Action: ${ButtonActionMappings[<"ASSIGN" | "REMOVE" | "TOGGLE">interaction.options.getString('action')]}
- Role: <@&${interaction.options.getRole('role')!.id}>
- Label: ${label ? `\`${label}\`` : "None"}
- Emote: ${emote ? emote : "None"}
- Silent: ${interaction.options.getBoolean('silent')}`),
    )

  await interactionReplySafelyComponents(interaction, [replyContainer]);
}