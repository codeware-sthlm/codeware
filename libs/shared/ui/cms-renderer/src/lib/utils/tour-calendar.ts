import type { Tour } from '@codeware/shared/util/payload-types';

/**
 * Escape a value for an iCalendar text property.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.11
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Format a date as an iCalendar DATE value (all-day events). */
function toDateValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/** Format a date as an iCalendar UTC DATE-TIME value. */
function toDateTimeValue(date: Date): string {
  return `${toDateValue(date)}T${String(date.getUTCHours()).padStart(2, '0')}${String(
    date.getUTCMinutes()
  ).padStart(2, '0')}${String(date.getUTCSeconds()).padStart(2, '0')}Z`;
}

/** Whole days between two dates, ignoring time of day. */
function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) -
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())) /
      MS_PER_DAY
  );
}

/**
 * Fold lines to 75 octets, as the spec requires. Long descriptions are common
 * and some parsers reject unfolded lines outright.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.1
 */
function fold(line: string): string {
  if (line.length <= 75) {
    return line;
  }
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  parts.push(` ${rest}`);
  return parts.join('\r\n');
}

type Options = {
  /** Canonical url of the tour, included in the event and its description */
  url: string;
  /** Fixed timestamp, for deterministic output in tests */
  now?: Date;
};

/**
 * Build an iCalendar document for a tour departure.
 *
 * The event is all-day and spans the itinerary, so it sits across the right
 * block of days in a calendar rather than as a single point. When a booking
 * deadline is set, an alarm fires on that day — the date a customer actually
 * needs to act on.
 *
 * @param tour - The tour to describe. Must have a confirmed departure — a tour
 *   still gathering interest has no date to put in a calendar.
 * @param options - Canonical url, and an optional fixed timestamp
 * @returns The `.ics` file contents
 * @throws If the tour has no departure date
 */
export function buildTourCalendar(tour: Tour, options: Options): string {
  const { url, now = new Date() } = options;
  const { bookingDeadline, departureDate, destination, id, summary, title } =
    tour;

  if (!departureDate) {
    throw new Error('Cannot build a calendar event without a departure date');
  }

  const departure = new Date(departureDate);

  // All-day events end on the day *after* the last day
  const dayCount = Math.max(tour.itinerary?.length ?? 1, 1);
  const end = new Date(departure);
  end.setUTCDate(end.getUTCDate() + dayCount);

  const description = escapeText(`${summary}\n\n${url}`);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Codeware//Tours//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:tour-${id}-${toDateValue(departure)}@codeware.se`,
    `DTSTAMP:${toDateTimeValue(now)}`,
    `DTSTART;VALUE=DATE:${toDateValue(departure)}`,
    `DTEND;VALUE=DATE:${toDateValue(end)}`,
    `SUMMARY:${escapeText(title)}`,
    `LOCATION:${escapeText(destination)}`,
    `DESCRIPTION:${description}`,
    `URL:${escapeText(url)}`
  ];

  if (bookingDeadline) {
    // Alarms are relative to the start, so express the deadline as a negative
    // offset in days
    const daysBefore = daysBetween(new Date(bookingDeadline), departure);
    if (daysBefore > 0) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(`Booking closes for ${title}`)}`,
        `TRIGGER:-P${daysBefore}D`,
        'END:VALARM'
      );
    }
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(fold).join('\r\n');
}
