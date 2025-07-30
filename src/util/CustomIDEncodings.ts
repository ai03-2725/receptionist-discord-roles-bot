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
  // Encoded IDs are separated by colons
  const parts = id.split(':')
  // Check if the first group is a valid identifier - a single-char string included in EncodedCustomIdPrefixes
  if (
    parts[0] && 
    parts[0].length === 1 && 
    Object.values<string>(EncodedCustomIdPrefixes).includes(parts[0])
  ) {
    return {
      prefix: EncodedCustomIdPrefixes[parts[0]],
      idRest: parts.slice(1)
    }
  } else {
    return null
  }
}

// Check if a custom ID is an encoded public interaction
// Returns null if false
// Otherwise returns the PublicInteractionCategory corresponding to the interaction
export const parseCustomIdPublicInteractionType: (id: string) => null | {interactionType: PublicInteractionCategory, idRest: string[]} = (id) => {
  const customIdDetails = parseCustomIdPrefix(id)
  if (!customIdDetails || customIdDetails.prefix !== EncodedCustomIdPrefixes.Public) return null
  if (
    customIdDetails.idRest[1] && 
    customIdDetails.idRest[1].length === 1 && 
    Object.values<string>(PublicInteractionCategory).includes(customIdDetails.idRest[1])
  ) {
    return {
      interactionType: PublicInteractionCategory[customIdDetails.idRest[1]],
      idRest: customIdDetails.idRest.slice(1)
    }
  } else {
    return null
  }
}


const encodeCustomId = (prefix: EncodedCustomIdPrefixes, data: string) => {
  return prefix + ":" + data
}

export const encodePublicInteractionCustomId = (interactionType: PublicInteractionCategory, data: string) => {
  return encodeCustomId(EncodedCustomIdPrefixes.Public, interactionType + ":" + data)
}