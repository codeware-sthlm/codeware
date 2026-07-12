import type { BasePayload } from 'payload';

import { mapToRuntime } from '../map-to-runtime';
import type { PayloadRuntime } from '../payload-runtime.types';

/**
 * Read a single admin-UI preference blob by key.
 *
 * Payload stores each preference as one `payload-preferences` row per user,
 * keyed by `key`; access control scopes rows to the requesting user. Returns
 * the stored value cast to `T`, or `null` when absent or on any failure.
 *
 * Keys are user-writable, so callers own the value shape and should validate
 * it rather than trust the cast.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime or BasePayload instance
 * @param key - Preference key (e.g. `admin-dashboard`)
 * @returns Stored preference value cast to `T`, or `null`
 */
export async function getPreference<T>(
  runtime: PayloadRuntime | BasePayload,
  key: string
): Promise<T | null> {
  const { payload } = mapToRuntime(runtime);

  try {
    const { docs } = await payload.find({
      collection: 'payload-preferences',
      where: { key: { equals: key } },
      limit: 1,
      depth: 0,
      overrideAccess: payload.authenticatedUser === null,
      user: payload.authenticatedUser
    });
    return (docs[0]?.value as T | undefined) ?? null;
  } catch {
    return null;
  }
}
