import type { Tenant } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type TenantData = Pick<
  Tenant,
  'domains' | 'name' | 'description' | 'apiKey'
>;

/**
 * Ensure that a tenant exists and has an API key created.
 *
 * Only one host can be added to domains when creating a tenant.
 * More hosts is better added via admin UI.
 *
 * When the API key is not provided, it will be generated by Payload.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Tenant data
 * @returns The created tenant or the id if the tenant exists
 */
export async function ensureTenant(
  payload: Payload,
  transactionID: string | number | undefined,
  data: TenantData
): Promise<Tenant | string | number> {
  const { apiKey, description, domains, name } = data;

  // Check if the tenant exists with the given name and domains (ignore page types)
  const hosts = domains?.map((d) => d.domain) ?? [];
  const tenants = await payload.find({
    collection: 'tenants',
    where: {
      and: [{ name: { equals: name } }, { 'domains.domain': { in: hosts } }]
    },
    pagination: false,
    req: { transactionID }
  });

  if (tenants.totalDocs > 1) {
    throw new Error(
      `Multiple tenants found with name '${name}' and a matching host '${hosts.join(', ') ?? '<none>'}', skip`
    );
  }

  if (tenants.totalDocs === 1) {
    return tenants.docs[0].id;
  }

  // No tenant found, create one

  const tenant = await payload.create({
    collection: 'tenants',
    data: {
      enableAPIKey: true,
      apiKey,
      description,
      domains,
      name
    },
    req: { transactionID }
  });

  return tenant;
}
