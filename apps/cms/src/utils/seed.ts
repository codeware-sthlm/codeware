import { getPayload } from 'payload';

import { loadEnv } from '@codeware/app-cms/feature/env-loader';

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

  // Seed will trigger on payload init
  await getPayload({ config });

  process.exit(0);
};

doSeed();
