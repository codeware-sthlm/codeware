/**
 * Get the keys of an object that have a truthy value.
 *
 * The object must be a record of strings to booleans.
 * This is useful for configuring a set of features and whether they are enabled or not.
 *
 * @param obj - The object to get the active keys from.
 * @returns An array of the active keys.
 */
export const getActiveKeys = <
  TKey extends string,
  TRecord extends Record<TKey, boolean> = Record<TKey, boolean>
>(
  obj: TRecord
): Array<TKey> => {
  if (!obj) {
    return [];
  }
  return Object.keys(obj)
    .filter((key) => obj[key as TKey])
    .map((key) => key as TKey);
};
