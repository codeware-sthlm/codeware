import { sendTourSignupEmails } from '@codeware/app-cms/util/email';
import { getId } from '@codeware/app-cms/util/misc';
import type { SupportedLocale } from '@codeware/shared/util/i18n';
import { resolveSignupPolicy } from '@codeware/shared/util/payload-api';
import type { TourSignup } from '@codeware/shared/util/payload-types';
import type { CollectionAfterChangeHook } from 'payload';

/**
 * Tell the customer, and the guide, what happened to a signup.
 *
 * Fires on the two moments that change what a customer knows: they signed up
 * (confirmed, or queued), and they were promoted off the waiting list. A
 * promotion is a mail the guide asked for by pressing the button — the whole
 * reason promotion is manual is that a customer has to be told.
 *
 * Cancellations send nothing. A guide cancelling a drop-off is usually
 * recording something the customer already told them, and mailing "you have
 * been cancelled" back at them would be worse than silence.
 */
export const notifySignup: CollectionAfterChangeHook<TourSignup> = async ({
  doc,
  operation,
  previousDoc,
  req
}) => {
  const promoted =
    operation === 'update' &&
    previousDoc?.status === 'waiting' &&
    doc.status === 'booked';

  if (operation !== 'create' && !promoted) {
    return doc;
  }

  // A cancelled signup created by hand has nothing to confirm
  if (operation === 'create' && doc.status === 'cancelled') {
    return doc;
  }

  const { payload } = req;

  try {
    const tourId = getId(doc.tour);
    const tenantId = getId(doc.tenant);

    // Settings first: they carry the workspace's locale, and the tour's title
    // only exists in that locale — read in another one it comes back empty
    const { docs } = await payload.find({
      collection: 'site-settings',
      where: { tenant: { equals: tenantId } },
      depth: 1,
      limit: 1,
      overrideAccess: true,
      disableErrors: true,
      req
    });
    const settings = docs[0] ?? null;
    const locale =
      (settings?.general?.defaultLocale as SupportedLocale) ?? 'en';

    const tour = await payload.findByID({
      collection: 'tours',
      id: tourId,
      depth: 0,
      locale,
      overrideAccess: true,
      disableErrors: true,
      req
    });

    if (!tour) {
      return doc;
    }

    const policy = resolveSignupPolicy(settings);
    const serverURL = payload.config.serverURL ?? '';
    const absolute = (path: string | null) =>
      path ? `${serverURL}${path}` : null;

    await sendTourSignupEmails({
      payload,
      kind: promoted ? 'promoted' : (doc.status as 'booked' | 'waiting'),
      locale,
      from: settings?.general?.appName ?? '',
      customer: { name: doc.name, email: doc.email, phone: doc.phone },
      tour: {
        title: tour.title,
        departureLabel: tour.departureDate ?? tour.departureNote ?? null
      },
      people: doc.people,
      notificationRecipients: (
        settings?.tourSignups?.notificationRecipients ?? []
      )
        .map((entry) => entry.email)
        .filter(Boolean),
      privacyUrl: absolute(policy.privacyUrl),
      termsUrl: absolute(policy.termsUrl)
    });
  } catch (error) {
    // Never fail the write for a mail — the place on the tour is the thing
    payload.logger.error(`[notifySignup] Could not notify: ${String(error)}`);
  }

  return doc;
};
