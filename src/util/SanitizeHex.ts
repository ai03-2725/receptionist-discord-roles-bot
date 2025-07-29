export const sanitizeHex = (hex: string) => {
  // Return the 6-char hex code if input can be parsed as hex
  // Otherwise return null
  const regexPass = /^#?[0-9a-fA-F]{6}$/.test(hex)
  if (regexPass) {
    // Valid hex
    // Strip out the preceding hash for consistency and return
    return hex[0] === "#" ? hex.substring(1) : hex;

  } else {
    return null
  }
}