import type { Tenant } from '@codeware/shared/util/payload-types';
import type { Payload, PayloadRequest } from 'payload';

export type TenantData = Pick<Tenant, 'name' | 'description' | 'apiKey'> & {
  hosts: Array<string>;
};

/**
 * Ensure that a tenant exists and has an API key created.
 *
 * Only one host can be added to domains when creating a tenant.
 * More hosts is better added via admin UI.
 *
 * When the API key is not provided, it will be generated by Payload.
 *
 * @param payload - Payload instance
 * @param req - Payload request with transaction ID when supported by the database
 * @param data - Tenant data
 * @returns The created tenant or the id if the tenant exists
 */
export async function ensureTenant(
  payload: Payload,
  req: PayloadRequest,
  data: TenantData
): Promise<Tenant | string | number> {
  const { apiKey, description, hosts, name } = data;

  // Check if the tenant exists with the given host (name )
  const tenants = await payload.find({
    req,
    collection: 'tenants',
    where: {
      and: [{ name: { equals: name } }, { 'domains.domain': { in: hosts } }]
    },
    pagination: false
  });

  if (tenants.totalDocs > 1) {
    throw new Error(
      `Multiple tenants found with name '${name}' and a matching host '${hosts.join(', ')}', skip`
    );
  }

  if (tenants.totalDocs === 1) {
    return tenants.docs[0].id;
  }

  // No tenant found, create one

  const tenant = await payload.create({
    req,
    collection: 'tenants',
    data: {
      enableAPIKey: true,
      apiKey,
      description,
      domains: hosts.map((host) => ({ domain: host })),
      name
    }
  });

  return tenant;
}
