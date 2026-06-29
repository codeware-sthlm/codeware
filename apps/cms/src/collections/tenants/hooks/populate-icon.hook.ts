import type { CollectionAfterReadHook } from 'payload';

import type { Tenant } from '@codeware/shared/util/payload-types';

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
    // depth:1 populates icon.file so we get its URL without a second query.
    // select restricts DB columns to only the icon group, which means the
    // tenant relationship column is never fetched and cannot recurse back here.
    depth: 1,
    select: { general: { icon: true } }
  });

  if (!result.docs.length) {
    return doc;
  }

  let iconSource: string | null = null;

  const icon = result.docs[0].general.icon;

  if (icon?.source === 'svg' && icon.svgCode) {
    iconSource = icon.svgCode;
  } else if (
    icon?.source === 'upload' &&
    icon.file &&
    typeof icon.file !== 'number'
  ) {
    iconSource = icon.file.url ?? null;
  }

  return { ...doc, iconSource };
};
