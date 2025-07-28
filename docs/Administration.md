# Administration

This module/set of commands allows for managing and maintaining the bot instance.

### Commands 
- `/ping` - Verifies that the bot is operational.

### Todo
- `/prune` - Cleans up any button entries recorded in the database whose corresponding buttons/messages in Discord no longer exist (i.e. due to the message/buttons having been deleted).
  - Operates on all entries within the guild in which the command is executed.
  - It is recommended to run this after deleting a role-assigning message to prevent dysfunctional entries from filling up the database.
- `/globalprune` - Does the above cleanup but for all guilds the bot is a member of.
  - Requires the user executing the command to be listed as a bot owner - see installation documentation for more information.