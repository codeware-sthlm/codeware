import { describe, expect, it } from 'vitest';

import { recordOutcome, takeOutcome } from './delivery-outcomes';

describe('recordOutcome / takeOutcome', () => {
  it('records a single outcome', () => {
    recordOutcome(1, 'sent');

    expect(takeOutcome(1)).toBe('sent');
  });

  it('forgets the outcome once read', () => {
    recordOutcome(2, 'sent');
    takeOutcome(2);

    expect(takeOutcome(2)).toBeUndefined();
  });

  it('returns undefined for a submission with no recorded outcome', () => {
    expect(takeOutcome(999)).toBeUndefined();
  });

  it('lets a later "failed" overwrite an earlier "sent"', () => {
    recordOutcome(3, 'sent');
    recordOutcome(3, 'failed');

    expect(takeOutcome(3)).toBe('failed');
  });

  it('lets a later "no-recipient" overwrite an earlier "sent"', () => {
    recordOutcome(4, 'sent');
    recordOutcome(4, 'no-recipient');

    expect(takeOutcome(4)).toBe('no-recipient');
  });

  it('does not let a later "sent" overwrite an earlier "failed"', () => {
    recordOutcome(5, 'failed');
    recordOutcome(5, 'sent');

    expect(takeOutcome(5)).toBe('failed');
  });

  it('does not let a later "no-recipient" overwrite an earlier "failed"', () => {
    recordOutcome(6, 'failed');
    recordOutcome(6, 'no-recipient');

    expect(takeOutcome(6)).toBe('failed');
  });

  it('does not let a later "sent" overwrite an earlier "no-recipient"', () => {
    recordOutcome(7, 'no-recipient');
    recordOutcome(7, 'sent');

    expect(takeOutcome(7)).toBe('no-recipient');
  });
});
