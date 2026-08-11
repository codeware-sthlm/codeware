/** Signup statuses that occupy a seat, queue up for one, or hold neither */
export type SignupStatus = 'booked' | 'waiting' | 'cancelled';

type Decision = {
  /** How many seats the tour is configured for; `null` means unlimited */
  maxCustomers?: number | null;
  /** People this signup is for */
  people: number;
  /** People already booked on the tour */
  taken: number;
};

/**
 * Decide whether a signup takes a seat or joins the waiting list.
 *
 * Capacity counts **people**, not signups: a party of four fills four places,
 * so a tour with three places left cannot take it — the whole party queues
 * together rather than being split.
 *
 * Kept free of Payload so the rule can be tested on its own; the caller is
 * responsible for reading `taken` under a lock (see `assignCapacityStatus`).
 */
export const decideSignupStatus = ({
  maxCustomers,
  people,
  taken
}: Decision): Extract<SignupStatus, 'booked' | 'waiting'> => {
  if (!maxCustomers || maxCustomers < 1) {
    return 'booked';
  }

  return taken + people > maxCustomers ? 'waiting' : 'booked';
};

/**
 * Whether a move to `booked` fits within the tour's capacity.
 *
 * `taken` must exclude the signup being moved, or a booked signup being
 * re-saved would block itself.
 */
export const fitsCapacity = ({
  maxCustomers,
  people,
  taken
}: Decision): boolean =>
  decideSignupStatus({ maxCustomers, people, taken }) === 'booked';
