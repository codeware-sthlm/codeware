import type {
  Tenant,
  TenantsArrayField
} from '@codeware/shared/util/payload-types';

type PageTypes = NonNullable<Tenant['domains']>[number]['pageTypes'];

/**
 * Get domains for a user's tenants, optionally filtered by page types.
 *
 * @param tenants - The tenants to get domains for.
 * @param pageTypes - Optional array of page types to filter domains.
 * @returns Array of domain strings.
 */
export const getDomains = (
  tenants: TenantsArrayField,
  pageTypes?: PageTypes
) => {
  const domains =
    tenants
      ?.flatMap(({ tenant }) =>
        typeof tenant === 'number' ? [] : tenant.domains
      )
      ?.filter((d) => d != null) ?? [];

  const filteredDomains = pageTypes
    ? domains.filter(
        ({ pageTypes }) =>
          pageTypes && pageTypes.some((pt) => pageTypes.includes(pt))
      )
    : domains;

  return filteredDomains.map(({ domain }) => domain);
};
