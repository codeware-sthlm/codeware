import { describe, expect, it } from 'vitest';

import { decideSignupStatus, fitsCapacity } from './decide-signup-status';

describe('decideSignupStatus', () => {
  it('books while the tour has room', () => {
    expect(decideSignupStatus({ maxCustomers: 20, people: 2, taken: 12 })).toBe(
      'booked'
    );
  });

  it('books the party that fills the last seats exactly', () => {
    expect(decideSignupStatus({ maxCustomers: 20, people: 8, taken: 12 })).toBe(
      'booked'
    );
  });

  it('queues a party that does not fit whole', () => {
    // Three seats left, party of four — the platform never splits a party
    expect(decideSignupStatus({ maxCustomers: 20, people: 4, taken: 17 })).toBe(
      'waiting'
    );
  });

  it('queues once the tour is full', () => {
    expect(decideSignupStatus({ maxCustomers: 20, people: 1, taken: 20 })).toBe(
      'waiting'
    );
  });

  it('treats no maximum as unlimited', () => {
    expect(
      decideSignupStatus({ maxCustomers: null, people: 50, taken: 500 })
    ).toBe('booked');
    expect(
      decideSignupStatus({ maxCustomers: undefined, people: 1, taken: 0 })
    ).toBe('booked');
  });

  it('keeps counting people when the tour is already overbooked', () => {
    // A guide may overbook by hand; the next public signup still queues
    expect(decideSignupStatus({ maxCustomers: 10, people: 1, taken: 12 })).toBe(
      'waiting'
    );
  });
});

describe('decideSignupStatus with a queue', () => {
  it('queues a signup that would fit, once anyone is waiting', () => {
    // The case this rule exists for: a single traveller fitting the last seat
    // ahead of a party that has been waiting for two
    expect(
      decideSignupStatus({ maxCustomers: 20, people: 1, taken: 19, waiting: 2 })
    ).toBe('waiting');
  });

  it('books normally while the queue is empty', () => {
    expect(
      decideSignupStatus({ maxCustomers: 20, people: 1, taken: 19, waiting: 0 })
    ).toBe('booked');
  });

  it('ignores a queue on a tour with no maximum', () => {
    // Nothing can queue on an unlimited tour, so nothing can block a signup
    expect(
      decideSignupStatus({
        maxCustomers: null,
        people: 4,
        taken: 99,
        waiting: 3
      })
    ).toBe('booked');
  });
});

describe('fitsCapacity', () => {
  it('accepts a promotion that fits', () => {
    expect(fitsCapacity({ maxCustomers: 20, people: 3, taken: 17 })).toBe(true);
  });

  it('refuses a promotion that would overbook', () => {
    expect(fitsCapacity({ maxCustomers: 20, people: 4, taken: 17 })).toBe(
      false
    );
  });

  it('lets a guide promote even though others are waiting', () => {
    // Promotion is the guide's call about the queue, so the queue must not
    // block it the way it blocks a new signup
    expect(
      fitsCapacity({ maxCustomers: 20, people: 3, taken: 17, waiting: 5 })
    ).toBe(true);
  });
});
