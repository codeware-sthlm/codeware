import { getId } from '@codeware/app-cms/util/misc';
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

  const outcome = takeOutcome(doc.id);
  const notificationStatus = outcome ?? (await notConfigured(doc, req));

  if (!notificationStatus) {
    // The form has notification emails, but `beforeEmail` never ran (or
    // never left an outcome) — leave it null and log rather than record
    // something that did not happen
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

/**
 * Whether the submission's form has no notification emails configured at
 * all — the one case `beforeEmail` never runs for, so no outcome was ever
 * going to be waiting.
 */
const notConfigured = async (
  doc: FormSubmission,
  req: Parameters<CollectionAfterChangeHook<FormSubmission>>[0]['req']
): Promise<'not-configured' | null> => {
  const formId = getId(doc.form);
  if (!formId) {
    return null;
  }

  const form = await req.payload.findByID({
    collection: 'forms',
    id: formId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
    req
  });

  return form && !form.emails?.length ? 'not-configured' : null;
};
