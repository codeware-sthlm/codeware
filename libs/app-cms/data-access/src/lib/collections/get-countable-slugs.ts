import type { BasePayload, CollectionSlug, TypedUser } from 'payload';

/**
 * The collection slugs worth counting/showing for a user.
 *
 * Excludes Payload-internal (`payload-*`) collections, any slugs in `skip`,
 * and collections hidden from this user via `admin.hidden` (resolved per user,
 * mirroring how the client nav decides visibility).
 *
 * @param payload - Payload instance (for the sanitized collection configs)
 * @param user - Authenticated user, used to resolve per-user `admin.hidden`
 * @param options - Optional set of slugs to always exclude
 * @returns Visible, countable collection slugs
 */
export function getCountableSlugs(
  payload: BasePayload,
  user: TypedUser | null | undefined,
  options: { skip?: Set<CollectionSlug> } = {}
): CollectionSlug[] {
  const { skip } = options;

  return payload.config.collections
    .filter((collection) => {
      const slug = collection.slug as CollectionSlug;
      if (slug.startsWith('payload-') || skip?.has(slug)) {
        return false;
      }
      const { hidden } = collection.admin ?? {};
      const isHidden =
        typeof hidden === 'function'
          ? hidden({ user: user as Parameters<typeof hidden>[0]['user'] })
          : Boolean(hidden);
      return !isHidden;
    })
    .map((collection) => collection.slug as CollectionSlug);
}
