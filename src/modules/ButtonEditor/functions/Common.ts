import { type Role, type APIRole, ButtonStyle } from "discord.js";
import { logDebug, logError, logWarn } from "../../../core/Log";
import { encodePublicInteractionCustomId, parseCustomIdPublicInteractionType, PublicInteractionCategory } from "../../../util/CustomIDEncodings";

export enum ButtonActionMappings {
  "ASSIGN" = 0,
  "REMOVE" = 1,
  "TOGGLE" = 2
}

type ButtonEntry = {
  emote: string | undefined,
  label: string | undefined,
  role: Role | APIRole,
  action: ButtonActionMappings,
  silent: boolean,
  style: ButtonStyle
}


// Structure for holding the current button-message data per editor user
export type ButtonEditorState = {

  // Message contents
  body: string | undefined;
  containerColor: string | undefined; // If set, switches message to embed container style

  // Buttons list
  buttons: ButtonEntry[];
}


export const EMPTY_BUTTONEDITOR_STATE: ButtonEditorState = {
  body: undefined,
  containerColor: undefined,
  buttons: []
}


export type EditorDataType = Map<string, ButtonEditorState>


// Clear editor data for given user
export const resetEditorDataForUser = (editorData: EditorDataType, userId: string) => {
  logDebug(`Initializing editor data for user ${userId}`);
  editorData.set(userId, structuredClone(EMPTY_BUTTONEDITOR_STATE))
}


// Initializes editor data for a given user if it doesn't exist yet
export const initUserDataIfNecessary = (editorData: EditorDataType, userId: string) => {
  if (!editorData.get(userId)) {
    resetEditorDataForUser(editorData, userId)
  }
}


// - Role assign button custom ID encoding:
//     - 1 chars - Identifier string for publicly-accessible interactions (P)
//     - 1 char - Separator (':')
//     - 1 char - Interaction category (A)
//     - 1 char - Separator (':')
//     - 2 digits - Parameter encoding revision (00)
//     - 2 digits - Within-message ID deduplication increment
//     - 1 digit - Action type (assign/remove/toggle)
//     - 1 char - Silentness (Y/N)
//     - 1 char - Separator (':')
//     - Rest - Target role ID

type RoleButtonIdDataBlockContents = {
  deduplicationId: number,
  actionType: ButtonActionMappings, 
  silent: boolean
}

// Decodes the third block of the role button custom IDs for encoding revision 00
const parseRoleButtonIdDataBlock: (dataBlock: string) => null | RoleButtonIdDataBlockContents = (dataBlock) => {

  const revision = dataBlock.slice(0, 2)
  switch(revision) {
    case "00": 
      // Chars 0~1 = Revision identifier (0)

      // Chars 2~3 = Deduplication ID
      const dedupId = dataBlock.slice(2, 4)
      if (!/^[0-9]{2}$/.test(dedupId)) {
        logWarn(`A role-button-encoded custom ID was misformatted - non-two-digit deduplication ID '${dedupId}'`);
        logWarn(`Data block: ${dataBlock}`);
        return null
      }

      // Char 4 = Action type (assign/remove/toggle)
      const actionType = dataBlock.slice(4, 5)
      if (!(Object.values(ButtonActionMappings).includes(Number(actionType)))) {
        logWarn(`A role-button-encoded custom ID was misformatted - unknown action ID '${actionType}'`);
        logWarn(`Data block: ${dataBlock}`);
        return null
      }

      // Char 5 = Silentness (Y/N)
      const silent = dataBlock.slice(5, 6)
      if (!/^[YN]$/.test(silent)) {
        logWarn(`A role-button-encoded custom ID was misformatted - silentness value '${silent}' is not Y or N`);
        logWarn(`Data block: ${dataBlock}`);
        return null
      }

      // Parsing complete
      return {
        deduplicationId: Number(dedupId),
        actionType: Number(actionType) as ButtonActionMappings,
        silent: silent === "Y" ? true : false
      }
    default:
      // Unknown revision
      logWarn(`A role-button-encoded custom ID was misformatted - Unknown revision ID '${revision}'`);
      logWarn(`Data block: ${dataBlock}`);
      return null;
  }

}

// Decode a button's custom ID to button action details
// Returns null if provided ID is not an encoded button
export const decodeCustomIdToRoleButton: (id: string) => null | {buttonData: RoleButtonIdDataBlockContents, roleId: string} = (id) => {
  const buttonData = parseCustomIdPublicInteractionType(id);
  if (buttonData === null || buttonData.interactionType !== PublicInteractionCategory.RoleAssignButton) {
    logDebug(buttonData)
    return null;
  }
  // Now we know that buttonData.idRest should be button data
  // Length of the rest of the ID (after the interaction category) should be 2 - the action specifics data block and the role ID
  if (buttonData.idRest.length !== 2) {
    logWarn("A role-button-encoded custom ID was misformatted - perhaps created incorrectly?")
    logWarn(`ID: ${id}`)
    return null;
  }
  // Parse data block
  const dataBlock = parseRoleButtonIdDataBlock(buttonData.idRest[0]);
  if (!dataBlock) {
    logWarn("Custom ID decode failed due to malformed data block.")
    return null;
  }
  // Test the role ID section
  if (!/^[0-9]+$/.test(buttonData.idRest[1])) {
    logWarn(`Custom ID decode failed - invalid role ID ${buttonData.idRest[1]}`)
    return null;
  }
  // All checks passed
  return {
    buttonData: dataBlock,
    roleId: buttonData.idRest[1]
  }
}

// Encode a button's custom ID
export const encodeRoleButtonCustomId: (buttonData: RoleButtonIdDataBlockContents, roleId: string) => string | null = (buttonData, roleId) => {

  // Build data string
  // Start off with current encoding revision ID (00)
  let dataString = "00";
  // Then add chars 2~3: deduplication ID
  if (buttonData.deduplicationId < 0 || buttonData.deduplicationId > 99) {
    logError(`Failed to encode button ID - deduplication ID ${buttonData.deduplicationId} is not between 0 and 99.`)
    logError(buttonData)
    return null;
  }
  dataString += buttonData.deduplicationId.toLocaleString('en-US', {useGrouping: false, minimumIntegerDigits: 2})
  // Then add char 4: Action type
  dataString += buttonData.actionType.toString();
  // Then add char 5: Silentness
  dataString += buttonData.silent ? "Y" : "N"

  // Assemble together and return
  return encodePublicInteractionCustomId(PublicInteractionCategory.RoleAssignButton, dataString + ":" + roleId)
}