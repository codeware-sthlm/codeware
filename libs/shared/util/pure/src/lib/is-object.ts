/**
 * Object guard with type narrowing.
 *
 * @param item - The item to check.
 * @returns `true` if the item is an object, `false` otherwise.
 */
export const isObject = (item: unknown): item is object =>
  typeof item === 'object' && !Array.isArray(item);
