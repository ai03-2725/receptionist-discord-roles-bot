import dotenv from 'dotenv';
import { logDebug, logError } from './Log';

export const loadEnvVars = () => {
  // Load dotenv values
  logDebug("Loading additional environment variables from .env.")
  dotenv.config({quiet: !getLogDebug()});
  // Make sure all necessary vars exist
  if (!process.env.APP_TOKEN) {
    logError("Error: Missing APP_TOKEN environment variable. \nPlease supply one either via setting the environment variable or in a .env file.");
    process.exit(1);
  }
  if (!process.env.APPLICATION_ID) {
    logError("Error: Missing APPLICATION_ID environment variable. \nPlease supply one either via setting the environment variable or in a .env file.");
    process.exit(1);
  }
  if (!process.env.BOT_OWNER_IDS) {
    logError("Missing BOT_OWNER_IDS environment variable. \nPlease supply one either via setting the environment variable or in a .env file.")
    process.exit(1);
  }

  // Sanity check log values
  const loggingDebug = process.env.LOG_DEBUG
  if (loggingDebug !== undefined && loggingDebug !== "true" && loggingDebug !== "false") {
    logError("Environment variable LOG_DEBUG is set to a value other than true or false.")
    process.exit(1);
  }
  const loggingAudit = process.env.LOG_AUDIT
  if (loggingAudit !== undefined && loggingAudit !== "true" && loggingAudit !== "false") {
    logError("Environment variable LOG_AUDIT is set to a value other than true or false.")
    process.exit(1);
  }

  // Sanity check owner IDs
  const ownerIds = process.env.BOT_OWNER_IDS!.split(",")
  for (const id of ownerIds) {
    if (!/^[0-9]+$/.test(id)) {
      logError(
`Owner ID "${id}" does not seem to be a valid owner ID. 
Please verify the following:

- The BOT_OWNER_IDS variable is set to either a single Discord user ID or multiple IDs separated by commas.
- If supplying multiple, there should be no commas before the first ID or trailing the last ID.
- If supplying multiple, there should be no spaces, tabs, or other characters - only IDs and commas.`
      )
    }
  }
  logDebug("Finished loading and sanity-checking environment variables.")
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

export const getLogDebug = () => {
  // Don't log debug unless explicitly specified
  return process.env.LOG_DEBUG === "true"
}

export const getLogAudit = () => {
  // Log audits by default 
  return (process.env.LOG_AUDIT === "true" || process.env.LOG_AUDIT === undefined)
}