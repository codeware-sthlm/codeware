import {
  getTourSignupTotals,
  mapToRuntime
} from '@codeware/app-cms/data-access';
import type { Tour } from '@codeware/shared/util/payload-types';
import type { CollectionAfterOperationHook } from 'payload';

/**
 * Fill in how full each tour is on the way out.
 *
 * The site has to know whether to offer a place or the waiting list, and it
 * cannot work that out for itself: signups are readable by admin users only,
 * deliberately, because they are personal data. Totals are safe to publish;
 * the people behind them are not.
 *
 * `afterOperation` rather than `afterRead` because it sees the whole result
 * set — a page of twenty tours costs one query here, where a per-document hook
 * would cost twenty.
 */
export const populateTourCapacity: CollectionAfterOperationHook<
  'tours'
> = async ({ operation, req, result }) => {
  if (operation !== 'find' && operation !== 'findByID') {
    return result;
  }

  const docs: Array<Tour> =
    'docs' in result ? (result.docs as Array<Tour>) : [result as Tour];

  const ids = docs
    .map((doc) => doc?.id)
    .filter((id): id is number => typeof id === 'number');

  if (!ids.length) {
    return result;
  }

  const totals = await getTourSignupTotals(
    mapToRuntime(req.payload, null),
    ids
  );

  for (const doc of docs) {
    const { booked = 0, waiting = 0 } = totals[doc.id] ?? {};
    const max = doc.maxCustomers ?? null;

    doc.seatsTaken = booked;
    doc.seatsWaiting = waiting;
    // Null rather than a large number when there is no maximum: "unlimited"
    // is a different statement from "plenty left", and the site says so
    doc.seatsLeft = max ? Math.max(max - booked, 0) : null;
    doc.signupsFull = max ? booked >= max : false;
  }

  return result;
};
