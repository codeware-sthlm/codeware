import { describe, expect, it } from 'vitest';

import { EXPIRY_WARNING_DAYS, isExpiringSoon } from './expiry';

const now = new Date('2026-08-20T00:00:00.000Z');

const inDays = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

describe('isExpiringSoon', () => {
  it('flags a certificate inside the window', () => {
    expect(isExpiringSoon(inDays(3), now)).toBe(true);
  });

  it('includes one landing exactly on the boundary', () => {
    // "Within two weeks" has to mean within, or the one certificate sitting on
    // the line is the one nobody is told about
    expect(isExpiringSoon(inDays(EXPIRY_WARNING_DAYS), now)).toBe(true);
  });

  it('stays quiet outside the window', () => {
    expect(isExpiringSoon(inDays(EXPIRY_WARNING_DAYS + 1), now)).toBe(false);
  });

  it('treats an already-expired certificate as the same problem, later', () => {
    expect(isExpiringSoon(inDays(-1), now)).toBe(true);
  });

  it('says nothing when no expiry is known', () => {
    // Every certificate stored before issuance details were recorded
    expect(isExpiringSoon(null, now)).toBe(false);
    expect(isExpiringSoon(undefined, now)).toBe(false);
    expect(isExpiringSoon('not-a-date', now)).toBe(false);
  });
});
