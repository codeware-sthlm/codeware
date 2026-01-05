import type { NavigationDoc, Page } from '@codeware/shared/util/payload-types';
import type { SerializeFrom } from '@remix-run/node';

/**
 * Type guard for Payload docs that removes serialization from the loader data.
 *
 * Payload data is assumed to be serialized JSON, hence:
 * - `JsonifyObject<TResponse> = TResponse`
 *
 * @param value - The value to check and convert.
 * @returns The value as Payload doc.
 */
export function ensurePayloadDoc(
  value: SerializeFrom<NavigationDoc> | undefined | null
): NavigationDoc | null;
export function ensurePayloadDoc(
  value: SerializeFrom<Page> | undefined | null
): Page | null;
export function ensurePayloadDoc(
  value: SerializeFrom<NavigationDoc | Page> | undefined | null
): NavigationDoc | Page | null {
  if (!value || typeof value !== 'object') return null;

  if ('collection' in value) {
    return value as unknown as NavigationDoc;
  }
  if ('layout' in value) {
    return value as unknown as Page;
  }
  return null;
}
