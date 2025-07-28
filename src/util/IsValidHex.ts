export const isValidHex = (hex: string) => {
  // In the context of this bot's code, exactly 6x hex chars without the preceding #
  return /^[0-9a-fA-F]{6}$/.test(hex)
}