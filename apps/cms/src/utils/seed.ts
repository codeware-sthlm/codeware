import { seed } from '@codeware/app-cms/feature/seed';
import payload from 'payload';

import { resolveEnv } from '../env-resolver/server.resolve';

/**
 * Ad-hoc run the seed process using the local-api only.
 *
 * This is used for seeding the database without spinning up the entire server.
 */
const doSeed = async (): Promise<void> => {
  const env = await resolveEnv();

  if (env.DEPLOY_ENV === 'production') {
    console.error(
      'Error: Ad-hoc seed process is not allowed in production environment!'
    );
    process.exit(0);
  }

  await payload.init({
    secret: env.PAYLOAD_SECRET_KEY,
    // Enables local mode, doesn't spin up a server or frontend
    local: true
  });

  await payload.db.migrate();

  const status = await seed({
    environment: env.DEPLOY_ENV,
    payload,
    source: env.SEED_SOURCE
  });

  process.exit(status ? 0 : 1);
};

doSeed();
