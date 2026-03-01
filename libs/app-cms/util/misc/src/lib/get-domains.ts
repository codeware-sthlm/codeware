import type {
  Tenant,
  TenantsArrayField
} from '@codeware/shared/util/payload-types';

type PageTypes = NonNullable<Tenant['domains']>[number]['pageTypes'];

/**
 * Get domains from tenants or the tenants array field,
 * optionally filtered by page types.
 *
 * @param tenants - The tenants to get domains for.
 * @param pageTypes - Optional array of page types to filter domains.
 * @returns Array of domain objects.
 */
export const getDomains = (
  tenants: TenantsArrayField | Tenant[],
  pageTypes?: PageTypes
) => {
  const resolvedTenants =
    tenants
      ?.flatMap((item) => ('tenant' in item ? item.tenant : item))
      ?.filter((tenant): tenant is Tenant => typeof tenant !== 'number') ?? [];

  const domains = resolvedTenants.flatMap(({ domains }) => domains ?? []);

  return pageTypes
    ? domains.filter((domain) =>
        domain.pageTypes.some((pt) => pageTypes.includes(pt))
      )
    : domains;
};
