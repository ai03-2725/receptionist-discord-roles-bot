# Receptionist
A simple Discord bot that handles self-role-assigning.



### Currently in progress
Please wait for a stable release.  



### Features
- Role-Assigning Buttons
  - Create messages with role self-assign buttons using simple commands
  - Up to 20 buttons per message
  - Assign, remove, or toggle roles on button press
- General
  - Self-hosted - no public instances provided, host your own via Docker/Podman (todo)
  - All data is stored in a config JSON file + SQLite database file, making backups and migrations straightforward
  - No paywalls, premium feature gatekeeping, or other limitations beyond the Discord API and your server specs
  - No excess features or overcomplexity - focuses on role assignment and nothing else

### Use cases
- Provide easily self-assignable cosmetic/functional roles
- Create a verification process to prevent unauthorized/bot access to certain channels/servers

--- 
 
### Docs/How-to
- [Button Message Editor](./docs/ButtonMessageEditor.md)

---

# Todo
- Make hex color input more flexible (with or without preceding hash, trim on server-side)
- Add sanity checks on emote inputs
- Provide feedback on each edit command
- Modularize ButtonHandler
- Add prune support to clean up obsolete database entries
- Cleanup logging, add logging where useful
- Add bot config options (bot owner IDs for global prune permissions, log level)
- Add rate limiting
- Docker containerize
- Document installation process

## Planned
- Role assign dropdown menus

