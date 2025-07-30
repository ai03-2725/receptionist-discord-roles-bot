# Installing and running Receptionist

This guide covers how to install and set up Receptionist to a functional state.

## Creating a Discord Bot Application
1. Open the [Discord developer applications page](https://discord.com/developers/applications) and login (with the account you will be using to invite the bot).
2. Click the New Application button at the top right.
3. Enter a name (i.e. Receptionist), agree to the terms, and create.
4. From the General Information menu that you are greeted with, copy the `Application ID` and note it down somewhere safe where you can reference later.
5. From the Bot menu from the left pane, click the `Reset Token` button to generate a bot token. Note it down somewhere safe.  
   **Do not share or leak this token under any circumstances** as anyone will be able to take over this application and do whatever they wish to the servers it is in.
6. From the Installation menu from the left pane, un-check `User Install` from the Installation Contexts option and save.
7. Disable anyone except yourself from inviting this bot to servers (to prevent others/random people on the internet from abusing the bot for free):
   1. From the Installation menu on the left pane, select `None` for the Install Link option and save.
   2. From the Bot menu on the left pane, disable the Public Bot toggle and save. 


## Inviting the created application
1. Under OAuth2 URL Generator, check the following:
  - `bot` 
  - `applications.commands`
2. Under Bot Permissions, check the following:
  - `Manage roles`: To be able to assign/remove roles.
  - `Send Messages`: To be able to send role assignment messages with buttons.
  - `Read Message History`: To be able to delete role assignment messages sent in the past if necessary.
3. For Integration type, select Guild Install.
4. Copy the generated URL below, and open it in a browser.

At this point, your Discord app should open, and you should be able to add the bot to a guild/server of your choice (ideally one where testing is possible before full deployment).


## Setting up the container
1. Prepare a server capable of running a docker-compose stack (i.e. `almalinux` + `podman` + `podman-compose` (+ `podman-docker` + `dockge` perhaps) or just docker on a 24/7 PC, whatever you prefer).
   - This goes beyond the scope of this guide, so look elsewhere for guides.
   - Make sure the setup is operational by running a hello-world or other container beforehand to rule out such issues.
2. Write a docker-compose.yaml file as follows:  
   ```
   services:
     receptionist:
       image: TODO
       container_name: receptionist
       restart: unless-stopped
       environment:
         - APPLICATION_ID=000000000000000000
         - APP_TOKEN=ABCDABCDABCDABCDABCDABCD
         - BOT_OWNER_IDS=000000000000000000
       volumes:
         - ./data:/app/data
   networks: {}
   ```
   For the volume, add a `:Z` at the end on Podman (or a lowercase `:z` if accessing the folder from another container for backups).
4. Within the docker-compose file, fill in at minimum the required environment variable options:
   - `APP_TOKEN`: The Discord app token which you noted down earlier.
   - `APPLICATION_ID`: The Discord application ID which you noted down earlier.
      - Make sure that the above two values are not swapped.
   - `BOT_OWNER_IDS`: IDs of users who should have access to bot global administration commands.
      - At least one must exist.
      - Right click your username either in the members list on the right panel or on a sent message in Discord, and select "Copy User ID". Paste the value to this environment variable.
      - If specifying multiple users, separate with commas (i.e. `0000000000,1111111111,2222222222`).
   - Optionally `LOG_DEBUG`: If set to `true`, the bot will output debug log messages.
   - Optionally `LOG_AUDIT`: If set to `false`, bht bot will skip printing audit messages (logs for role assigns/removals, commands that create clickable messages, etc).
5. If supplying a custom bot icon, place it in `./data/custom-bot-icon.png`.

## Setting up the bot within your Discord Guild/Server

1. The bot should create a `Receptionist` role within your guild.  
   Move this higher than any role it should be able to assign/remove.
1. Give the `Receptionist` role permissions to read/write to all channels.
1. While the invite URL should have assigned the bot the correct permissions, please make sure the following permissions are enabled for the `Receptionist` role:
  1. `Manage roles`: To be able to assign/remove roles.
  1. `Send Messages and Create Posts`: To be able to send role assignment messages with buttons.
  1. `Read Message History`: To be able to delete role assignment messages sent in the past if necessary.

Once these setup steps are completed, visit the [Button Message Editor documentation](./ButtonMessageEditor.md) to test the bot out.