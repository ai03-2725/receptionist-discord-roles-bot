import { Database } from "better-sqlite3";
import { logDebug } from "../../core/Log";
import { ModuleParams } from "../../structures/BaseModules";
import { SpecializedCommandModule } from "../../structures/SpecializedCommandModule";
import { Events, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { queryAndPrune } from "./functions/QueryAndPrune";
import { getBotOwnerIds } from "../../core/EnvVars";
import { interactionReplySafely } from "../../util/InteractionReplySafely";


interface AdministrationModuleParams extends ModuleParams {
  //db: Database
}

export class AdministrationModule extends SpecializedCommandModule {

  // The database instance for the bot
  //db: Database;

  constructor(params: AdministrationModuleParams) {
    logDebug("Initializing administration module.")
    super(params);
    //this.db = params.db;

    // Register administrative commands
    logDebug("Registering commands.")

    this.client.on(Events.InteractionCreate, async interaction => {

      // Commands handling
      if (!interaction.isChatInputCommand()) return;

        // No logic defined here at the moment due to previously existent database-reliant structure (and their corresponding prune commands) having been removed.

    })
  }

}