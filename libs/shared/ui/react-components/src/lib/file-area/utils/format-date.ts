/**
 * Formats the given date into an opinionated format using a locale.
 *
 * Example:
 * - "Jan 1, 2023" (en-US)
 * - "1 jan. 2023" (sv-SE)
 *
 * @param date The date to format.
 * @param locale The locale to use for formatting. Default is 'en-US'.
 * @returns A string representing the formatted date.
 */
export const formatDate = (date: Date, locale = 'en-US'): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return date.toLocaleDateString(locale, options);
};
