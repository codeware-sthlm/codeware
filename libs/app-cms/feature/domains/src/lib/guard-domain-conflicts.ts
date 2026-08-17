import { customT } from '@codeware/app-cms/util/i18n';
import { APIError, type CollectionBeforeChangeHook } from 'payload';

import type { TenantDomain, TenantWithDomains } from './tenant-domain';

/** Every collection with a `domains` field of this shape */
const DOMAIN_OWNING_COLLECTIONS = ['tenants', 'platform-settings'] as const;

/** Rows that name both a hostname and the app serving it */
const complete = (domains: Array<TenantDomain>) =>
  domains.filter(
    (domain): domain is TenantDomain & { hostname: string; app: string } =>
      Boolean(domain.hostname && domain.app)
  );

/**
 * Refuse a set of domains that cannot all be true at once.
 *
 * Three conflicts, all of which would otherwise surface much later and much
 * worse:
 *
 * - **The same hostname twice on one document.** Both rows would race to own
 *   the certificate, and the panel would show two different states for one
 *   domain.
 * - **A hostname another document already claims** — a different tenant, or
 *   the platform's own settings. Fly refuses the second certificate anyway,
 *   but with wording about an app name that means nothing to whoever is
 *   filling in this form. Worse, on a shared organisation the first
 *   document's traffic is what would move.
 * - **Two primaries for one app.** The primary decides the url the app calls
 *   itself, and there is no sensible tiebreak — leaving it ambiguous means the
 *   answer changes with row order.
 *
 * Registered on every collection in `DOMAIN_OWNING_COLLECTIONS`, so a clash is
 * caught whichever side it was added from.
 *
 * Nothing here checks DNS or issuance. Those are questions for Fly, asked from
 * the panel, and a domain is expected to sit unvalidated for a while.
 */
export const guardDomainConflicts: CollectionBeforeChangeHook<
  TenantWithDomains
> = async ({ collection, data, originalDoc, req }) => {
  const domains = complete(data?.domains ?? []);

  if (!domains.length) {
    return data;
  }

  const t = customT(req.t);
  const seen = new Set<string>();

  for (const { hostname } of domains) {
    if (seen.has(hostname)) {
      throw new APIError(t('validation:domainDuplicate', { hostname }), 400);
    }
    seen.add(hostname);
  }

  const primariesByApp = new Map<string, number>();

  for (const { app, isPrimary } of domains) {
    if (!isPrimary) {
      continue;
    }
    const count = (primariesByApp.get(app) ?? 0) + 1;

    if (count > 1) {
      throw new APIError(t('validation:domainOnePrimary', { app }), 400);
    }
    primariesByApp.set(app, count);
  }

  const selfId = originalDoc?.id ?? data?.id;

  // One query per collection, each covering every hostname at once - a
  // document with a dozen domains should not cost a dozen round trips on
  // each save
  for (const slug of DOMAIN_OWNING_COLLECTIONS) {
    const { docs } = await req.payload.find({
      collection: slug,
      where: { 'domains.hostname': { in: [...seen] } },
      depth: 0,
      limit: 100,
      pagination: false,
      overrideAccess: true,
      req
    });

    for (const other of docs as Array<TenantWithDomains>) {
      // A document always matches its own stored rows on update, and only
      // ever against its own collection - ids are not unique across tables
      if (
        slug === collection.slug &&
        selfId !== undefined &&
        String(other.id) === String(selfId)
      ) {
        continue;
      }

      const clash = (other.domains ?? []).find(
        ({ hostname }) => hostname && seen.has(hostname)
      );

      if (clash?.hostname) {
        const owner =
          slug === 'tenants'
            ? `${t('domains:ownerWorkspace')} "${other.name ?? String(other.id)}"`
            : t('domains:ownerPlatform');

        throw new APIError(
          t('validation:domainTaken', { hostname: clash.hostname, owner }),
          400
        );
      }
    }
  }

  return data;
};
