import { ChatInputCommandInteraction, MessageFlags, type Interaction, type InteractionReplyOptions } from "discord.js"


// Replies to the given interaction (if possible).
// On error, fails gracefully and logs to the console.
// Defaults to ephemeral reply.
export const interactionReplySafely = async (interaction: Interaction<any>, message: string, ephemeral: boolean = true) => {
  try {
    if (!interaction.isRepliable()) return false;
    // If the interaction was replied or deferred, use followUp instead
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({content: message, flags: (ephemeral ? MessageFlags.Ephemeral : undefined)});
    } else {
      await interaction.reply({content: message, flags: (ephemeral ? MessageFlags.Ephemeral : undefined)});
    }
    return true;
  } catch (error) {
    console.error("Failed to reply to interaction:");
    console.error(error);
    return false;
  }
}

// Same as above, but with ComponentsV2
type ReplyComponentsType = InteractionReplyOptions["components"]

export const interactionReplySafelyComponents = async (interaction: Interaction<any>, components: ReplyComponentsType, ephemeral: boolean = true) => {
  try {
    if (!interaction.isRepliable()) return false;
    // If the interaction was replied or deferred, use followUp instead
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({components: components, flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0)});
    } else {
      await interaction.reply({components: components, flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0)});
    }
    return true;
  } catch (error) {
    console.error("Failed to reply to interaction:");
    console.error(error);
    return false;
  }
}
