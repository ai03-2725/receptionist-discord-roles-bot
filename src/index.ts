import { 
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SharedSlashCommand,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import dotenv from 'dotenv';
import hash from 'object-hash';
import {
  readFileSync,
  existsSync,
  mkdirSync
} from 'fs';
import Database from 'better-sqlite3';

import type { CommandModule, Module } from "./structures/BaseModules";
import { PingHandler } from "./modules/PingHandler/PingHandler";
import { createBotDataDirIfNecessary, CURRENT_BOT_CONFIG_VERSION, DEFAULT_DATA_JSON, loadBotDataJson, updateBotDataJson, type BotDataJson } from "./core/BotData";
import { ButtonEditor } from "./modules/ButtonEditor/ButtonEditor";
import { ButtonHandler } from "./modules/ButtonHandler/ButtonHandler";
import { pushSlashCommandsIfNecessary } from "./core/PushSlashCommands";
import { getAppToken, loadEnvVars } from "./core/EnvVars";
import { updateBotIconIfNecessary } from "./core/UpdateBotIcon";

// Load environment variables
loadEnvVars()

// Make sure that the data directory exists
createBotDataDirIfNecessary()

// Load bot config data
let botData = loadBotDataJson();

// Check if sqlite DBs exist, warning the user if they don't
if (!existsSync('./data/bot-data.db')) {
  console.warn("Did not find a ./data/bot-data.db database file - creating one now.")
  console.warn("If you are seeing this message at times that aren't a first boot or after a data reset, please make sure that ./data/bot-data.db is being retained properly.")
}
// Connect to sqlite dbs, creating them if not existent already
const db = new Database('./data/bot-data.db');


// Create a new client instance
const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});


// Create an instance of all bot modules

// Command modules - modules based on CommandModule which provide slash command(s)
const commandModules: CommandModule[] = []
commandModules.push(new PingHandler({client: client}));
commandModules.push(new ButtonEditor({client: client, db: db}));

// Non-command modules - these will not be queried for their commands
const nonCommandModules: Module[] = []
nonCommandModules.push(new ButtonHandler({client: client, db: db}))


// Create a global commands list based on the commands list of each module
let allCommands: SharedSlashCommand[] = [];
for (const module of commandModules) {
  allCommands = allCommands.concat(module.getCommands())
}

// If any changes have occurred to the slash commands since last boot, push changes via REST API
await pushSlashCommandsIfNecessary(allCommands, botData)

// Run once after the bot is operational
client.once(Events.ClientReady, async readyClient => {
	console.log(`Initialization completed. Logged in as ${readyClient.user.tag}.`);

  // Update avatar if it has changed since last boot
  updateBotIconIfNecessary(readyClient, botData)
});

// Log in to Discord
client.login(getAppToken());