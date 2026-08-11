import type { TourSignup } from '@codeware/shared/util/payload-types';
import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Record when the status last moved.
 *
 * `createdAt` is when the customer signed up and never moves; `status` and the
 * queue position do. Keeping both means a promoted or reordered row can say
 * what it is now without losing when it arrived — which is the whole basis for
 * a queue the guide is allowed to reorder.
 */
export const stampStatusChange: CollectionBeforeChangeHook<TourSignup> = ({
  data,
  operation,
  originalDoc
}) => {
  if (operation === 'create') {
    return { ...data, statusChangedAt: new Date().toISOString() };
  }

  if (data.status && data.status !== originalDoc?.status) {
    return { ...data, statusChangedAt: new Date().toISOString() };
  }

  return data;
};
