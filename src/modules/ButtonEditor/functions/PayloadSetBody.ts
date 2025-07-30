import { ChatInputCommandInteraction, ContainerBuilder, MessageFlags } from "discord.js";
import { type EditorDataType, initUserDataIfNecessary } from "./Common";
import { interactionReplySafelyComponents } from "../../../util/InteractionReplySafely";
import { logDebug } from "../../../core/Log";


// Set the body text of the message being edited
export const setBody = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  let body = interaction.options.getString('text')!; // Required field
  body = body.replaceAll(/\\n/g, "\n") // Make \n function as newlines
  userData.body = body;
  logDebug(`Updated body text for ${interaction.user.globalName}'s editorData.`);

  const replyContainer = new ContainerBuilder()
    .setAccentColor(0x808080)
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`**Success**`),
      textDisplay => textDisplay
        .setContent(`Updated the button message's body text.`),
      textDisplay => textDisplay
        .setContent(`A preview is shown below.`),
    )
    .addSeparatorComponents(
      separator => separator,
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay
      .setContent(body)
    )

  await interactionReplySafelyComponents(interaction, [replyContainer]);
}