import { customT } from '@codeware/app-cms/util/i18n';
import { getId } from '@codeware/app-cms/util/misc';
import type { TourSignup } from '@codeware/shared/util/payload-types';
import { APIError, type CollectionBeforeChangeHook } from 'payload';

import { lockTour, nextQueuePosition, sumBookedPeople } from './capacity';
import { fitsCapacity } from './decide-signup-status';

/**
 * Keep a hand-edited signup inside the tour's capacity.
 *
 * Cancelling and queueing only ever free seats, so they pass untouched. Taking
 * a seat — promoting off the waiting list, reactivating a cancelled customer,
 * or growing the party of a booked one — is refused when it would push the
 * tour past its maximum. The guide is the one who decides who travels, so the
 * message names the shortfall and the two ways out rather than only saying no.
 *
 * The queue position follows the status: a row that leaves the waiting list
 * gives up its place, and one that joins goes to the end.
 */
export const guardStatusChange: CollectionBeforeChangeHook<
  TourSignup
> = async ({ data, operation, originalDoc, req }) => {
  if (operation !== 'update' || !originalDoc) {
    return data;
  }

  const status = data.status ?? originalDoc.status;
  const people = data.people ?? originalDoc.people;
  const tourId = getId(data.tour ?? originalDoc.tour);

  if (!tourId) {
    return data;
  }

  if (status !== 'booked') {
    if (status === 'waiting' && originalDoc.status !== 'waiting') {
      return { ...data, queuePosition: await nextQueuePosition(req, tourId) };
    }
    return status === 'cancelled' ? { ...data, queuePosition: null } : data;
  }

  const tour = await req.payload.findByID({
    collection: 'tours',
    id: tourId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
    req
  });

  const maxCustomers = tour?.maxCustomers;

  // Nothing to guard against without a maximum, and nothing to recheck when
  // the row was already booked for this many people
  const unchanged =
    originalDoc.status === 'booked' && people === originalDoc.people;

  if (!maxCustomers || unchanged) {
    return { ...data, queuePosition: null };
  }

  await lockTour(req, tourId);

  // Excluding this signup keeps a booked row from blocking its own save
  const taken = await sumBookedPeople(req, tourId, originalDoc.id);

  if (!fitsCapacity({ maxCustomers, people, taken })) {
    throw new APIError(
      customT(req.t)('validation:signupWouldOverbook', {
        available: Math.max(maxCustomers - taken, 0),
        max: maxCustomers,
        people
      }),
      400
    );
  }

  return { ...data, queuePosition: null };
};
