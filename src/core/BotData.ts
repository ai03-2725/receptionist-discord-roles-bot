import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync
} from 'fs';

export const CURRENT_BOT_CONFIG_VERSION = 2

export type BotDataJson = {
  configVersion: number,
  lastSuccessfulCommandsHash: string,
  lastKnownBotIconHash: string,
}

export const DEFAULT_DATA_JSON: BotDataJson = {
  configVersion: 2,
  lastSuccessfulCommandsHash: "",
  lastKnownBotIconHash: ""
};


export const loadBotDataJson = () => {
  let botData: BotDataJson;
  // Check if bot data file exists
  if (!existsSync('./data/bot-data.json')) {
    // If not, create the data file
    console.warn("Did not find a ./data/bot-data.json - creating one now.")
    console.warn("If you are seeing this message at times that aren't a first boot or after a data reset, please make sure that ./data/bot-data.json is being retained properly.")
    try {
      writeFileSync('./data/bot-data.json', JSON.stringify(DEFAULT_DATA_JSON, null, 2), 'utf-8');
    } catch (error) {
      console.error("Could not write a default ./data/bot-data.json for storing necessary data.")
      process.exit(1);
    }
    botData = structuredClone(DEFAULT_DATA_JSON);
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
    // Check if read-in file is up to date
    if (!botData.configVersion || botData.configVersion < CURRENT_BOT_CONFIG_VERSION) {
      // If not, copy in existing values into a default config so that the missing keys now exist as default values
      const currentBotDataBackup = structuredClone(botData);
      botData = Object.assign(structuredClone(DEFAULT_DATA_JSON), currentBotDataBackup)
      console.log("Bot data file version has been updated.")
    }
  }

  return botData
}


export const updateBotDataJson = (botData: BotDataJson) => {
  try {
    writeFileSync('./data/bot-data.json', JSON.stringify(botData), 'utf-8');
    console.log("Bot data at ./data/bot-data.json written successfully.")
  } catch (error) {
    console.error("Could not write bot config to ./data/bot-data.json.");
    console.error(error);
    process.exit(1);
  }
}


export const createBotDataDirIfNecessary = () => {
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
}