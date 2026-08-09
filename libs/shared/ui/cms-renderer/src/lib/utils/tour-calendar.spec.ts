import type { Tour } from '@codeware/shared/util/payload-types';
import { describe, expect, it } from 'vitest';

import { buildTourCalendar } from './tour-calendar';

const tour = {
  id: 7,
  title: 'Barolo & Barbaresco Harvest',
  destination: 'Piedmont, Italy',
  summary: 'Walk the Nebbiolo vineyards; taste from the barrel.',
  departureDate: '2027-09-21T00:00:00.000Z',
  bookingDeadline: '2027-07-21T00:00:00.000Z',
  itinerary: [{ title: 'a' }, { title: 'b' }, { title: 'c' }]
} as unknown as Tour;

const options = {
  url: 'https://example.com/tours/barolo',
  now: new Date('2026-01-10T10:00:00.000Z')
};

describe('buildTourCalendar', () => {
  const ics = buildTourCalendar(tour, options);
  const unfolded = ics.replace(/\r\n /g, '');

  it('spans the itinerary, ending the day after the last day', () => {
    expect(unfolded).toContain('DTSTART;VALUE=DATE:20270921');
    // 3 itinerary days → exclusive end on the 24th
    expect(unfolded).toContain('DTEND;VALUE=DATE:20270924');
  });

  it('carries the tour url so the event links back', () => {
    expect(unfolded).toContain('URL:https://example.com/tours/barolo');
    expect(unfolded).toContain('https://example.com/tours/barolo');
  });

  it('escapes commas in text properties', () => {
    expect(unfolded).toContain('LOCATION:Piedmont\\, Italy');
  });

  it('alarms on the booking deadline', () => {
    // 21 Jul → 21 Sep is 62 days
    expect(unfolded).toContain('TRIGGER:-P62D');
  });

  it('uses CRLF line endings and folds long lines', () => {
    expect(ics).toContain('\r\n');
    for (const line of ics.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it('folds by octets, not characters', () => {
    // The spec counts bytes. A title of non-ascii characters stays under 75
    // JS string units while going well over 75 octets
    const swedish = buildTourCalendar(
      { ...tour, title: 'Solförmörkelsejakten över Öland '.repeat(4) } as Tour,
      options
    );

    const encoder = new TextEncoder();
    for (const line of swedish.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('never splits a character across folded lines', () => {
    const swedish = buildTourCalendar(
      { ...tour, title: 'ö'.repeat(120) } as Tour,
      options
    );

    // A split surrogate or truncated sequence shows up as a replacement char
    expect(swedish).not.toContain('\uFFFD');
    expect(swedish.replace(/\r\n /g, '')).toContain('ö'.repeat(120));
  });

  it('refuses a tour with no confirmed departure', () => {
    expect(() =>
      buildTourCalendar({ ...tour, departureDate: null } as Tour, options)
    ).toThrow(/departure date/);
  });

  it('omits the alarm when the deadline is not before departure', () => {
    const sameDay = buildTourCalendar(
      { ...tour, bookingDeadline: tour.departureDate } as Tour,
      options
    );
    expect(sameDay).not.toContain('BEGIN:VALARM');
  });
});
