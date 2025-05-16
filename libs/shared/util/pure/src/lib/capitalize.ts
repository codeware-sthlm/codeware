/**
 * Capitalizes the first letter of a string.
 *
 * @param name - The input string.
 * @returns The capitalized string.
 */
export const capitalize = (name: string): string => {
  if (!name) {
    return '';
  }
  if (name.length === 1) {
    return name.toUpperCase();
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
};
