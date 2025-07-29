# Installing and running Receptionist

TODO: All of the Discord application bits  
TODO: All of the Docker/Podman parts  
  
1. Set the environment variables as follows:
  - `APP_TOKEN`: The Discord app token which you noted down earlier.
  - `APPLICATION_ID`: The Discord application ID which you noted down earlier.
    - Make sure that the above two values are not swapped.
  - `BOT_OWNER_IDS`: IDs of users who should have access to bot global administration commands.
    - At least one must exist.
    - Right click your username either in the members list on the right panel or on a sent message in Discord, and select "Copy User ID". Paste the value to this environment variable.
    - If specifying multiple users, separate with commas: `0000000000,1111111111,2222222222`
1. If supplying a custom bot icon, place it in `./data/custom-bot-icon.png`.