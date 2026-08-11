import type { Payload } from 'payload';

/**
 * Twelve people against the twelve places the seed sets, then two more.
 *
 * The overflow is the point: it leaves a full tour with a real queue behind
 * it, which is what makes the fill bar, the waiting list and the promote
 * button worth looking at. Who ends up where is decided by the capacity hook
 * on create, not by this list.
 */
const SIGNUPS = [
  { name: 'Anna Berg', email: 'anna.berg@example.com', people: 2 },
  { name: 'Karl Sundström', email: 'karl.sundstrom@example.com', people: 4 },
  { name: 'Lena Marklund', email: 'lena.marklund@example.com', people: 1 },
  { name: 'Petra Öberg', email: 'petra.oberg@example.com', people: 3 },
  { name: 'Johan Falk', email: 'johan.falk@example.com', people: 2 },
  {
    name: 'Mikael Ridderstad',
    email: 'mikael.ridderstad@example.com',
    people: 2
  },
  { name: 'Sofia Lund', email: 'sofia.lund@example.com', people: 1 }
] as const;

/**
 * Give a tour a plausible signup list.
 *
 * The point is the states, not the volume: a tour that is nearly full, with a
 * party that did not fit behind it, is what makes the fill bar, the waiting
 * queue and the promote button worth looking at in development. Capacity
 * decides each status on create — the seed only supplies people.
 *
 * @param payload - Payload instance
 * @param data - Tour to fill and the workspace it belongs to
 * @param options - Seed options
 * @returns Number of signups created
 */
export async function ensureTourSignups(
  payload: Payload,
  data: { tour: number; tenant: number },
  options: { transactionID: string | number | undefined }
): Promise<number> {
  const { tenant, tour } = data;
  const { transactionID } = options;

  const existing = await payload.count({
    collection: 'tour-signups',
    where: { tour: { equals: tour } },
    req: { transactionID }
  });

  if (existing.totalDocs) {
    return 0;
  }

  for (const signup of SIGNUPS) {
    await payload.create({
      collection: 'tour-signups',
      data: { ...signup, tour, tenant, status: 'booked' },
      context: { seedAction: true },
      req: { transactionID }
    });
  }

  return SIGNUPS.length;
}
