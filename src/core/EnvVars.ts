import dotenv from 'dotenv';

export const loadEnvVars = () => {
  // Load dotenv values
  dotenv.config();
  // Make sure all necessary vars exist
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
    process.exit(1);
  }
  // Sanity check owner IDs
  const ownerIds = process.env.BOT_OWNER_IDS!.split(",")
  for (const id of ownerIds) {
    if (!/^[0-9]+$/.test(id)) {
      console.error(
`Owner ID "${id}" does not seem to be a valid owner ID. 
Please verify the following:

- The BOT_OWNER_IDS variable is set to either a single Discord user ID or multiple IDs separated by commas.
- If supplying multiple, there should be no commas before the first ID or trailing the last ID.
- If supplying multiple, there should be no spaces, tabs, or other characters - only IDs and commas.`
      )
    }
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