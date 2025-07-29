import {
  readFileSync,
  existsSync,
} from 'fs';
import { updateBotDataJson, type BotDataJson } from './BotData';
import hash from 'object-hash';
import type { Client } from 'discord.js';

export const updateBotIconIfNecessary = async (client: Client<true>, botData: BotDataJson) => {

  let botIcon: NonSharedBuffer;

  // If a custom bot icon is provided, prioritize that
  if (existsSync("./data/custom-bot-icon.png")) {
    botIcon = readFileSync("./data/custom-bot-icon.png");
  } else {
    botIcon = readFileSync("./src/assets/default-bot-icon.png")
  }
  
  // Check if the icon has been modified since last boot; upload if necessary
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