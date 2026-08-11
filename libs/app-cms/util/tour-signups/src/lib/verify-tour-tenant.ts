import { getId } from '@codeware/app-cms/util/misc';
import type { TourSignup } from '@codeware/shared/util/payload-types';
import { APIError, type CollectionBeforeValidateHook } from 'payload';

/**
 * Reject a signup that targets another tenant's tour.
 *
 * `ensureTenantFromApiKey` stamps the signup with the caller's own tenant, but
 * the tour relation is whatever the client sent. Document ids are sequential,
 * so without this check a key could post to a guessed tour id and fill another
 * tenant's departure — or read its capacity back through the response.
 *
 * Runs after `ensureTenantFromApiKey` and compares against the tenant on the
 * data rather than the identity, so it also covers callers that bypass access
 * control.
 */
export const verifyTourTenant: CollectionBeforeValidateHook<
  TourSignup
> = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) {
    return data;
  }

  const tourId = getId(data.tour);
  const tenantId = getId(data.tenant);

  // Both are required fields — let validation report them when missing
  if (!tourId || !tenantId) {
    return data;
  }

  const tour = await req.payload.findByID({
    collection: 'tours',
    id: tourId,
    depth: 0,
    // The caller cannot read a tour it does not own, and that is exactly the
    // case to detect — resolve it here and answer with a denial, not a 404
    overrideAccess: true,
    disableErrors: true,
    // Inside the caller's transaction, or a tour created in that same
    // transaction is invisible here and every signup for it is refused
    req
  });

  if (!tour || getId(tour.tenant) !== tenantId) {
    throw new APIError('Tour does not belong to the tenant', 403);
  }

  return data;
};
