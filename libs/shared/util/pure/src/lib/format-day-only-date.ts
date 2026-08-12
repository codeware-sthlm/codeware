/**
 * `dayOnly` date fields are stored at midnight UTC, so they must be rendered in
 * UTC — formatting them in local time shows the previous day west of Greenwich.
 */
const DAY_ONLY_TIME_ZONE = 'UTC';

/**
 * Format a date-only value for reading, in the given locale.
 *
 * Shared by everything that shows a departure — the site, and the emails —
 * because the timezone rule above is easy to get right once and easy to lose
 * in a second copy. Returns an empty string for a missing date so callers can
 * fall back without a null check.
 *
 * @param date - ISO date string, as Payload stores a `dayOnly` field
 * @param locale - Locale to format for, e.g. `sv`
 */
export function formatDayOnlyDate(
  date: string | null | undefined,
  locale: string
): string {
  if (!date) {
    return '';
  }

  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: DAY_ONLY_TIME_ZONE
  });
}
