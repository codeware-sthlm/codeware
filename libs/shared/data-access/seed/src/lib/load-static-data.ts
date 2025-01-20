import { DeepRequired, Prettify } from '@codeware/shared/util/payload';
import { seed } from '@ngneat/falso';
import { Payload } from 'payload';

import type {
  SeedData,
  SeedEnvironment,
  StaticSeedOptions
} from './seed-types';
import { generateArticles } from './utils/generate-articles';
import { generatePages } from './utils/generate-pages';
import { generateTenants } from './utils/generate-tenants';
import { generateUsers } from './utils/generate-users';
import { manageSeedData } from './utils/manage-seed-data';

/**
 * Default seed rules defines the amount of data to generate
 * when some of the options are not provided.
 */
export const defaultSeedRules: Prettify<
  DeepRequired<NonNullable<StaticSeedOptions['seedRules']>>
> = {
  tenants: { min: 2, max: 3 },
  systemUsers: { min: 2, max: 3 },
  tenantUsers: {
    roleAdmin: { min: 1, max: 2 },
    roleUser: { min: 1, max: 5 }
  },
  tenantArticles: { min: 5, max: 10 },
  tenantPages: { min: 3, max: 5 }
} as const;

/**
 * Static seeded data for non-production environments.
 *
 * The same seed data can be generated by setting the same value for `constantSeedKey` option.
 * Otherwise the data will be generated randomly every time this function is called.
 *
 * @param environment - Current deployment environment.
 * @param options - Options for the seed data.
 * @param payload - Payload instance.
 * @returns The seeded data.
 */
export const loadStaticData = (args: {
  environment: SeedEnvironment;
  options?: StaticSeedOptions;
  payload: Payload;
}): SeedData => {
  const { environment, options = {}, payload } = args;
  const { constantSeedKey, seedRules = {} } = options;

  const jsonData = manageSeedData.import({ environment, payload });

  if (jsonData) {
    payload.logger.info(
      `[SEED] Loaded ${environment} seed data from file, skip generate`
    );
    return jsonData;
  }

  if (constantSeedKey !== null) {
    const seedKey = constantSeedKey ?? environment;
    payload.logger.info(`[SEED] Seeding constant data using key '${seedKey}'`);
    seed(seedKey);
  } else {
    payload.logger.info(`[SEED] Seeding random data`);
    seed();
  }

  // Generate tenants
  const tenants = generateTenants(
    seedRules.tenants ?? defaultSeedRules.tenants
  );

  // Generate users
  const users = generateUsers({
    systemUsersRange: seedRules.systemUsers ?? defaultSeedRules.systemUsers,
    tenantUsersRange: seedRules.tenantUsers ?? defaultSeedRules.tenantUsers,
    tenants
  });
  // Append opinionated system user with known details
  users.push({
    name: 'System User',
    description: 'Access to manage the system',
    email: 'system@local.dev',
    password: '',
    role: 'system-user',
    tenants: []
  });

  // Generate pages
  const pages = generatePages(
    seedRules.tenantPages ?? defaultSeedRules.tenantPages,
    tenants
  );
  // Append opinionated home page to each tenant
  tenants.forEach((tenant) => {
    pages.push({
      title: 'Home',
      slug: 'home',
      header: `Welcome to ${tenant.name}`,
      tenant: { lookupApiKey: tenant.apiKey }
    });
  });

  // Generate articles
  const articles = generateArticles(
    seedRules.tenantArticles ?? defaultSeedRules.tenantArticles,
    tenants
  );

  // Combine all data to the final seed object
  const seedData: SeedData = {
    articles,
    pages,
    tenants,
    users
  };

  // Write seed data to file to be re-used next time.
  // It will prevent us from generating random data every time.
  manageSeedData.save({ environment, payload, seedData });

  return seedData;
};
