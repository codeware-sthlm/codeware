import type { PlatformSetting } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

/**
 * Ensure the platform-settings singleton exists.
 *
 * Nothing to seed but the row's existence — `ensureSingleRow` refuses a
 * second document, so this only ever creates the first one. An admin fills
 * it in from there (a custom domain, once one is requested).
 *
 * @param payload - Payload instance
 * @param options - Seed options
 * @returns The created document or its id if it already exists
 */
export async function ensurePlatformSettings(
  payload: Payload,
  options: { transactionID: string | number | undefined }
): Promise<PlatformSetting | number> {
  const { transactionID } = options;

  const existing = await payload.find({
    collection: 'platform-settings',
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (existing.totalDocs) {
    return existing.docs[0].id;
  }

  return await payload.create({
    collection: 'platform-settings',
    data: {},
    context: { seedAction: true },
    req: { transactionID }
  });
}
