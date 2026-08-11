import type { TourSignup } from '@codeware/shared/util/payload-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { guardStatusChange } from './guard-status-change';

type HookArgs = Parameters<typeof guardStatusChange>[0];

const execute = vi.fn();

/** Booked signups already on the tour, as the sum query would return them */
let booked: Array<{ id: number; people: number }> = [];

const findByID = vi.fn();
const find = vi.fn(async () => ({ docs: booked }));

const req = () =>
  ({
    payload: {
      find,
      findByID,
      db: { tables: { tours: { id: 'id' } }, drizzle: {}, execute }
    },
    // The translated message is asserted through its key, not its wording
    t: (key: string) => key
  }) as unknown as HookArgs['req'];

const invoke = (
  data: Partial<TourSignup>,
  originalDoc: Partial<TourSignup>,
  operation: 'create' | 'update' = 'update'
) =>
  guardStatusChange({
    data,
    operation,
    originalDoc,
    req: req()
  } as unknown as HookArgs);

/** Tour with room for twenty */
const tourOfTwenty = { id: 1, maxCustomers: 20 };

const signup = (overrides: Partial<TourSignup> = {}) =>
  ({
    id: 7,
    tour: 1,
    people: 2,
    status: 'waiting',
    ...overrides
  }) as Partial<TourSignup>;

describe('guardStatusChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    booked = [];
    findByID.mockResolvedValue(tourOfTwenty);
  });

  it('leaves a create to the capacity hook', async () => {
    await invoke({ status: 'booked' }, signup(), 'create');
    expect(findByID).not.toHaveBeenCalled();
  });

  it('always allows a cancellation', async () => {
    booked = [{ id: 7, people: 2 }];

    await expect(
      invoke({ status: 'cancelled' }, signup({ status: 'booked' }))
    ).resolves.toEqual({ status: 'cancelled', queuePosition: null });
    expect(execute).not.toHaveBeenCalled();
  });

  it('appends a signup that joins the waiting list', async () => {
    find.mockResolvedValueOnce({ docs: [{ queuePosition: 4 }] });

    await expect(
      invoke({ status: 'waiting' }, signup({ status: 'booked' }))
    ).resolves.toEqual({ status: 'waiting', queuePosition: 5 });
  });

  it('promotes off the queue when the party fits', async () => {
    booked = [{ id: 1, people: 17 }];

    await expect(
      invoke({ status: 'booked' }, signup({ people: 3 }))
    ).resolves.toEqual({ status: 'booked', queuePosition: null });
    // The tour row is held while the seats are counted
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('refuses a promotion that would overbook', async () => {
    booked = [{ id: 1, people: 17 }];

    await expect(
      invoke({ status: 'booked' }, signup({ people: 4 }))
    ).rejects.toThrow('validation:signupWouldOverbook');
  });

  it('refuses a booked party that grows past the maximum', async () => {
    booked = [
      { id: 1, people: 16 },
      { id: 7, people: 2 }
    ];

    await expect(
      invoke({ people: 5 }, signup({ status: 'booked', people: 2 }))
    ).rejects.toThrow('validation:signupWouldOverbook');
  });

  it('does not let a booked signup block its own save', async () => {
    // The tour is full of this very signup — re-saving it must not fail
    booked = [{ id: 7, people: 20 }];

    await expect(
      invoke(
        { notes: 'called ahead' },
        signup({ status: 'booked', people: 20 })
      )
    ).resolves.toEqual({ notes: 'called ahead', queuePosition: null });
    expect(execute).not.toHaveBeenCalled();
  });

  it('skips the check when the tour has no maximum', async () => {
    findByID.mockResolvedValue({ id: 1, maxCustomers: null });

    await expect(
      invoke({ status: 'booked' }, signup({ people: 99 }))
    ).resolves.toEqual({ status: 'booked', queuePosition: null });
    expect(execute).not.toHaveBeenCalled();
  });
});
