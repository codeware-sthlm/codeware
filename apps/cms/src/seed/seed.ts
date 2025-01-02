import payload, { type Payload } from 'payload';

import type { Env } from '../env-resolver/env.schema';

import { loadDevelopmentData } from './data/development/load-development-data';
import { loadInfisicalData } from './data/infisical/load-infisical-data';
import type { SeedData } from './data/seed.types';
import { ensureArticle } from './utils/ensure-article';
import { ensurePage } from './utils/ensure-page';
import { ensureTenant } from './utils/ensure-tenant';
import { ensureUser } from './utils/ensure-user';
import { lookupTenant, lookupTenantRole } from './utils/lookup-tenants';

/**
 * Seed tenants, users, pages and articles.
 *
 * The seed function is designed to only make changes when needed.
 * It can run multiple times without creating duplicates.
 *
 * Data is always loaded from Infisical first for all deploy environments.
 * If no data is found, it will use development data, except for production.
 *
 * If no data is found in Infisical or development data, it will skip seeding.
 */
export const seed = async (args: {
  payload: Payload;
  env: Env;
}): Promise<void> => {
  try {
    const { payload, env } = args;

    let seedData: SeedData | null;

    payload.logger.info('[SEED] Seed started');

    // Try to load seed data from Infisical
    seedData = await loadInfisicalData(args);

    // If no seed data is loaded, use development data if not in production
    if (!seedData) {
      if (env.DEPLOY_ENV === 'production') {
        payload.logger.warn(
          '[SEED] Could not load secrets from Infisical, skip seeding'
        );
        return;
      }

      payload.logger.info(
        '[SEED] Could not load secrets from Infisical, use development data'
      );
      seedData = loadDevelopmentData();

      if (!seedData) {
        payload.logger.error(
          '[SEED] Could not load development data, skip seeding'
        );
        return;
      }
    }

    if (seedData.tenants.length === 0) {
      payload.logger.error('[SEED] No tenants seed data found, skip seeding');
      return;
    }

    // TENANTS

    payload.logger.info('[SEED] === Tenants setup ===');

    const tenantMap = new Map<string, number>();
    for (const tenant of seedData.tenants) {
      const id = await ensureTenant(payload, {
        apiKey: tenant.apiKey,
        description: tenant.description,
        name: tenant.name,
        hosts: tenant.hosts
      });

      if (id) {
        tenantMap.set(tenant.name, Number(id));
      }
    }

    // USERS

    if (seedData.users.length > 0) {
      payload.logger.info('[SEED] === Users setup ===');

      for (const user of seedData.users) {
        const tenants = lookupTenantRole(payload, user.tenants, tenantMap);

        await ensureUser(payload, {
          description: user.description,
          email: user.email,
          name: user.name,
          password: user.password,
          role: user.role,
          tenants
        });
      }
    }

    // PAGES

    if (seedData.pages.length > 0) {
      payload.logger.info('[SEED] === Pages setup ===');

      for (const page of seedData.pages) {
        const { tenant } = lookupTenant(payload, page.tenant, tenantMap);
        await ensurePage(payload, {
          header: page.header,
          slug: page.slug,
          title: page.title,
          tenant
        });
      }
    }

    // ARTICLES

    if (seedData.articles.length > 0) {
      payload.logger.info('[SEED] === Articles setup ===');

      for (const article of seedData.articles) {
        const { tenant } = lookupTenant(payload, article.tenant, tenantMap);
        await ensureArticle(payload, {
          author: article.author,
          slug: article.slug,
          title: article.title,
          tenant
        });
      }
    }

    payload.logger.info('[SEED] Seed completed');
  } catch (error) {
    console.error(error);
    payload.logger.error('[SEED] Something broke :(');
  }
};
