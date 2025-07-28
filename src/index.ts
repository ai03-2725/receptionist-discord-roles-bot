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
  writeFileSync,
  existsSync,
  mkdirSync
} from 'fs';
import Database from 'better-sqlite3';

import type { CommandModule, Module } from "./structures/BaseModules";
import { PingHandler } from "./modules/PingHandler/PingHandler";
import { DEFAULT_DATA_JSON, type BotDataJson } from "./structures/BotDataJson";
import { ButtonEditor } from "./modules/ButtonEditor/ButtonEditor";
import { ButtonHandler } from "./modules/ButtonHandler/ButtonHandler";

// Load environment variables
dotenv.config();
const APP_TOKEN = process.env.APP_TOKEN;
if (!APP_TOKEN) {
  console.error("Error: Missing APP_TOKEN environment variable. \nPlease supply one either via setting the environment variable or in a .env file.");
  process.exit(1);
}
const APPLICATION_ID = process.env.APPLICATION_ID;
if (!APPLICATION_ID) {
  console.error("Error: Missing APPLICATION_ID environment variable. \nPlease supply one either via setting the environment variable or in a .env file.");
  process.exit(1);
}

let botData: BotDataJson;

// Check if data directory exists
if (!existsSync('./data')) {
  console.warn("Data directory not found - creating one now.");
  console.warn("If you are seeing this message at times that aren't a first boot or after a data reset, please make sure that the ./data directory is being retained properly.");
  try {
    mkdirSync('./data');
  } catch (error) {
    console.error("Could not create the ./data directory.");
    process.exit(1);
  }
}
// Check if base data file exists
if (!existsSync('./data/bot-data.json')) {
  // If not, create the data file
  console.warn("Did not find a ./data/bot-data.json - creating one now.")
  console.warn("If you are seeing this message at times that aren't a first boot or after a data reset, please make sure that ./data/bot-data.json is being retained properly.")
  try {
    writeFileSync('./data/bot-data.json', JSON.stringify(DEFAULT_DATA_JSON), 'utf-8');
  } catch (error) {
    console.error("Could not write a default ./data/bot-data.json for storing necessary data.")
    process.exit(1);
  }
  botData = DEFAULT_DATA_JSON;
} else {
  // If file exists already, simply read in the data
  let botDataJson: string;
  try {
    botDataJson = readFileSync('./data/bot-data.json', 'utf-8');
  } catch (error) {
    console.error("Failed to read ./data/bot-data.json.");
    console.error(error);
    process.exit(1);
  }
  try {
    botData = JSON.parse(botDataJson)
  } catch (error) {
    console.error("Failed to parse ./data/bot-data.json as JSON data.");
    console.error(error);
    process.exit(1);
  }
}


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


// Create an instance of all command modules

// Command modules - modules based on CommandModule which provide slash command(s)
const commandModules: CommandModule[] = []
commandModules.push(new PingHandler({client: client}));
commandModules.push(new ButtonEditor({client: client, db: db}));

// Non-command modules 
const nonCommandModules: Module[] = []
nonCommandModules.push(new ButtonHandler({client: client, db: db}))


// Create a global commands list based on the commands list of each module
let allCommands: SharedSlashCommand[] = [];
for (const module of commandModules) {
  allCommands = allCommands.concat(module.getCommands())
}

// If any changes have occurred to the slash commands since last boot, push changes via REST API
const commandsHash = hash(allCommands, {unorderedArrays: true});
if (botData.lastSuccessfulCommandsHash === commandsHash) { 
  console.log("Commands hash match - continuing without redundant register update.")
} else {
  // Changes detected, register all known commands via REST API
  console.log("Commands hash has changed - pushing latest data via REST API.")
  let registerCommandsList: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  allCommands.forEach(command => {
    registerCommandsList.push(command.toJSON());
  })
  const rest = new REST().setToken(APP_TOKEN);
  (async () => {
    try {
      console.log(`Pushing ${registerCommandsList.length} application commands.`);
      const data = await rest.put(
        Routes.applicationCommands(APPLICATION_ID),
        { body: registerCommandsList },
      );

      console.log(`Successfully registered application commands. Returned response:`);
      console.log(data);
      // Update known good hash
      botData.lastSuccessfulCommandsHash = commandsHash;
      try {
        writeFileSync('./data/bot-data.json', JSON.stringify(botData), 'utf-8')
      } catch (error) {
        console.error("Could not write updated data to ./data/bot-data.json.")
        console.error(error);
        process.exit(1);
      }
      console.log("Wrote updated commands hash to ./data/bot-data.json.")
    } catch (error) {
      console.error("Failed to push application commands.");
      console.error(error);
      process.exit(1);
    }
  })();
}

// Run once after the bot is operational
client.once(Events.ClientReady, async readyClient => {
	console.log(`Initialization completed. Logged in as ${readyClient.user.tag}.`);
  readyClient.user.setAvatar('./src/assets/icon.png')
});


// Log in to Discord
client.login(APP_TOKEN);