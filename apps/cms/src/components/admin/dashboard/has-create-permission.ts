import type { useAuth } from '@payloadcms/ui';
import type { CollectionSlug } from 'payload';

/**
 * Whether the current user can create documents in a collection.
 *
 * Truthy check, deliberately not `=== true`: Payload's `sanitizePermissions`
 * only collapses a permission to `true` when it has no `where`; with a row-level
 * `where` (e.g. tenant scoping) it stays `{ permission: true, where }`. The
 * exported `SanitizedCollectionPermission` type models only the `true` case, so
 * a strict `=== true` silently fails for scoped collections. Denied ops are
 * dropped entirely, so truthiness is exact here.
 */
export function hasCreatePermission(
  permissions: ReturnType<typeof useAuth>['permissions'],
  slug: CollectionSlug
): boolean {
  return Boolean(permissions?.collections?.[slug]?.create);
}
