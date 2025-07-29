import { type Role, type APIRole } from "discord.js";
import { logDebug } from "../../../core/Log";

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
  silent: boolean
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
  editorData.set(userId, {...EMPTY_BUTTONEDITOR_STATE})
}


// Initializes editor data for a given user if it doesn't exist yet
export const initUserDataIfNecessary = (editorData: EditorDataType, userId: string) => {
  if (!editorData.get(userId)) {
    resetEditorDataForUser(editorData, userId)
  }
}
