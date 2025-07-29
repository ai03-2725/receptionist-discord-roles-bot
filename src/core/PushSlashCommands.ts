import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody, type SharedSlashCommand } from "discord.js";
import { updateBotDataJson, type BotDataJson } from "./BotData";
import { getApplicationId, getAppToken } from "./EnvVars";
import hash from 'object-hash';


export const pushSlashCommandsIfNecessary = async (allCommands: SharedSlashCommand[], botData: BotDataJson) => {
  const commandsHash = hash(allCommands, {unorderedArrays: true});
  if (botData.lastSuccessfulCommandsHash === commandsHash) { 
    console.log("Commands hash identical to what is recorded - skipping re-upload")
    return
  } else {
    // Changes detected, register all known commands via REST API
    console.log("Commands hash has changed - pushing latest data via REST API.")
    let registerCommandsList: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    allCommands.forEach(command => {
      registerCommandsList.push(command.toJSON());
    })
    const rest = new REST().setToken(getAppToken());
    (async () => {
      try {
        console.log(`Pushing ${registerCommandsList.length} application commands.`);
        const data = await rest.put(
          Routes.applicationCommands(getApplicationId()),
          { body: registerCommandsList },
        );

        console.log(`Successfully registered application commands. Returned response:`);
        console.log(data);
        // Update known good hash
        botData.lastSuccessfulCommandsHash = commandsHash;
        updateBotDataJson(botData);
      } catch (error) {
        console.error("Failed to push application commands.");
        console.error(error);
        process.exit(1);
      }
    })();
  }
}