import type { FieldHook } from 'payload/types';

/**
 * Formats a string into a dash-separated slug.
 *
 * @param val The string to format
 * @returns
 */
const format = (val: string): string =>
  val
    // Replace spaces with dashes
    .replace(/ /g, '-')
    // Remove all non-word characters
    .replace(/[^\w-/]+/g, '')
    .toLowerCase();

/**
 * Creates a slug for a field to which it is applied.
 * Commonly used as page identifiers.
 *
 * @param fallbackField The field to use as a fallback if the value is not a string
 *
 * @returns The slug
 *
 * @example
 *
 * formatSlug('My page') // 'my-page'
 * formatSlug('My page 123') // 'my-title-123'
 * formatSlug('The header!') // 'the-header'
 * formatSlug('The $?$%^&*() title') // 'the-title'
 */
const formatSlug =
  (fallbackField: string): FieldHook =>
  ({ value, originalDoc, data }) => {
    if (typeof value === 'string') {
      return format(value);
    }
    const fallbackData = data?.[fallbackField] || originalDoc?.[fallbackField];

    if (fallbackData && typeof fallbackData === 'string') {
      return format(fallbackData);
    }

    return value;
  };

export default formatSlug;
