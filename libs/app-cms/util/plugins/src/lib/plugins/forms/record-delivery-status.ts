import type { FormSubmission } from '@codeware/shared/util/payload-types';
import type { CollectionAfterChangeHook } from 'payload';

import { takeOutcome } from './delivery-outcomes';

/**
 * Write down how the notification email for this submission went.
 *
 * Runs after the form-builder plugin's own send hook — the plugin appends the
 * collection's configured `afterChange` hooks behind its own — so by the time
 * this runs every send for the submission has settled and left its result for
 * {@link takeOutcome}.
 *
 * Uses this hook's `req`, which carries the transaction the submission was
 * created in. Without it the row is not visible yet and the update 404s.
 *
 * Submissions are immutable to editors (`update: () => false`), so the write
 * needs `overrideAccess` — the same pattern as the `readAt` marker.
 */
export const recordDeliveryStatus: CollectionAfterChangeHook<
  FormSubmission
> = async ({ doc, operation, req }) => {
  if (operation !== 'create') {
    return doc;
  }

  const notificationStatus = takeOutcome(doc.id);
  if (!notificationStatus) {
    // No send was attempted — a form with no notification emails configured
    // is a normal arrangement, not a failure, and stays null
    return doc;
  }

  try {
    await req.payload.update({
      collection: 'form-submissions',
      id: doc.id,
      data: { notificationStatus },
      depth: 0,
      overrideAccess: true,
      req
    });
  } catch (err) {
    // The submission itself is safe either way; losing the status is not
    // worth failing the request the visitor is still waiting on
    req.payload.logger.error({
      err,
      msg: `[email] Could not record notificationStatus for form submission ${doc.id}`
    });
  }

  return doc;
};
