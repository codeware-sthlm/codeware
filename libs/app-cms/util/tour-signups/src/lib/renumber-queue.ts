import { getId } from '@codeware/app-cms/util/misc';
import type { TourSignup } from '@codeware/shared/util/payload-types';
import type { CollectionAfterChangeHook, PayloadRequest } from 'payload';

/**
 * Marks writes that already set queue positions deliberately, so the hook does
 * not undo them. Used by this file's own updates and by the reorder endpoint,
 * which writes a complete 1..n order in one go.
 */
export const SKIP_QUEUE_RENUMBER = 'renumberingQueue';

/**
 * Close the gaps in a tour's waiting list.
 *
 * Positions go sparse the moment somebody leaves the queue — promote #1 and
 * the person who was second is still stored as 2. The guide reads the queue as
 * "who is next", so it has to start at 1 and count without holes, both in the
 * panel and on the signup document itself.
 *
 * Ordering is preserved: rows are renumbered in their existing order, so this
 * never overrides a reordering the guide made.
 */
export async function renumberQueue(
  req: PayloadRequest,
  tourId: number
): Promise<void> {
  const { docs } = await req.payload.find({
    collection: 'tour-signups',
    where: {
      and: [{ tour: { equals: tourId } }, { status: { equals: 'waiting' } }]
    },
    depth: 0,
    pagination: false,
    // Sparse positions still sort correctly; arrival breaks a tie between rows
    // that never got one
    sort: ['queuePosition', 'createdAt'],
    select: { queuePosition: true },
    overrideAccess: true,
    req
  });

  for (const [index, doc] of docs.entries()) {
    const position = index + 1;

    if (doc.queuePosition === position) {
      continue;
    }

    await req.payload.update({
      collection: 'tour-signups',
      id: doc.id,
      data: { queuePosition: position },
      depth: 0,
      overrideAccess: true,
      context: { [SKIP_QUEUE_RENUMBER]: true },
      req
    });
  }
}

/**
 * Renumber the queue whenever a signup enters or leaves it.
 *
 * Runs after the write so it sees the queue as it now stands, and skips its
 * own updates — a renumber that renumbered would not terminate.
 */
export const renumberQueueOnChange: CollectionAfterChangeHook<
  TourSignup
> = async ({ context, doc, operation, previousDoc, req }) => {
  if (context?.[SKIP_QUEUE_RENUMBER]) {
    return doc;
  }

  const wasWaiting =
    operation === 'update' && previousDoc?.status === 'waiting';
  const isWaiting = doc.status === 'waiting';

  if (!wasWaiting && !isWaiting) {
    return doc;
  }

  const tourId = getId(doc.tour);

  if (tourId) {
    await renumberQueue(req, tourId);
  }

  return doc;
};
