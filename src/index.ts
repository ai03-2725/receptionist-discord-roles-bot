import { 
  Client,
  Events,
  GatewayIntentBits,
  SharedSlashCommand,
} from "discord.js";
import {
  existsSync,
} from 'fs';
import Database from 'better-sqlite3';

import type { CommandModule, Module } from "./structures/BaseModules";
import { PingHandler } from "./modules/PingHandler/PingHandler";
import { createBotDataDirIfNecessary, loadBotDataJson } from "./core/BotData";
import { ButtonEditor } from "./modules/ButtonEditor/ButtonEditor";
import { ButtonHandler } from "./modules/ButtonHandler/ButtonHandler";
import { pushSlashCommandsIfNecessary } from "./core/PushSlashCommands";
import { getAppToken, loadEnvVars } from "./core/EnvVars";
import { updateBotIconIfNecessary } from "./core/UpdateBotIcon";
import { logDebug, logError, logInfo, LogLevel, logWarn } from "./core/Log";
import { AdministrationModule } from "./modules/Administration/Administration";


logInfo(`Starting bot instance.`);

// Load environment variables
loadEnvVars()

// Make sure that the data directory exists
createBotDataDirIfNecessary()

// Load bot config data
let botData = loadBotDataJson();

// Check if sqlite DBs exist, warning the user if they don't
if (!existsSync('./data/bot-data.db')) {
  logWarn("Did not find a ./data/bot-data.db database file - creating one now.")
  logWarn("If you are seeing this message at times that aren't a first boot or after a data reset, please make sure that ./data/bot-data.db is being retained properly.")
}
// Connect to sqlite dbs, creating them if not existent already
logDebug("Opening database")
const db = new Database('./data/bot-data.db');
logDebug("Database successfully opened")


// Create a new client instance
logDebug("Creating client")
const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});


// Create an instance of all bot modules

// Command modules - modules based on CommandModule which provide slash command(s)
logDebug("Loading modules with commands")
const commandModules: CommandModule[] = []
commandModules.push(new PingHandler({client: client}));
commandModules.push(new ButtonEditor({client: client, db: db}));
commandModules.push(new AdministrationModule({client: client, db:db}))

// Non-command modules - these will not be queried for their commands
logDebug("Loading modules without commands")
const nonCommandModules: Module[] = []
nonCommandModules.push(new ButtonHandler({client: client, db: db}))


// Create a global commands list based on the commands list of each module
logDebug("Querying all modules for commands")
let allCommands: SharedSlashCommand[] = [];
for (const module of commandModules) {
  allCommands = allCommands.concat(module.getCommands())
}

// If any changes have occurred to the slash commands since last boot, push changes via REST API
await pushSlashCommandsIfNecessary(allCommands, botData)

// Run once after the bot is operational
client.once(Events.ClientReady, async readyClient => {
	logInfo(`Initialization completed. Logged in as ${readyClient.user.tag}.`);

  // Update avatar if it has changed since last boot
  updateBotIconIfNecessary(readyClient, botData)
});

// Log in to Discord
try {
  client.login(getAppToken());
} catch (error) {
  logError("Bot could not log into Discord.");
  logError("Please verify that you have completed the Discord application setup and that all credentials are valid.");
  process.exit(1);
}

// Handle exits gracefully
const shutdown = (cause: "SIGTERM" | "SIGINT" | "uncaughtException") => {
  logInfo(`Shutting down due to reason: ${cause}`)
  logDebug("Closing database")
  db.close();
  logDebug("Database closed")
  process.exit(cause === "uncaughtException" ? 1 : 0);
}
process
  .on('SIGTERM', () => shutdown('SIGTERM'))
  .on('SIGINT', () => shutdown('SIGINT'))
  .on('uncaughtException', () => shutdown('uncaughtException'));