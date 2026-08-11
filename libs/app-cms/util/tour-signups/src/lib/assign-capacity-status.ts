import { customT } from '@codeware/app-cms/util/i18n';
import { getId, isTenant } from '@codeware/app-cms/util/misc';
import type { TourSignup } from '@codeware/shared/util/payload-types';
import { APIError, type CollectionBeforeChangeHook } from 'payload';

import { lockTour, nextQueuePosition, sumBookedPeople } from './capacity';
import { decideSignupStatus } from './decide-signup-status';

/**
 * Decide the status of a new signup from the tour's capacity.
 *
 * The decision belongs on the server: a browser can be told the tour has room
 * and post anyway, and two customers can hit the last seat at the same moment.
 * `lockTour` serializes them, then the sum decides.
 *
 * A tenant api key never gets to pick a status — whatever it sent is replaced.
 * An admin user may create a signup as `cancelled` or `waiting` deliberately
 * (a phone call, a customer who asked to queue), so only `booked` is put
 * through the capacity check for them. Likewise `signupsClosed` closes the tour
 * to the public, not to the guide who closed it.
 */
export const assignCapacityStatus: CollectionBeforeChangeHook<
  TourSignup
> = async ({ data, operation, req }) => {
  if (operation !== 'create') {
    return data;
  }

  const fromApiKey = isTenant(req.user);
  const tourId = getId(data.tour);

  if (!tourId) {
    // Required field — validation reports it
    return data;
  }

  // An admin user asking for anything but a seat is taken at their word
  if (!fromApiKey && data.status && data.status !== 'booked') {
    return data.status === 'waiting'
      ? { ...data, queuePosition: await nextQueuePosition(req, tourId) }
      : data;
  }

  const tour = await req.payload.findByID({
    collection: 'tours',
    id: tourId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
    req
  });

  if (!tour) {
    // `verifyTourTenant` has already refused an unknown tour for an api key
    return data;
  }

  if (fromApiKey && tour.signupsClosed) {
    throw new APIError(customT(req.t)('validation:tourClosedForSignups'), 403);
  }

  await lockTour(req, tourId);

  const people = data.people ?? 1;
  const taken = await sumBookedPeople(req, tourId);
  const status = decideSignupStatus({
    maxCustomers: tour.maxCustomers,
    people,
    taken
  });

  return status === 'waiting'
    ? { ...data, status, queuePosition: await nextQueuePosition(req, tourId) }
    : { ...data, status, queuePosition: null };
};
