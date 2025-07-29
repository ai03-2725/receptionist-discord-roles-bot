import dotenv from 'dotenv';

export const loadEnvVars = () => {
  dotenv.config();
  if (!process.env.APP_TOKEN) {
    console.error("Error: Missing APP_TOKEN environment variable. \nPlease supply one either via setting the environment variable or in a .env file.");
    process.exit(1);
  }
  if (!process.env.APPLICATION_ID) {
    console.error("Error: Missing APPLICATION_ID environment variable. \nPlease supply one either via setting the environment variable or in a .env file.");
    process.exit(1);
  }
  if (!process.env.BOT_OWNER_IDS) {
    console.error("Missing BOT_OWNER_IDS environment variable. \nPlease supply one either via setting the environment variable or in a .env file.")
  }
}


// Util to get env vars
// Guaranteed to exist since loadEnvVars checks for their existence
export const getAppToken = () => {
  return process.env.APP_TOKEN!
}

export const getApplicationId = () => {
  return process.env.APPLICATION_ID!
}

export const getBotOwnerIds = () => {
  return process.env.BOT_OWNER_IDS!.split(",")
}