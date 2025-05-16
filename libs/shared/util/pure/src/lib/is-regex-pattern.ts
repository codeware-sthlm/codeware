/**
 * Checks if the provided value is a regex pattern, hence starts and ends with a forward slash.
 *
 * Note! This function does not validate the regex itself.
 *
 * @param value The value to check.
 * @returns True if the value is a regex pattern, false otherwise.
 */
export const isRegexPattern = (
  value: string | null | undefined
): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmedValue = value.trim();
  if (trimmedValue.length < 2) {
    return false;
  }

  // Check if the value starts and ends with a forward slash
  return trimmedValue.startsWith('/') && trimmedValue.endsWith('/');
};
