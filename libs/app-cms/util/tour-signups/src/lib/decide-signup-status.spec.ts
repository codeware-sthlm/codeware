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

describe('fitsCapacity', () => {
  it('accepts a promotion that fits', () => {
    expect(fitsCapacity({ maxCustomers: 20, people: 3, taken: 17 })).toBe(true);
  });

  it('refuses a promotion that would overbook', () => {
    expect(fitsCapacity({ maxCustomers: 20, people: 4, taken: 17 })).toBe(
      false
    );
  });
});
