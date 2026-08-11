import { getId } from '@codeware/app-cms/util/misc';

import type { PayloadRuntime } from '../payload-runtime.types';

/** People per status on one tour */
export type TourSignupTotals = {
  /** People holding a seat */
  booked: number;
  /** People on the waiting list */
  waiting: number;
  /** People who have cancelled */
  cancelled: number;
  /** Signup documents, whatever their status */
  signups: number;
};

const emptyTotals = (): TourSignupTotals => ({
  booked: 0,
  waiting: 0,
  cancelled: 0,
  signups: 0
});

/**
 * Sum signups per status for a set of tours.
 *
 * Capacity is derived rather than stored, so this is what "12 / 20" is made
 * of. One query covers the whole set — a tours listing asks for every row at
 * once instead of counting per tour, which is the difference between one query
 * and twenty on a page of tours.
 *
 * Reads with `overrideAccess` on purpose: the caller has usually already been
 * cleared to see the tours in question, and only totals leave this function —
 * never a customer's name. Callers must scope the tour ids themselves.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param tourIds - Tours to total up
 * @returns Totals keyed by tour id; tours without signups are present as zeros
 */
export async function getTourSignupTotals(
  runtime: PayloadRuntime,
  tourIds: Array<number>
): Promise<Record<number, TourSignupTotals>> {
  const { payload } = runtime;

  const totals: Record<number, TourSignupTotals> = Object.fromEntries(
    tourIds.map((id) => [id, emptyTotals()])
  );

  if (!tourIds.length) {
    return totals;
  }

  const { docs } = await payload.find({
    collection: 'tour-signups',
    where: { tour: { in: tourIds } },
    depth: 0,
    pagination: false,
    select: { tour: true, people: true, status: true },
    overrideAccess: true
  });

  for (const doc of docs) {
    const tourId = getId(doc.tour);
    const entry = totals[tourId];

    if (!entry) {
      continue;
    }

    entry.signups += 1;
    entry[doc.status] += doc.people ?? 0;
  }

  return totals;
}
