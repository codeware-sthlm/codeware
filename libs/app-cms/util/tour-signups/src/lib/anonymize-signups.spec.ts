import type { Payload } from 'payload';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { anonymizeSignups, sweepExpiredSignups } from './anonymize-signups';

const find = vi.fn();
const update = vi.fn();

const payload = { find, update } as unknown as Payload;

describe('anonymizeSignups', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clears the person and keeps the seat', async () => {
    find.mockResolvedValue({ docs: [{ id: 7 }] });

    await anonymizeSignups(payload, { tour: { equals: 1 } });

    const { data } = update.mock.calls[0][0];
    expect(data.name).toBe('Anonymized');
    expect(data.phone).toBeNull();
    expect(data.notes).toBeNull();
    expect(data.anonymizedAt).toEqual(expect.any(String));
    // Party size and status are capacity history, not personal data
    expect(data).not.toHaveProperty('people');
    expect(data).not.toHaveProperty('status');
  });

  it('writes an address that can never be delivered to', async () => {
    find.mockResolvedValue({ docs: [{ id: 7 }] });

    await anonymizeSignups(payload, { tour: { equals: 1 } });

    // `.invalid` is reserved by RFC 2606, so a cleared row cannot be mailed
    expect(update.mock.calls[0][0].data.email).toMatch(/@anonymized\.invalid$/);
  });

  it('skips rows that were already cleared', async () => {
    find.mockResolvedValue({ docs: [] });

    await expect(
      anonymizeSignups(payload, { tour: { equals: 1 } })
    ).resolves.toEqual([]);
    expect(update).not.toHaveBeenCalled();
    // The query itself excludes them, which is what makes the sweep idempotent
    expect(find.mock.calls[0][0].where.and[1]).toEqual({
      anonymizedAt: { exists: false }
    });
  });
});

describe('sweepExpiredSignups', () => {
  beforeEach(() => vi.clearAllMocks());

  it('counts back from each workspace’s own retention period', async () => {
    find
      .mockResolvedValueOnce({
        docs: [{ tenant: 1, tourSignups: { retentionDays: 30 } }]
      })
      .mockResolvedValueOnce({ docs: [{ id: 5 }] })
      .mockResolvedValueOnce({ docs: [{ id: 9 }] });

    await expect(sweepExpiredSignups(payload)).resolves.toBe(1);

    const tourQuery = find.mock.calls[1][0].where.and[1].departureDate;
    const cutoff = new Date(tourQuery.less_than).getTime();
    const expected = Date.now() - 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff - expected)).toBeLessThan(5000);
  });

  it('leaves a workspace with no retention period alone', async () => {
    find.mockResolvedValueOnce({ docs: [{ tenant: 1, tourSignups: {} }] });

    await expect(sweepExpiredSignups(payload)).resolves.toBe(0);
    expect(find).toHaveBeenCalledTimes(1);
  });

  it('ignores tours that have not departed', async () => {
    // No departure date means nothing to count from — the query filters them
    find
      .mockResolvedValueOnce({
        docs: [{ tenant: 1, tourSignups: { retentionDays: 30 } }]
      })
      .mockResolvedValueOnce({ docs: [] });

    await expect(sweepExpiredSignups(payload)).resolves.toBe(0);
    expect(update).not.toHaveBeenCalled();
  });
});
