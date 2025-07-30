// - Role assign buttons
//   - Custom ID encoding:
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
// - Role assign dropdown menus
//   - Custom ID encoding:
//     - 1 chars - Identifier string for publicly-accessible interactions (P)
//     - 1 char - Separator (':')
//     - 1 char - Interaction category (B)
//     - 1 char - Separator (':')
//     - 2 digits - Parameter encoding revision (00)
//     - 2 digits - Within-message ID deduplication increment
//     - 1 char - Silentness (Y/N)
//     - 1 char - Separator (':')
//     - Rest - Target role ID

import { logDebug } from "../core/Log"


// Encoded custom ID prefixes - single char uppercase
enum EncodedCustomIdPrefixes {
  Public = "P",  // Publicly-accessible interactions
}

// Encoded public interaction type identifiers
export enum PublicInteractionCategory {
  RoleAssignButton = "A",
  RoleAssignDropdown = "B",
}

const parseCustomIdPrefix: (id: string) => null | {prefix: EncodedCustomIdPrefixes, idRest: string[]} = (id) => {

  logDebug("Parsing custom ID prefix")
  // Encoded IDs are separated by colons
  const parts = id.split(':')
  logDebug(parts)
  // Check if the first group is a valid identifier - a single-char string included in EncodedCustomIdPrefixes
  if (
    parts[0] && 
    parts[0].length === 1 && 
    Object.values<string>(EncodedCustomIdPrefixes).includes(parts[0])
  ) {
    logDebug("Parse success")
    return {
      prefix: parts[0] as EncodedCustomIdPrefixes,
      idRest: parts.slice(1)
    }
  } else {
    logDebug("Parse fail")
    return null
  }
}

// Check if a custom ID is an encoded public interaction
// Returns null if false
// Otherwise returns the PublicInteractionCategory corresponding to the interaction
export const parseCustomIdPublicInteractionType: (id: string) => null | {interactionType: PublicInteractionCategory, idRest: string[]} = (id) => {
  const customIdDetails = parseCustomIdPrefix(id)
  console.log(customIdDetails)
  if (!customIdDetails || customIdDetails.prefix !== EncodedCustomIdPrefixes.Public) return null
  logDebug("Parsing public interaction type")
  logDebug(customIdDetails.idRest)
  if (
    customIdDetails.idRest[0] && 
    customIdDetails.idRest[0].length === 1 && 
    Object.values<string>(PublicInteractionCategory).includes(customIdDetails.idRest[0])
  ) {
    logDebug("Parse success")
    return {
      interactionType: customIdDetails.idRest[0] as PublicInteractionCategory,
      idRest: customIdDetails.idRest.slice(1)
    }
  } else {
    logDebug("Parse fail")
    return null
  }
}


const encodeCustomId = (prefix: EncodedCustomIdPrefixes, data: string) => {
  return prefix + ":" + data
}

export const encodePublicInteractionCustomId = (interactionType: PublicInteractionCategory, data: string) => {
  return encodeCustomId(EncodedCustomIdPrefixes.Public, interactionType + ":" + data)
}