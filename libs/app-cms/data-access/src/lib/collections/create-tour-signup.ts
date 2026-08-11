import type { TourSignup } from '@codeware/shared/util/payload-types';

import type { PayloadRuntime } from '../payload-runtime.types';

/** What a customer may send; everything else is decided server-side */
export type TourSignupInput = Pick<
  TourSignup,
  'tour' | 'name' | 'email' | 'people'
> &
  Partial<Pick<TourSignup, 'phone'>>;

/**
 * Create a tour signup on behalf of a customer.
 *
 * Only the customer's own details are passed through. Status, queue position
 * and the tenant are all stamped by hooks — a client that could choose its own
 * status would book itself onto a full tour, which is the whole point of the
 * capacity check.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param data - The customer's signup details
 * @returns The created signup document
 * @throws When the tour is closed, full beyond its waiting list, or not the
 *   caller's own
 */
export async function createTourSignup(
  runtime: PayloadRuntime,
  data: TourSignupInput
): Promise<TourSignup> {
  const { payload } = runtime;
  const { email, name, people, phone, tour } = data;

  return await payload.create({
    collection: 'tour-signups',
    // `status` is what the customer is asking for, not what they get:
    // `assignCapacityStatus` replaces it with the answer capacity allows
    data: { tour, name, email, people, phone, status: 'booked' },
    overrideAccess: payload.authenticatedUser === null,
    user: payload.authenticatedUser
  });
}
