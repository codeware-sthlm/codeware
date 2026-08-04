import type { PlatformLabel } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type PlatformLabelData = Pick<
  PlatformLabel,
  'description' | 'icon' | 'name' | 'type'
>;

/**
 * Ensure that a platform label exist with the given name and type.
 *
 * Labels are platform-owned and have no tenant, and names are unique within a
 * type, so the pair identifies the document.
 *
 * @param payload - Payload instance
 * @param data - Label data
 * @param options - Seed options
 * @returns The created label or the id if it exists
 */
export async function ensurePlatformLabel(
  payload: Payload,
  data: PlatformLabelData,
  options: { transactionID: string | number | undefined }
): Promise<PlatformLabel | number> {
  const { transactionID } = options;
  const { name, type } = data;

  const existing = await payload.find({
    collection: 'platform-labels',
    where: {
      and: [{ type: { equals: type } }, { name: { equals: name } }]
    },
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (existing.totalDocs) {
    return existing.docs[0].id;
  }

  return await payload.create({
    collection: 'platform-labels',
    data,
    context: { seedAction: true },
    req: { transactionID }
  });
}
