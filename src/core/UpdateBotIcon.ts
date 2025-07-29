import {
  readFileSync,
  existsSync,
} from 'fs';
import { updateBotDataJson, type BotDataJson } from './BotData';
import hash from 'object-hash';
import type { Client } from 'discord.js';

export const updateBotIconIfNecessary = async (client: Client<true>, botData: BotDataJson) => {
  // Check for existence of bot icon
  if (!existsSync("./data/bot-icon.png")) {
    console.log("Bot icon not found at ./data/bot-icon.png. Please supply one if desired.")
  } 
  // If it exists, check its hash and upload if changed from last known value
  else {
    const botIcon = readFileSync("./data/bot-icon.png")
    const botIconHash = hash(botIcon)
    if (botData.lastKnownBotIconHash !== botIconHash) {
      console.log("Bot icon has been modified - uploading new version.");
      try {
        await client.user.setAvatar('./src/assets/icon.png')
        console.log("Bot icon updated.")
        botData.lastKnownBotIconHash = botIconHash;
        updateBotDataJson(botData);
      } catch (error) {
        console.error("Could not update bot's icon:")
        console.error(error)
      }
    }
  }
}