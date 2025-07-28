import { MessageFlags, type CacheType, type Interaction } from "discord.js";
import type { GenericModuleCommandMap } from "./GenericCommandModule";

export async function DefaultCommandHandler(interaction: Interaction<CacheType>, commandsMap: GenericModuleCommandMap) {
  
  // Commands handling
  if (interaction.isChatInputCommand()) {

    // Search for given command
    const currentCommand = commandsMap.get(interaction.commandName);
    // If the command isn't included in the supplied commands map, return
    if (!currentCommand) {
      return;
    }
    // Otherwise, handle by calling its execute function
    try {
      const [, commandPayload] = currentCommand
      await commandPayload(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while processing this request.', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'There was an error while processing this request.', flags: MessageFlags.Ephemeral });
      }
    }

  }

}