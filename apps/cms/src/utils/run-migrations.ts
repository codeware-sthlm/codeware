/**
 * Minimal non-interactive migration runner.
 *
 * Runs all pending Payload migrations against whatever DATABASE_URL is set
 * in the environment. Used by the test-migration db-tool to apply migrations
 * against a Docker Postgres container loaded with a database backup.
 */
import { getPayload } from 'payload';

import { loadEnv } from '@codeware/app-cms/feature/env-loader';

import config from '../payload.config';

async function main() {
  await loadEnv();
  const payload = await getPayload({ config });
  await payload.db.migrate();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
