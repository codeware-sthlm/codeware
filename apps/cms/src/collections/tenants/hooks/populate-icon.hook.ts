import type {
  Tenant,
  TenantIconConfig
} from '@codeware/shared/util/payload-types';
import type { CollectionAfterReadHook, PayloadRequest } from 'payload';

type IconMap = Map<number, TenantIconConfig | null>;

/**
 * Tenant reads arrive as separate Payload operations (access control,
 * filterAvailableLocales, the multi-tenant plugin), each with its own `req` and
 * therefore its own context — so a per-request cache alone still rebuilt this
 * map ~21 times per admin render. Icons change rarely, so the map is held
 * process-wide for a short window and dropped whenever site-settings change.
 */
const CACHE_TTL_MS = 30_000;
let cached: { at: number; promise: Promise<IconMap> } | undefined;

/** Called from the site-settings afterChange hook so edits show up immediately */
export const invalidateIconMap = (): void => {
  cached = undefined;
};

/**
 * Fetches all site-settings in two batched queries (settings + any media URLs)
 * and returns a map of tenantId → iconConfig.
 */
const buildIconMap = async (req: PayloadRequest): Promise<IconMap> => {
  const settings = await req.payload.find({
    collection: 'site-settings',
    // depth:0 keeps tenant as a plain ID — avoids triggering the Tenant
    // afterRead hook recursively while this promise is still pending.
    depth: 0,
    pagination: false,
    select: { tenant: true, general: { icon: true } },
    // Cached across requests, so the result must not depend on the caller.
    // Safe: entries are only ever read for tenant docs that already passed
    // access control in the hook below.
    overrideAccess: true,
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
      overrideAccess: true,
      req
    });
    urlById = new Map(media.docs.map((m) => [m.id, m.url ?? '']));
  }

  const map: IconMap = new Map();
  for (const ss of settings.docs) {
    const tenantId = typeof ss.tenant === 'number' ? ss.tenant : ss.tenant?.id;
    if (!tenantId) continue;

    const icon = ss.general?.icon;
    let iconConfig: TenantIconConfig | null = null;

    if (icon?.source === 'svg' && icon.svgCode) {
      iconConfig = { source: 'svg', svgCode: icon.svgCode };
    } else if (icon?.source === 'upload' && typeof icon.file === 'number') {
      const fileUrl = urlById.get(icon.file);
      if (fileUrl) {
        iconConfig = { source: 'upload', fileUrl };
      }
    }

    map.set(tenantId, iconConfig);
  }

  return map;
};

/**
 * Populates the virtual `iconConfig` field from the tenant's site-settings.
 *
 * All afterRead calls share one batched lookup, reducing the query cost from
 * N+1 to at most 2 queries per cache window.
 */
export const populateIconHook: CollectionAfterReadHook<Tenant> = async ({
  doc,
  req
}) => {
  if (!cached || Date.now() - cached.at >= CACHE_TTL_MS) {
    const promise = buildIconMap(req).catch((error) => {
      // Never cache a failed lookup — the next read should retry
      cached = undefined;
      throw error;
    });
    cached = { at: Date.now(), promise };
  }

  const iconConfig = (await cached.promise).get(doc.id) ?? null;

  return { ...doc, iconConfig };
};
