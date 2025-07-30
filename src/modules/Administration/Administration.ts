import { Database } from "better-sqlite3";
import { logDebug } from "../../core/Log";
import { ModuleParams } from "../../structures/BaseModules";
import { SpecializedCommandModule } from "../../structures/SpecializedCommandModule";
import { Events, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { queryAndPrune } from "./functions/QueryAndPrune";
import { getBotOwnerIds } from "../../core/EnvVars";
import { interactionReplySafely } from "../../util/InteractionReplySafely";


interface AdministrationModuleParams extends ModuleParams {
  db: Database
}

export class ButtonEditor extends SpecializedCommandModule {

  // The database instance for the bot
  db: Database;

  constructor(params: AdministrationModuleParams) {
    logDebug("Initializing administration module.")
    super(params);
    this.db = params.db;

    // Register administrative commands
    logDebug("Registering commands.")
    this.commands.push(new SlashCommandBuilder()
      .setName("prune")
      .setDescription("Removes guild-specific obsolete data from the database.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .setContexts(InteractionContextType.Guild)
    );
    this.commands.push(new SlashCommandBuilder()
      .setName("globalprune")
      .setDescription("Removes all obsolete data from the database.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .setContexts(InteractionContextType.Guild)
      .addBooleanOption(option => option
        .setName("purgeoldservers")
        .setDescription("Remove data for servers which the bot has left.")
        .setRequired(true)
      )
    )

    this.client.on(Events.InteractionCreate, async interaction => {

      // Commands handling
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandName === "prune") {
        interaction.deferReply()
        const affectedRows = await queryAndPrune(this.client, this.db, interaction.guild, false)
        interactionReplySafely(interaction, `Successfully pruned ${affectedRows} entries within the guild.`)
      } else if (interaction.commandName === "globalprune") {
        if (!getBotOwnerIds().includes(interaction.user.id)) {
          interactionReplySafely(interaction, "This command may only be executed by the bot owner(s).");
          return
        } else {
          interaction.deferReply()
          const purgeOldServers = interaction.options.getBoolean("purgeoldservers")!
          const affectedRows = await queryAndPrune(this.client, this.db, null, purgeOldServers)
          interactionReplySafely(interaction, `Successfully pruned ${affectedRows} rows globally.`)
        }
      }

    })
  }

}