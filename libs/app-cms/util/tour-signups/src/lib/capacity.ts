import type { PostgresAdapter } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';
import { APIError, type PayloadRequest } from 'payload';

/**
 * Hold the tour row until the surrounding transaction ends.
 *
 * The last seat is a race: two customers submitting at the same time both read
 * the same `taken` and both come out booked. Postgres serializes them here
 * instead — the second signup waits at this statement until the first has
 * committed, and then sums a total that already includes it.
 *
 * The row is only a rendezvous point; nothing about the tour is written.
 */
async function lockTour(req: PayloadRequest, tourId: number): Promise<void> {
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const tours = adapter.tables?.['tours'];

  if (!tours) {
    // Without the lock the capacity check is advisory, and a tour that quietly
    // overbooks is worse than a signup that fails loudly
    throw new APIError('Cannot resolve the tours table to lock', 500);
  }

  // Outside a transaction the lock is released immediately and buys nothing,
  // but the sum that follows is still worth doing. Payload opens a transaction
  // for writes on this adapter, so this is the local API edge case.
  const db = req.transactionID
    ? adapter.sessions?.[String(req.transactionID)]?.db
    : undefined;

  await adapter.execute({
    db: db ?? adapter.drizzle,
    // Drizzle renders the table schema-qualified and the id as a bound
    // parameter, so neither is glued in by hand
    sql: sql`select ${tours.id} from ${tours} where ${tours.id} = ${tourId} for update`
  });
}

/**
 * People already booked on a tour.
 *
 * @param excludeId - Signup to leave out, so a row being updated does not
 *   count against itself.
 */
async function sumBookedPeople(
  req: PayloadRequest,
  tourId: number,
  excludeId?: number | string
): Promise<number> {
  const { docs } = await req.payload.find({
    collection: 'tour-signups',
    where: {
      and: [
        { tour: { equals: tourId } },
        { status: { equals: 'booked' } },
        ...(excludeId ? [{ id: { not_equals: excludeId } }] : [])
      ]
    },
    depth: 0,
    pagination: false,
    select: { people: true },
    // Runs on behalf of the caller creating the signup, who is not allowed to
    // read other people's signups — only the total is used
    overrideAccess: true,
    req
  });

  return docs.reduce((total, doc) => total + (doc.people ?? 0), 0);
}

/**
 * Next free place at the end of the waiting list.
 *
 * Positions are only ever appended here; the guide reorders them explicitly.
 */
async function nextQueuePosition(
  req: PayloadRequest,
  tourId: number
): Promise<number> {
  const { docs } = await req.payload.find({
    collection: 'tour-signups',
    where: {
      and: [{ tour: { equals: tourId } }, { status: { equals: 'waiting' } }]
    },
    depth: 0,
    limit: 1,
    sort: '-queuePosition',
    select: { queuePosition: true },
    overrideAccess: true,
    req
  });

  return (docs[0]?.queuePosition ?? 0) + 1;
}

export { lockTour, nextQueuePosition, sumBookedPeople };
