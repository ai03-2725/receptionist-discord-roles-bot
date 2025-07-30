# Receptionist
A simple Discord bot for self-role-assigning.

## Currently under construction
Please wait for the next stable release.
For more details, see the next revision details in [the v1.0.x readme](https://github.com/ai03-2725/receptionist-discord-roles-bot/blob/v1.0.x/README.md).

<img alt="Button message example" src="./docs/images/button-message-example-2.png" width="50%" />

### Features
- Role-Assigning Buttons
  - Create messages with role-assigning buttons using simple commands
  - Up to 20 buttons per message
  - Assign, remove, or toggle roles on button press
- General
  - Self-hosted - no public instances provided, host your own via Docker/Podman
  - All data is stored in a config JSON file + SQLite database file, making backups and migrations straightforward
  - No paywalls, premium feature gatekeeping, or other limitations beyond the Discord API and your server specs
  - No excess features or overcomplexity - focuses on role assignment and nothing else

### Use cases
- Provide easily self-assignable cosmetic/functional roles
- Create a verification process to prevent unauthorized/bot access to certain channels/servers

--- 
 
### Docs/Commands/How-to
- [Installation and Setup](./docs/Setup.md)
- [Button Message Editor](./docs/ButtonMessageEditor.md)
- [Administration](./docs/Administration.md)

---

## Planned/Todo
- Role assign dropdown menus

