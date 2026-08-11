import type { Payload, PayloadRequest, Where } from 'payload';

/** Stand-in name, so a cleared row still reads as a row */
const ANONYMIZED_NAME = 'Anonymized';

/**
 * `.invalid` is reserved by RFC 2606 and can never resolve, so a cleared
 * address cannot accidentally be mailed. The id keeps the column's uniqueness
 * assumptions intact if any are ever added.
 */
const anonymizedEmail = (id: number | string) =>
  `anonymized-${id}@anonymized.invalid`;

/** What is cleared, and what deliberately survives */
const anonymizedFields = (id: number | string) => ({
  name: ANONYMIZED_NAME,
  email: anonymizedEmail(id),
  phone: null,
  notes: null,
  anonymizedAt: new Date().toISOString()
});

/**
 * Clear the personal data on a set of signups.
 *
 * Anonymising rather than deleting: `people` and `status` are what capacity
 * history is made of — how full a tour ran, how long its queue was — and none
 * of that says anything about who anyone is. The name, address, phone number
 * and the guide's notes are the personal data, and they go.
 *
 * Rows already cleared are skipped, so this is safe to run repeatedly — which
 * the nightly sweep does by design.
 *
 * @returns Ids that were cleared by this call
 */
export async function anonymizeSignups(
  payload: Payload,
  where: Where,
  req?: PayloadRequest
): Promise<Array<number>> {
  const { docs } = await payload.find({
    collection: 'tour-signups',
    where: { and: [where, { anonymizedAt: { exists: false } }] },
    depth: 0,
    pagination: false,
    // `id` always comes back; selecting nothing else keeps the row small
    select: {},
    overrideAccess: true,
    req
  });

  const cleared: Array<number> = [];

  for (const doc of docs) {
    await payload.update({
      collection: 'tour-signups',
      id: doc.id,
      data: anonymizedFields(doc.id),
      depth: 0,
      overrideAccess: true,
      req
    });
    cleared.push(doc.id);
  }

  return cleared;
}

/**
 * Clear every signup on one tour, whatever its status.
 *
 * The guide's "clear passenger data" action: once a tour is over, the list has
 * done its job and there is no reason to keep a stranger's phone number on
 * file until the retention period happens to come round.
 */
export async function anonymizeTourSignups(
  payload: Payload,
  tourId: number,
  req?: PayloadRequest
): Promise<Array<number>> {
  return anonymizeSignups(payload, { tour: { equals: tourId } }, req);
}

/**
 * Clear signups whose tour departed longer ago than its workspace allows.
 *
 * Retention is set per workspace, so the sweep runs per workspace: each site
 * settings document gives a cutoff, and the tours that departed before it hand
 * over their signups. A tour with no departure date has nothing to count from
 * and is left alone — it has not happened yet.
 *
 * @returns Number of signups cleared across all workspaces
 */
export async function sweepExpiredSignups(payload: Payload): Promise<number> {
  const { docs: settings } = await payload.find({
    collection: 'site-settings',
    depth: 0,
    pagination: false,
    overrideAccess: true
  });

  let cleared = 0;

  for (const doc of settings) {
    const retentionDays = doc.tourSignups?.retentionDays;
    const tenantId =
      typeof doc.tenant === 'number' ? doc.tenant : doc.tenant?.id;

    if (!retentionDays || !tenantId) {
      continue;
    }

    const cutoff = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { docs: tours } = await payload.find({
      collection: 'tours',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { departureDate: { less_than: cutoff } }
        ]
      },
      depth: 0,
      pagination: false,
      select: {},
      overrideAccess: true
    });

    if (!tours.length) {
      continue;
    }

    const ids = await anonymizeSignups(payload, {
      tour: { in: tours.map((tour) => tour.id) }
    });

    cleared += ids.length;
  }

  return cleared;
}
