import { 
  ChannelType,
  Events, 
  InteractionContextType, 
  MessageFlags, 
  PermissionFlagsBits, 
  SlashCommandBuilder} from "discord.js";
import { type ModuleParams } from "../../structures/BaseModules";

import { SpecializedCommandModule } from "../../structures/SpecializedCommandModule";
import { type ButtonEditorState } from "./functions/Common";
import { addButton } from "./functions/PayloadAddButton";
import { checkCurrentData } from "./functions/PayloadCheckCurrentData";
import { deployMessage } from "./functions/PayloadDeployMessage";
import { removeButton } from "./functions/PayloadRemoveButton";
import { setBody } from "./functions/PayloadSetBody";
import { setContainerColor } from "./functions/PayloadSetContainerColor";
import { clearEditor } from "./functions/PayloadClearEditor";
import type { Database } from "better-sqlite3";
import { interactionReplySafely } from "../../util/InteractionReplySafely";
import { logDebug, logInfo, logWarn } from "../../core/Log";
import { makeInteractionPrintable } from "../../util/MakeInteractionPrintable";


interface ButtonEditorParams extends ModuleParams {
  db: Database
}


export class ButtonEditor extends SpecializedCommandModule {


  // A map of all editors (user IDs) and their current data
  editorData: Map<string, ButtonEditorState>;

  // The database instance for the bot
  db: Database;


  constructor(params: ButtonEditorParams) {
    logDebug("Initializing ButtonEditor.")
    super(params);
    this.editorData = new Map();

    // Make sure the required table exists on the db
    this.db = params.db;
    logDebug("Creating table buttons in the database if not exists.")
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS buttons(
        button_id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        action INTEGER NOT NULL,
        silent INTEGER NOT NULL,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message_id TEXT NOT NULL
      );`
    );

    // Register the /buttoneditor command and its subcommands
    logDebug("Adding command /buttoneditor to commands list.")
    this.commands.push(new SlashCommandBuilder()
        .setName("buttoneditor")
        .setDescription("Create a role button message.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
        .addSubcommand(subcommand => subcommand 
          .setName("setbody")
          .setDescription("Sets the body text of the button message.")
          .addStringOption(option => option
            .setName("text")
            .setDescription("The body text.")
            .setRequired(true)
          )
        )
        .addSubcommand(subcommand => subcommand
          .setName("setcontainercolor")
          .setDescription("Sets the container color of the button message. Leave empty to disable container mode.")
          .addStringOption(option => option
            .setName("color")
            .setDescription("The container color hex code.")
            .setRequired(false)
          )
        )
        .addSubcommand(subcommand => subcommand
          .setName("addbutton")
          .setDescription("Adds a button to the message under construction.")
          .addStringOption(option => option
            .setName("action")
            .setDescription("The action to execute when this button is pressed.")
            .setRequired(true)
            .addChoices(
              {name: "Assign", value: "ASSIGN"},
              {name: "Remove", value: "REMOVE"},
              {name: "Toggle", value: "TOGGLE"}
            )
          )
          .addRoleOption(option => option
            .setName("role")
            .setDescription("The role to assign/remove/toggle when this button is pressed.")
            .setRequired(true)
          )
          .addStringOption(option => option
            .setName("label")
            .setDescription("The text label for the button. Either a label or emote must exist; both can be supplied together.")
            .setRequired(false)
          )
          .addStringOption(option => option
            .setName("emote")
            .setDescription("The emote label for the button. Either a label or emote must exist; both can be supplied together.")
            .setRequired(false)
          )
          .addBooleanOption(option => option
            .setName("silent")
            .setDescription("Whether or not the bot should skip notifying the user after modifying the role.")
            .setRequired(false)
          )
        )
        .addSubcommand(subcommand => subcommand
          .setName("removebutton")
          .setDescription("Removes a button from the message under construction.")
          .addIntegerOption(option => option
            .setName("id")
            .setDescription("The ID of the button to remove. See `/buttoneditor status`.")
            .setRequired(true)
          )
        )
        .addSubcommand(subcommand => subcommand 
          .setName("status")
          .setDescription("View current editor data and review for deployment.")
        )
        .addSubcommand(subcommand => subcommand
          .setName("deploy")
          .setDescription("Deploys the message currently under construction to the channel where this command is sent.")
        )
        .addSubcommand(subcommand => subcommand 
          .setName("clear")
          .setDescription("Wipes data currently stored in the button message editor.")
        )
      );


    // Interaction handling
    logDebug("Adding interaction handler.")
    this.client.on(Events.InteractionCreate, async interaction => {

      // Commands handling
      // All button editor commands are a subcommand of /buttoneditor, so only respond to that
      if (interaction.isChatInputCommand() && interaction.commandName == "buttoneditor") {

        logDebug("Button editor: Received the following interaction.")
        logDebug(makeInteractionPrintable(interaction))

        // Only allow running in guild text channels; sanity-check its existence
        const activeChannel = interaction.channel?.type === ChannelType.GuildText ? interaction.channel : null;
        if (!activeChannel) {
          logDebug("Interaction came from a non-text channel; stopping.")
          await interactionReplySafely(interaction, 'This command can only be run in text channels.');
          return
        }

        // Get subcommand
        const subcommand = interaction.options.getSubcommand(false)
        if (!subcommand) {
          await interactionReplySafely(interaction, "`/buttoneditor`: button message editor.\nUse subcommands for functionality.");
          return
        }

        // Switch behavior based on subcommand
        switch(subcommand) {
          case "setbody":
            logDebug("Handling /buttoneditor setbody.")
            await setBody(this.editorData, interaction);
            break;
          case "setcontainercolor":
            logDebug("Handling /buttoneditor setcontainercolor.")
            await setContainerColor(this.editorData, interaction);
            break;
          case "addbutton":
            logDebug("Handling /buttoneditor addbutton.")
            await addButton(this.editorData, interaction);
            break;
          case "removebutton":
            logDebug("Handling /buttoneditor removebutton.")
            await removeButton(this.editorData, interaction);
            break;
          case "status":
            logDebug("Handling /buttoneditor status.")
            await checkCurrentData(this.editorData, interaction);
            break;
          case "deploy":
            logDebug("Handling /buttoneditor deploy.")
            await deployMessage(this.editorData, interaction, this.db);
            break;
          case "clear":
            logDebug("Handling /buttoneditor clear.")
            await clearEditor(this.editorData, interaction);
            break;
          default:
            logWarn(`Button editor: Received unknown subcommand "/buttoneditor ${subcommand}".`)
            await interactionReplySafely(interaction, `\`/buttoneditor\`: Unknown subcommand "${subcommand}".`);
            return
        }

      }
    })
    logDebug("ButtonEditor initialized successfully.")
  }
}