import { ActionRowBuilder, type AnyComponentBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, ChatInputCommandInteraction, MessageFlags, ChannelType, Message } from "discord.js";
import { splitArrayIntoChunks } from "../../../util/SplitArrayIntoChunks";
import { ButtonActionMappings, type EditorDataType, initUserDataIfNecessary } from "./Common";
import { v7 as uuidv7 } from "uuid";
import type { Database } from "better-sqlite3";

// Assembles the components required to submit the assembled message
const buildMessage = (editorData: EditorDataType, userId: string) => {
  // Builds the message data and button-ID-to-role mappings
  // Assumes data is valid and has been sanity-checked ahead of time by the caller
  const userData = editorData.get(userId)!

  // Handle buttons
  // Create action rows and button-ID-to-role mappings
  let buttonRows: ActionRowBuilder<AnyComponentBuilder>[] = []
  let idToRoleMappings: Map<string, {role: string, action: ButtonActionMappings, silent: boolean}> = new Map()

  // Each ActionRow can have up to 5 elements
  // Split buttons array into chunks of 5 each
  const splitButtons = splitArrayIntoChunks(userData.buttons, 5);
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
      // Generate UUID for this button (used for button-to-role mappings later)
      const mappingUuid = uuidv7();
      buttonBuilder.setCustomId(mappingUuid)
      // Add this button to the current action row
      currentActionRow.addComponents(buttonBuilder)
      // Also add this mapping to the mappings table
      idToRoleMappings.set(mappingUuid, {role: button.role.id, action: button.action, silent: button.silent})
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
      .setContent(userData.body!)
    mainDisplayComponents.push(textDisplay)
  }

  return {
    components: mainDisplayComponents.concat(buttonRows),
    idToRoleMappings: idToRoleMappings,
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
    await interaction.reply({ content: sanityCheckResult.error || "Data sanity check failed.", flags: MessageFlags.Ephemeral });
    return
  }

  // Verify that the message can be sent in the current channel
  if (!(interaction.channel?.type == ChannelType.GuildText && interaction.channel.isSendable())) {
    await interaction.reply({ content: "This channel is either not a text channel or is not sendable by the bot.", flags: MessageFlags.Ephemeral });
    return
  }

  // Then build the message components from the current editor data
  const messageData = buildMessage(editorData, interaction.user.id)

  // Then send the message
  let sentMessage: Message<true>;
  try {
    console.log("Attempting to send message:")
    console.log(JSON.stringify(messageData.components))
    sentMessage = await interaction.channel.send({
      components: messageData.components,
      flags: MessageFlags.IsComponentsV2
    })
  } catch (error) {
    await interaction.reply({content: "Failed to send the message. See bot log for more details.", flags: MessageFlags.Ephemeral});
    await interaction.followUp({content: `\`\`\`${JSON.stringify(error)}\`\`\``, flags: MessageFlags.Ephemeral});
    return
  }

  // Now that the sent message is stored in sentMessage, its ID can be logged into the DB
  const insertButton = db.prepare(`INSERT INTO buttons VALUES (@buttonId, @role, @action, @silent, @guildId, @channelId, @messageId)`);

  const insertAllButtons = db.transaction(() => {
    messageData.idToRoleMappings.forEach((value, key) => {
      insertButton.run({
        buttonId: key,
        role: value.role,
        action: value.action,
        silent: value.silent ? 1 : 0,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        messageId: sentMessage.id
      })
    })
  });

  try {
    insertAllButtons();
  } catch (error) {
    console.error("Failed to commit button data to db:");
    console.error(error);
    sentMessage.delete();
    await interaction.reply({content: "Failed to commit button mappings data to the database. See the bot logs for details.", flags: MessageFlags.Ephemeral});
    return;
  }

  // Finally reply
  await interaction.reply({content: "Message sent.\n\nThe current editor data is still retained for sending additional copies of this message; use `/buttoneditor clear` to start afresh.", flags: MessageFlags.Ephemeral});
}