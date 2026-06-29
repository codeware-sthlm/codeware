import type { CollectionAfterReadHook } from 'payload';

import type { Media, Tenant } from '@codeware/shared/util/payload-types';

/**
 * Populates the virtual `iconSource` field from the tenant's site-settings.
 *
 * Returns the raw SVG string for svg source, or the media URL for upload source.
 */
export const populateIconHook: CollectionAfterReadHook<Tenant> = async ({
  doc,
  req
}) => {
  const result = await req.payload.find({
    collection: 'site-settings',
    where: { tenant: { equals: doc.id } },
    limit: 1,
    depth: 0 // Important! Prevents infinite recursion on tenants lookup
  });

  if (!result.docs.length) {
    return doc;
  }

  let iconSource: string | null = null;

  const icon = result.docs[0].general.icon;

  if (icon?.source === 'svg' && icon.svgCode) {
    iconSource = icon.svgCode;
  } else if (icon?.source === 'upload' && icon.file) {
    const fileId =
      typeof icon.file === 'number' ? icon.file : (icon.file as Media).id;
    try {
      const media = await req.payload.findByID({
        collection: 'media',
        id: fileId,
        depth: 0
      });
      iconSource = media?.url ?? null;
    } catch {
      // Non-fatal: icon URL unavailable
    }
  }

  return { ...doc, iconSource };
};
