import type { CollectionAfterReadHook, PayloadRequest } from 'payload';

import type { Tenant } from '@codeware/shared/util/payload-types';

type IconMap = Map<number, string | null>;

/**
 * Fetches all site-settings in two batched queries (settings + any media URLs)
 * and returns a map of tenantId → iconSource.
 *
 * Called once per request; the result is cached on req.context.
 */
const buildIconMap = async (req: PayloadRequest): Promise<IconMap> => {
  const settings = await req.payload.find({
    collection: 'site-settings',
    // depth:0 keeps tenant as a plain ID — avoids triggering the Tenant
    // afterRead hook recursively while this promise is still pending.
    depth: 0,
    pagination: false,
    select: { tenant: true, general: { icon: true } },
    req
  });

  // Collect upload file IDs so we can batch-fetch their URLs in one query.
  const fileIds = settings.docs.flatMap((ss) => {
    const file = ss.general?.icon?.file;
    return ss.general?.icon?.source === 'upload' && typeof file === 'number'
      ? [file]
      : [];
  });

  let urlById = new Map<number, string>();
  if (fileIds.length > 0) {
    const media = await req.payload.find({
      collection: 'media',
      where: { id: { in: fileIds } },
      limit: fileIds.length,
      depth: 0,
      select: { url: true },
      req
    });
    urlById = new Map(media.docs.map((m) => [m.id, m.url ?? '']));
  }

  const map: IconMap = new Map();
  for (const ss of settings.docs) {
    const tenantId = typeof ss.tenant === 'number' ? ss.tenant : ss.tenant?.id;
    if (!tenantId) continue;

    const icon = ss.general?.icon;
    let iconSource: string | null = null;

    if (icon?.source === 'svg' && icon.svgCode) {
      iconSource = icon.svgCode;
    } else if (icon?.source === 'upload' && typeof icon.file === 'number') {
      iconSource = urlById.get(icon.file) ?? null;
    }

    map.set(tenantId, iconSource);
  }

  return map;
};

/**
 * Populates the virtual `iconSource` field from the tenant's site-settings.
 *
 * All afterRead calls within a single request share one batched lookup via
 * req.context, reducing the query cost from N+1 to at most 2 queries flat.
 */
export const populateIconHook: CollectionAfterReadHook<Tenant> = async ({
  doc,
  req,
  context
}) => {
  if (!context.tenantIconMap) {
    context.tenantIconMap = buildIconMap(req);
  }

  const iconSource =
    (await (context.tenantIconMap as Promise<IconMap>)).get(doc.id) ?? null;

  return { ...doc, iconSource };
};
