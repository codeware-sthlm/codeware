/** What a notification send resolved to, before it is written down */
export type DeliveryOutcome = 'sent' | 'failed';

/**
 * Send outcomes waiting to be written to their submission.
 *
 * A hand-off between two places that cannot call each other: the email adapter
 * knows whether a send worked but has no `req`, and the collection hook has a
 * `req` (and therefore the open transaction) but never learns the outcome.
 *
 * Module state is safe here because the two ends are one tick apart in the same
 * request — the form-builder plugin awaits its send hook before the hooks we
 * add run — and every entry is keyed by submission id, so concurrent
 * submissions cannot read each other's result.
 */
const outcomes = new Map<number, DeliveryOutcome>();

/** Called by the adapter wrap, once per notification send */
export const recordOutcome = (id: number, outcome: DeliveryOutcome): void => {
  outcomes.set(id, outcome);
};

/**
 * Read an outcome and forget it.
 *
 * Consuming rather than peeking is what keeps this bounded, and it is also
 * what stops the write below from looping: updating the submission re-runs
 * the same hook, which then finds nothing left to write.
 */
export const takeOutcome = (id: number): DeliveryOutcome | undefined => {
  const outcome = outcomes.get(id);
  outcomes.delete(id);
  return outcome;
};
