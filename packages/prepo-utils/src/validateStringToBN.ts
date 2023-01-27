export const validateStringToBN = (input: string): boolean => {
  // empty string is treated as 0
  if (input === '') return true
  return !Number.isNaN(+input)
}
