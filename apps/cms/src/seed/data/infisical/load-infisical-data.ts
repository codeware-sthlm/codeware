import type { SeedAsync, SeedData } from '../seed.types';

import { fetchSystemUser } from './fetch-system-user';
import { fetchTenants } from './fetch-tenants';

/**
 * Load all tenants and a system user from Infisical.
 *
 * Ensure data is valid before saved as seed data.
 *
 * @returns Seed data or null if Infisical is not available
 */
export const loadInfisicalData: SeedAsync = async ({ payload, env }) => {
  try {
    // Fetch secrets from Infisical
    const { tenants, total } = await fetchTenants(env, payload);
    const systemUser = await fetchSystemUser(env, payload);

    if (!total || !systemUser) {
      // Infisical is not available
      return null;
    }

    const seedData: SeedData = {
      articles: [],
      pages: [],
      tenants: [],
      users: []
    };

    // Ensure all tenants from Infisical are valid in development
    if (
      env.DEPLOY_ENV === 'development' &&
      Object.keys(tenants).length !== total
    ) {
      throw '[SEED] All tenants from Infisical must be valid in development';
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
        tenants: [{ lookupName: tenant.PAYLOAD_API_NAME, role: 'admin' }]
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
    payload.logger.error(
      '[SEED] Something broke while loading data from Infisical'
    );
  }

  return null;
};
