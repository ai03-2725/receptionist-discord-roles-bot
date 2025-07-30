import { ActionRowBuilder, type AnyComponentBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, ChatInputCommandInteraction, MessageFlags, ChannelType, Message } from "discord.js";
import { splitArrayIntoChunks } from "../../../util/SplitArrayIntoChunks";
import { ButtonActionMappings, type EditorDataType, encodeRoleButtonCustomId, initUserDataIfNecessary } from "./Common";
import { v7 as uuidv7 } from "uuid";
import type { Database } from "better-sqlite3";
import { interactionReplySafely } from "../../../util/InteractionReplySafely";
import { logAudit, logDebug, logError } from "../../../core/Log";
import { makeInteractionPrintable } from "../../../util/MakeInteractionPrintable";

// Assembles the components required to submit the assembled message
const buildMessage = (editorData: EditorDataType, userId: string) => {
  // Builds the message data and button-ID-to-role mappings
  // Assumes data is valid and has been sanity-checked ahead of time by the caller
  const userData = editorData.get(userId)!

  // Handle buttons
  let buttonRows: ActionRowBuilder<AnyComponentBuilder>[] = []

  // Each ActionRow can have up to 5 elements
  // Split buttons array into chunks of 5 each
  const splitButtons = splitArrayIntoChunks(userData.buttons, 5);
  logDebug("Button data:")
  logDebug(splitButtons)

  // Maintain an incremental button ID across the nested loops
  let currentButtonId = 0;
  for (const chunk of splitButtons) {
    const currentActionRow = new ActionRowBuilder()
    for (const button of chunk) {
      const buttonBuilder = new ButtonBuilder().setStyle(ButtonStyle.Primary);
      if (button.label) {
        buttonBuilder.setLabel(button.label)
      }
      if (button.emote) {
        buttonBuilder.setEmoji(button.emote)
      }
      // Generate custom ID
      const customId = encodeRoleButtonCustomId({
        deduplicationId: currentButtonId,
        actionType: button.action,
        silent: button.silent
      }, button.role.id)
      if (!customId) {
        throw new Error("Custom ID failed to generate.") //TODO: Handle more gracefully
      }
      buttonBuilder.setCustomId(customId)
      // Add this button to the current action row
      currentActionRow.addComponents(buttonBuilder)
      // Increment the button ID
      currentButtonId += 1;
    }
    // Once all buttons of the chunk have been processed, add the action row to the list of action rows
    buttonRows.push(currentActionRow)
  }

  // Build the components array
  // Should include either a TextDisplay or Container depending on whether the containerColor option is set 
  let mainDisplayComponents: any[] = []
  if (userData.containerColor) {
    const container = new ContainerBuilder()
      .setAccentColor(Number('0x' + userData.containerColor))
      .addTextDisplayComponents(
        textDisplay => textDisplay
          .setContent(userData.body!)
      )
    mainDisplayComponents.push(container)
  } else {
    const textDisplay = new TextDisplayBuilder()
      .setContent(userData.body)
    mainDisplayComponents.push(textDisplay)
  }

  logDebug("Message building completed.")
  logDebug("Message components:")
  logDebug(mainDisplayComponents.concat(buttonRows))

  return {
    components: mainDisplayComponents.concat(buttonRows),
  }
}


// Sanity checks the current editor message data prior to assembly
const sanityCheckData: (editorData: EditorDataType, userId: string) => { success: boolean, error?: string | undefined } = (editorData, userId) => {
  initUserDataIfNecessary(editorData, userId);
  const userData = editorData.get(userId)!;

  if (!userData.body) {
    return {
      success: false,
      error: "Body text is missing."
    }
  }
  else if (userData.buttons.length == 0) {
    return {
      success: false,
      error: "Provide at minimum 1 role button."
    }
  }
  else if (userData.buttons.length > 20) {
    // Shouldn't occur, but just in case
    return {
      success: false,
      error: `The maximum number of buttons per message is 20; there are currently ${userData.buttons.length} supplied.`
    }
  }
  for (const [index, button] of userData.buttons.entries()) {
    if (!button.label && !button.emote) {
      // This also shouldn't occur, but just in case
      return {
        success: false,
        error: `Button ID ${index} is missing both a label and emote.`
      }
    }
  }
  return {
    success: true
  }
}


// Sends the assembled message if possible
export const deployMessage = async (editorData: EditorDataType, interaction: ChatInputCommandInteraction, db: Database) => {
  // First sanity check the current data
  const sanityCheckResult = sanityCheckData(editorData, interaction.user.id)
  if (!sanityCheckResult.success) {
    logDebug(`Sanity check on message failed: ${sanityCheckResult}`)
    logDebug(editorData.get(interaction.user.id))
    await interactionReplySafely(interaction, sanityCheckResult.error || "Data sanity check failed.");
    return
  }

  // Verify that the message can be sent in the current channel
  if (!(interaction.channel?.type == ChannelType.GuildText && interaction.channel.isSendable())) {
    logDebug(`Failed to post message to non-guild-text-channel.`)
    logDebug(interaction.channel)
    await interactionReplySafely(interaction, "This channel is either not a text channel or is not sendable by the bot.");
    return
  }

  // Then build the message components from the current editor data
  const messageData = buildMessage(editorData, interaction.user.id);

  logDebug(`Attempting to send the message to the following channel.`)
  logDebug(interaction.channel)

  // Then send the message
  let sentMessage: Message<true>;
  try {
    sentMessage = await interaction.channel.send({
      components: messageData.components,
      flags: MessageFlags.IsComponentsV2
    })
  } catch (error) {
    logError("Failed to send a button message.")
    logError(error)
    logError("Message data:")
    logError(messageData)
    logError("Interaction details:")
    logError(makeInteractionPrintable(interaction))
    await interactionReplySafely(interaction, "Failed to send the message. See bot log for more details.\n\nMake sure that the bot has permissions to send messages in this channel.")
    return
  }

  // Finally reply
  logAudit(`User ${interaction.user.globalName} (ID ${interaction.user.id}) created a button message in guild ${interaction.guild!.name} (ID ${interaction.guildId}).`)
  await interactionReplySafely(interaction, "Message sent.\n\nThe current editor data is still retained for sending additional copies of this message; use `/buttoneditor clear` to start afresh.");
}