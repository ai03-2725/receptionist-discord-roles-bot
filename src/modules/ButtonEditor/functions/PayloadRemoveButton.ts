import { ContainerBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { type EditorDataType, initUserDataIfNecessary } from "./Common";
import { interactionReplySafely, interactionReplySafelyComponents } from "../../../util/InteractionReplySafely";
import { logDebug } from "../../../core/Log";


// Remove button from message being edited
export const removeButton = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  const buttonId = interaction.options.getInteger('id')! // Guaranteed to exist since required
  if (!userData.buttons.at(buttonId)) {
    logDebug(`Tried to remove nonexistent button ID ${buttonId}.`)
    await interactionReplySafely(interaction, `Button ID ${buttonId} does not exist.`);
    return
  }
  userData?.buttons.splice(buttonId, 1)
  logDebug(`Removed button ID ${buttonId} from user ${interaction.user.globalName}'s editor data.`)

  const replyContainer = new ContainerBuilder()
    .setAccentColor(0x808080)
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`**Success**`),
      textDisplay => textDisplay
        .setContent(`Removed specified button ID ${buttonId}.`),
      textDisplay => textDisplay
        .setContent(`There are now ${userData.buttons.length} buttons on this message - view with \`/buttoneditor status\``),
    )

  await interactionReplySafelyComponents(interaction, [replyContainer]);
}