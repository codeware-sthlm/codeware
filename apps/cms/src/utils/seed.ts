import { getPayload } from 'payload';

import { loadEnv } from '@codeware/app-cms/feature/env-loader';
import { seed } from '@codeware/app-cms/feature/seed';

import config from '../payload.config';

/**
 * Ad-hoc run the seed process using the local-api only.
 *
 * This is used for seeding the database without spinning up the entire server.
 */
const doSeed = async (): Promise<void> => {
  const env = await loadEnv();

  if (!env) {
    console.warn(
      'Environment variables could not be loaded, abort seed process'
    );
    process.exit(0);
  }

  if (env.DEPLOY_ENV === 'production') {
    console.error(
      'Error: Ad-hoc seed process is not allowed in production environment!'
    );
    process.exit(0);
  }

  const payload = await getPayload({ config });

  const status = await seed({
    environment: env.DEPLOY_ENV,
    payload,
    source: env.SEED_SOURCE,
    strategy: env.SEED_STRATEGY
  });

  console.log('Seed data completed');

  process.exit(status ? 0 : 1);
};

doSeed();
