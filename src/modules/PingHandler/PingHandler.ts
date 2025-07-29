import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, InteractionContextType } from "discord.js";
import { type ModuleParams } from "../../structures/BaseModules";
import { GenericCommandModule } from "../../structures/GenericCommandModule";
import { interactionReplySafely } from "../../util/InteractionReplySafely";

export class PingHandler extends GenericCommandModule {

  constructor(params: ModuleParams) {
    super(params);

    // Add module commands
    // Ping
    this.commands.set(
      // Key
      "ping", [
      // Slash command
      new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Verifies whether the bot is operating or not.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	      .setContexts(InteractionContextType.Guild),
      // Payload
      async (interaction: ChatInputCommandInteraction) => {
        await interactionReplySafely(interaction, 'Reaction bot is operating.');
      }
    ]);
  }

}