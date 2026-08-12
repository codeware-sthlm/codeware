/** Signup statuses that occupy a seat, queue up for one, or hold neither */
export type SignupStatus = 'booked' | 'waiting' | 'cancelled';

type Decision = {
  /** How many seats the tour is configured for; `null` means unlimited */
  maxCustomers?: number | null;
  /** People this signup is for */
  people: number;
  /** People already booked on the tour */
  taken: number;
  /** People already on the waiting list */
  waiting?: number;
};

/**
 * Decide whether a signup takes a seat or joins the waiting list.
 *
 * Capacity counts **people**, not signups: a party of four fills four places,
 * so a tour with three places left cannot take it — the whole party queues
 * together rather than being split.
 *
 * **The queue is served in order.** Once anyone is waiting, later signups join
 * the queue behind them even when they would fit in what is left. Without that
 * rule a party of four can starve behind a trickle of single travellers, each
 * of whom fits where the party does not, and the waiting list stops meaning
 * "you are next". The cost is real and deliberate: seats can sit unsold until
 * the guide promotes someone, which is why the admin flags a tour with free
 * seats and a queue.
 *
 * Kept free of Payload so the rule can be tested on its own; the caller is
 * responsible for reading `taken` and `waiting` under a lock (see
 * `assignCapacityStatus`).
 */
export const decideSignupStatus = ({
  maxCustomers,
  people,
  taken,
  waiting = 0
}: Decision): Extract<SignupStatus, 'booked' | 'waiting'> => {
  if (!maxCustomers || maxCustomers < 1) {
    return 'booked';
  }

  if (waiting > 0) {
    return 'waiting';
  }

  return taken + people > maxCustomers ? 'waiting' : 'booked';
};

/**
 * Whether a move to `booked` fits within the tour's capacity.
 *
 * `taken` must exclude the signup being moved, or a booked signup being
 * re-saved would block itself. The queue is ignored here on purpose: this
 * answers a guide promoting someone *off* that queue, and their judgment is
 * what the queue exists to serve.
 */
export const fitsCapacity = ({
  maxCustomers,
  people,
  taken
}: Decision): boolean =>
  decideSignupStatus({ maxCustomers, people, taken }) === 'booked';
