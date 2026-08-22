import { getId } from '@codeware/app-cms/util/misc';
import { isBlank } from '@codeware/shared/util/pure';
import type {
  BeforeEmail,
  FormattedEmail
} from '@payloadcms/plugin-form-builder/types';

import { recordOutcome } from './delivery-outcomes';
import { getSubmissionId } from './submission-id';

/**
 * Resolve the recipient the plugin left unaddressed, or drop the message.
 *
 * `beforeEmail` sees the recipient already resolved: the plugin applies its
 * own `emailTo || defaultToEmail || payload.email.defaultFromAddress` chain
 * before calling this hook, so `to` already reads `noreply@…` and "the
 * editor chose this" is indistinguishable from "the fallback fired". Reading
 * the form's own stored `emails` is the only way to tell them apart — a
 * message whose form entry carries an `emailTo` is left untouched (its `to`
 * already has that value, template-replaced by the plugin); one that does
 * not is redirected to the tenant's generic recipient.
 *
 * `defaultFromAddress` is a noreply box, not a destination anyone reads —
 * sending a notification there is the silent failure this plugin config
 * exists to remove. A message that still resolves to nothing (no tenant
 * recipient either) is dropped from the batch rather than sent to it, and
 * the submission's outcome is recorded as `no-recipient` so the admin
 * surfaces can say so.
 *
 * Sibling to `applyDefaultSender` — doing for `to` what that one does
 * for `from`.
 */
export const applyDefaultRecipient: BeforeEmail = async (emails, params) => {
  const { data, req } = params;
  const { payload } = req;

  const formId = getId(data?.['form']);
  if (!formId) {
    return emails;
  }

  const form = await payload.findByID({
    collection: 'forms',
    id: formId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
    req
  });

  // Nothing to resolve against — leave the plugin's own fallback in place
  // rather than guess
  if (!form) {
    return emails;
  }

  const formEmails = form.emails ?? [];
  const needsTenantRecipients = formEmails.some((entry) =>
    isBlank(entry.emailTo)
  );

  let tenantRecipients: string | null = null;
  const tenantId = getId(form.tenant);

  if (needsTenantRecipients && tenantId) {
    const { docs } = await payload.find({
      collection: 'site-settings',
      where: { tenant: { equals: tenantId } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
      disableErrors: true,
      req
    });

    const recipients = (docs[0]?.forms?.notificationRecipients ?? [])
      .map((entry) => entry.email)
      .filter(Boolean);

    tenantRecipients = recipients.length ? recipients.join(', ') : null;
  }

  const submissionId = getSubmissionId(params);
  const kept: Array<FormattedEmail> = [];

  emails.forEach((email, index) => {
    if (!isBlank(formEmails[index]?.emailTo)) {
      kept.push(email);
      return;
    }

    if (tenantRecipients) {
      kept.push({ ...email, to: tenantRecipients });
      return;
    }

    if (submissionId != null) {
      recordOutcome(submissionId, 'no-recipient');
    }
    payload.logger.error(
      `[email] Form ${formId} has a notification email with no resolvable recipient — dropped for submission ${submissionId ?? 'unknown'}`
    );
  });

  return kept;
};
