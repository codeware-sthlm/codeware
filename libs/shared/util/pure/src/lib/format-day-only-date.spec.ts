import { describe, expect, it } from 'vitest';

import { formatDayOnlyDate } from './format-day-only-date';

describe('formatDayOnlyDate', () => {
  it('reads as a date rather than a timestamp', () => {
    // The bug this exists for: the stored value reaching a customer verbatim
    expect(formatDayOnlyDate('2027-04-12T00:00:00.000Z', 'en')).toBe(
      'Apr 12, 2027'
    );
  });

  it('formats in the given locale', () => {
    expect(formatDayOnlyDate('2027-04-12T00:00:00.000Z', 'sv')).toBe(
      '12 apr. 2027'
    );
  });

  it('keeps the stored day west of Greenwich', () => {
    // Midnight UTC formatted in local time would land on the 11th for anyone
    // in the Americas — the departure would be a day early in their inbox
    const original = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';

    expect(formatDayOnlyDate('2027-04-12T00:00:00.000Z', 'en')).toContain('12');

    process.env.TZ = original;
  });

  it('answers empty for a date that was never set', () => {
    expect(formatDayOnlyDate(null, 'en')).toBe('');
    expect(formatDayOnlyDate(undefined, 'en')).toBe('');
    expect(formatDayOnlyDate('', 'en')).toBe('');
  });
});
