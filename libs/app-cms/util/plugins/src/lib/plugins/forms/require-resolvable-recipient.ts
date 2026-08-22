import { customT } from '@codeware/app-cms/util/i18n';
import { getId } from '@codeware/app-cms/util/misc';
import type { Form } from '@codeware/shared/util/payload-types';
import { APIError, type CollectionBeforeValidateHook } from 'payload';

/**
 * Refuse a form that would leave a notification with nowhere to go.
 *
 * `applyDefaultRecipient` already falls back to the tenant's generic
 * recipient at send time, and drops the message when even that resolves to
 * nothing — but a misconfiguration is cheaper to catch here, at save time,
 * than to discover from a `no-recipient` submission days later. This is the
 * same guarantee, checked earlier and pointed at the fix.
 *
 * Triggers on any single notification email left without its own `emailTo`
 * — not only when every one of them is — since each email is resolved
 * independently, and an unaddressed one falls through on its own regardless
 * of what the others carry.
 *
 * Deliberately not enforced by making the tenant setting `required`: see the
 * ticket for why that would block every tenant with no forms at all.
 */
export const requireResolvableRecipient: CollectionBeforeValidateHook<
  Form
> = async ({ data, operation, originalDoc, req }) => {
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  // `data.emails` is `undefined` when the update omits the field (fall back
  // to the saved value) but `null` when it explicitly clears it — clearing
  // is exactly the "no notifications for this form" case, and treating it
  // the same as omitted would judge the update against a stale array and
  // could block a save that removes the last unaddressed email on purpose
  const emails =
    (data?.emails !== undefined ? data.emails : originalDoc?.emails) ?? [];
  const hasUnaddressedEmail = emails.some((email) => !email.emailTo);

  if (!hasUnaddressedEmail) {
    return data;
  }

  const tenantId = getId(data?.tenant ?? originalDoc?.tenant);
  if (!tenantId) {
    return data;
  }

  const { docs } = await req.payload.find({
    collection: 'site-settings',
    where: { tenant: { equals: tenantId } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
    disableErrors: true,
    req
  });

  const hasGenericRecipient = Boolean(
    docs[0]?.forms?.notificationRecipients?.length
  );

  if (!hasGenericRecipient) {
    throw new APIError(customT(req.t)('validation:formNeedsRecipient'), 400);
  }

  return data;
};
