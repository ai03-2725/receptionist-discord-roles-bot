import { ChatInputCommandInteraction, ContainerBuilder, MessageFlags } from "discord.js"
import { ButtonActionMappings, type EditorDataType, initUserDataIfNecessary } from "./Common"
import { interactionReplySafelyComponents } from "../../../util/InteractionReplySafely"

// Check current message's contents and return a report to the user
export const checkCurrentData = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction) => {
  initUserDataIfNecessary(editorData, interaction.user.id)
  const userData = editorData.get(interaction.user.id)!
  let checksPassed = true

  // Check data
  if (!userData.body || userData.buttons.length == 0 || userData.buttons.length > 20) {
    checksPassed = false
  }

  let buttonsString = "";
  if (userData.buttons.length == 0) {
    buttonsString += "\n\nNone. Please supply at least one with `/buttoneditor addbutton`."
  }
  for (const [index, button] of userData.buttons.entries()) {
    const actionStringForButton = Object.entries(ButtonActionMappings).find(entry => entry[1] == button.action)![0]
    buttonsString += `\n\n*ID ${index}:*\nLabel: ${button.label ? `"${button.label}"` : "None"}; Emote: ${button.emote ? `"${button.emote}"` : "None"}\nRole: ${button.role.name} (ID ${button.role.id}); Action: ${actionStringForButton}; Silent: ${button.silent}`
  }

  const replyContainer = new ContainerBuilder()
    .setAccentColor(userData.containerColor ? Number('0x' + userData.containerColor) : 0x808080)
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent("**Current Editor Data**")
    )
    .addSeparatorComponents(
      separator => separator,
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`**Container Color:**`),
      textDisplay => textDisplay
        .setContent(`${userData.containerColor
          ? `0x${userData.containerColor} (currently displayed to the left)`
          : `None (message will be sent as regular text rather than in a container box like this current message)`
          }`)
    )
    .addSeparatorComponents(
      separator => separator,
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent(`\n\n**Body Text:**`),
      textDisplay => textDisplay
        .setContent(userData.body ? userData.body : "Missing. Please supply with `/buttoneditor bodytext`.")
    )
    .addSeparatorComponents(
      separator => separator,
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent("**Buttons:**"),
      textDisplay => textDisplay
        .setContent(buttonsString)
    )
    .addSeparatorComponents(
      separator => separator,
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay
        .setContent("**Status:**"),
      textDisplay => textDisplay
        .setContent(checksPassed ? "Checks passed; can be deployed with `/buttoneditor deploy`." : "Checks failed; not ready for deployment.")
    )

  await interactionReplySafelyComponents(interaction, [replyContainer])
}