import { Database } from "better-sqlite3"
import { Channel, Client, Guild, Message, Sweepers } from "discord.js"
import { ButtonTableEntry } from "../../ButtonHandler/ButtonHandler"
import { logAudit, logDebug, logError } from "../../../core/Log";

// Returns true if entry should be kept
// Returns false if entry should be removed
const checkEntry = async (
  client: Client,
  dbEntry: ButtonTableEntry,
  purgeOldServers: boolean,
  guildsMap: Map<string, Guild | null>,
  channelsMap: Map<string, (Channel | null)>
) => {
  logDebug(`Checking entry ${dbEntry.button_id}`)

  // First attempt to resolve the guild of this entry
  let guild: Guild;

  // If the guild is already cached, get it from the cache
  if (guildsMap.has(dbEntry.guild_id)) {
    guild = guildsMap.get(dbEntry.guild_id)
  }
  // Otherwise fetch it
  else {
    try {
      guild = await client.guilds.fetch(dbEntry.guild_id);
    } catch (error) {
      // The guild fetch will fail if the bot is no longer a member of the guild
      guild = null;
    }
    // Store this guild into the cache
    guildsMap.set(dbEntry.guild_id, guild)
  }

  // Handle cases where the guild is null (bot has been removed
  if (!guild) {
    if (purgeOldServers) {
      logAudit(`Marking button ID ${dbEntry.button_id} for deletion - guild is nonexistent and purgeOldServers is true`)
      return false
    } else {
      logDebug(`Marking for keeping - guild is nonexistent and purgeOldServers is false`)
      return true
    }
  }

  // Make sure the guild is online/accessible before continuing further
  if (!guild.available) {
    // Pass for now since can't verify anything further
    logDebug(`Marking for keeping - guild is unavailable and cannot be tested further`)
    return true
  }

  // Then get the channel
  // Same sort of deal as fetching the guild
  let channel: Channel;

  if (channelsMap.has(dbEntry.channel_id)) {
    channel = channelsMap.get(dbEntry.channel_id);
  } else {
    try {
     channel = await guild.channels.fetch(dbEntry.channel_id);     
    } catch (error) {
      channel = null;
    }
    channelsMap.set(dbEntry.channel_id, channel)
  }

  if (!channel) {
    // If channel no longer exists, messages aren't recoverable so remove them
    logAudit(`Marking button ID ${dbEntry.button_id} for deletion - channel is nonexistent`)
    return false
  }

  // Finally get the message
  // Messages should only be sendable into text channels to begin with, so return null otherwise
  if (!channel.isTextBased()) {
    return false
  }
  let message: Message;
  try {
    message = await channel.messages.fetch(dbEntry.message_id);
  } catch (error) {
    message = null;
  }

  // If message still exists, return true
  // If dne, return false
  if (!message) {
    logAudit(`Marking button ID ${dbEntry.button_id} for deletion - message is nonexistent`);
    return false
  } else {
    logDebug(`Marking for keeping - message exists`);
    return true
  }

}

// Runs the prune operations
// Returns the number of affected entries
export const queryAndPrune = async (client: Client, db: Database, guild: Guild | null, purgeOldServers: boolean) => {

  logAudit(`Running prune ${guild ? `on guild "${guild.name}" (ID ${guild.id})` : "globally"}`)

  // Invalidate message cache since it can hold desynced/obsolete data
  if (!guild) {
    client.sweepers.sweepMessages(() => true)
  } else {
    client.sweepers.sweepMessages((value, key, collection) => value.guildId === guild.id)
  }
  

  // Create a cache of guilds and channels to avoid excess access to Discord's API
  // Null = guild/channel was deleted
  let guildsMap: Map<string, Guild | null> = new Map()
  let channelsMap: Map<string, Channel | null> = new Map()

  // Handle button message entries
  let buttonEntriesToRemove: ButtonTableEntry[] = []

  // If guild is specified, only check matching entries
  if (guild) {
    const buttonsSearchStatement = db.prepare('SELECT * FROM buttons WHERE guild_id = ?')
    for (const entry of buttonsSearchStatement.iterate(guild.id) as IterableIterator<ButtonTableEntry>) {
      const keepEntry = await checkEntry(client, entry, purgeOldServers, guildsMap, channelsMap)
      if (!keepEntry) {
        buttonEntriesToRemove.push(entry)
      }
    }
  }
  // Otherwise check everything
  else {
    const buttonsSearchStatement = db.prepare('SELECT * FROM buttons')
    for (const entry of buttonsSearchStatement.iterate() as IterableIterator<ButtonTableEntry>) {
      const keepEntry = await checkEntry(client, entry, purgeOldServers, guildsMap, channelsMap)
      if (!keepEntry) {
        buttonEntriesToRemove.push(entry)
      }
    }
  }

  // All entries to remove are now in entriesToRemove[]
  // Run delete queries on all
  const buttonsDeleteStatement = db.prepare('DELETE FROM buttons WHERE (button_id = @button_id AND guild_id = @guild_id)')
  const pruneAllButtonEntries = db.transaction((entries: ButtonTableEntry[]) => {
    for (const entry of entries) {
      logAudit(`Pruning button entry ID ${entry.button_id}`)
      const queryResults = buttonsDeleteStatement.run(entry)
      if (queryResults.changes !== 1) {
        logError(`Rows affected in a delete query was ${queryResults.changes} rather than 1 during a prune.`)
        logError("Database entry:")
        logError(entry)
        logError(`Rolling back changes.`)
        throw new Error("Rows affected in a delete query was not equal to 1 during a prune.")
      }
    }
  })

  try {
    pruneAllButtonEntries(buttonEntriesToRemove)
  } catch (error) {
    logError(error)
    return -1
  }

  logAudit(`Prune ${guild ? `on guild "${guild.name}" (ID ${guild.id})` : "on all guilds"} completed`)
  
  return buttonEntriesToRemove.length

}