/**
 * What a notification send resolved to, before it is written down.
 *
 * `not-configured` never reaches this module — a form with no notification
 * emails never calls `beforeEmail` at all, so `recordDeliveryStatus` decides
 * that case itself when it finds no outcome waiting.
 */
export type DeliveryOutcome = 'no-recipient' | 'sent' | 'failed';

/** Worse outcomes win when a submission fires more than one notification email */
const severity: Record<DeliveryOutcome, number> = {
  sent: 0,
  'no-recipient': 1,
  failed: 2
};

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

/**
 * Called by the adapter wrap or `applyDefaultRecipient`, once per
 * notification email.
 *
 * A submission can fire more than one notification email (a form can list
 * several), so a later `sent` must not overwrite an earlier `failed` or
 * `no-recipient` — the worse outcome is the one that describes the
 * submission as a whole.
 */
export const recordOutcome = (id: number, outcome: DeliveryOutcome): void => {
  const current = outcomes.get(id);
  if (!current || severity[outcome] > severity[current]) {
    outcomes.set(id, outcome);
  }
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
