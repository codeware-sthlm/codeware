import { customT } from '@codeware/app-cms/util/i18n';
import { APIError, type CollectionBeforeChangeHook } from 'payload';

import type { TenantDomain, TenantWithDomains } from './tenant-domain';

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
 * - **The same hostname twice on one tenant.** Both rows would race to own the
 *   certificate, and the panel would show two different states for one domain.
 * - **A hostname another workspace already claims.** Fly refuses the second
 *   certificate anyway, but with wording about an app name that means nothing
 *   to whoever is filling in this form. Worse, on a shared organisation the
 *   first workspace's traffic is what would move.
 * - **Two primaries for one app.** The primary decides the url the app calls
 *   itself, and there is no sensible tiebreak — leaving it ambiguous means the
 *   answer changes with row order.
 *
 * Nothing here checks DNS or issuance. Those are questions for Fly, asked from
 * the panel, and a domain is expected to sit unvalidated for a while.
 */
export const guardDomainConflicts: CollectionBeforeChangeHook<
  TenantWithDomains
> = async ({ data, originalDoc, req }) => {
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

  // One query for every hostname at once - a tenant with a dozen domains
  // should not cost a dozen round trips on each save
  const { docs } = await req.payload.find({
    collection: 'tenants',
    where: { 'domains.hostname': { in: [...seen] } },
    depth: 0,
    limit: 100,
    pagination: false,
    overrideAccess: true,
    req
  });

  const selfId = originalDoc?.id ?? data?.id;

  for (const other of docs as Array<TenantWithDomains>) {
    // A tenant always matches its own stored rows on update
    if (selfId !== undefined && String(other.id) === String(selfId)) {
      continue;
    }

    const clash = (other.domains ?? []).find(
      ({ hostname }) => hostname && seen.has(hostname)
    );

    if (clash?.hostname) {
      throw new APIError(
        t('validation:domainTaken', {
          hostname: clash.hostname,
          tenant: other.name ?? String(other.id)
        }),
        400
      );
    }
  }

  return data;
};
