import { Payload } from 'payload';

import { fetchSystemUser } from './infisical-api/fetch-system-user';
import { fetchTenants } from './infisical-api/fetch-tenants';
import type { SeedData } from './seed-types';

/**
 * Load all tenants and a system user from Infisical.
 *
 * Ensure data is valid before saved as seed data.
 *
 * @returns Seed data or null if Infisical is not available
 */
export const loadInfisicalData = async (args: {
  payload: Payload;
  environment: string;
}): Promise<SeedData | null> => {
  const { payload, environment } = args;

  try {
    // Fetch secrets from Infisical
    const { tenants, total } = await fetchTenants(payload, environment);
    const systemUser = await fetchSystemUser(payload, environment);

    if (!total || !systemUser) {
      // Infisical is not available
      return null;
    }

    const seedData: SeedData = {
      categories: [],
      pages: [],
      posts: [],
      tenants: [],
      users: []
    };

    // Ensure all tenants from Infisical are valid in development
    if (
      environment === 'development' &&
      Object.keys(tenants).length !== total
    ) {
      throw 'All tenants from Infisical must be valid in development';
    }

    // Add tenants to seed data
    for (const tenantName in tenants) {
      const tenant = tenants[tenantName];

      // Tenant details
      seedData.tenants.push({
        apiKey: tenant.PAYLOAD_API_KEY,
        description: tenant.PAYLOAD_API_DESCRIPTION,
        name: tenant.PAYLOAD_API_NAME,
        hosts: [tenant.PAYLOAD_API_HOST]
      });

      // Tenant admin user
      seedData.users.push({
        email: tenant.PAYLOAD_ADMIN_EMAIL,
        name: tenant.PAYLOAD_ADMIN_NAME,
        password: tenant.PAYLOAD_ADMIN_PASSWORD,
        role: 'user',
        tenants: [{ lookupApiKey: tenant.PAYLOAD_API_KEY, role: 'admin' }]
      });
    }

    // Add system user to seed data
    seedData.users.push({
      email: systemUser.SYSTEM_ADMIN_EMAIL,
      name: systemUser.SYSTEM_ADMIN_NAME,
      password: systemUser.SYSTEM_ADMIN_PASSWORD,
      role: 'system-user',
      tenants: []
    });

    return seedData;
  } catch (error) {
    payload.logger.error(error);
    payload.logger.error('Something broke while loading data from Infisical');
  }

  return null;
};
