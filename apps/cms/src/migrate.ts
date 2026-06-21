import { type Migration, getPayload } from 'payload';

import { withInfisical } from '@codeware/shared/feature/infisical';

import { getConfig } from './migrate.config';
import { migrations } from './migrations';

// Invoked via Fly release_command before machines are updated.
// Passes migrations directly so no filesystem read is required in the standalone build.
if (process.env.TENANT_ID) {
  console.log('[migrate] Tenant mode - migrations are managed by the host app');
  process.exit(0);
}

console.log('[migrate] Running migrations for cms host...');

try {
  // DATABASE_URL is env-specific and loaded from Infisical at runtime by the app.
  // The release machine has the Infisical credentials as Fly secrets, so load them
  // here if DATABASE_URL isn't already set as a native Fly secret.
  if (!process.env.DATABASE_URL) {
    if (!process.env.DEPLOY_ENV) {
      throw new Error(
        'DEPLOY_ENV is not set — cannot load secrets from Infisical'
      );
    }
    const secrets = await withInfisical({
      environment: process.env['DEPLOY_ENV'],
      filter: { path: '/apps/cms', recurse: true }
    });

    // Only database url is needed
    const databaseUrl = secrets.find(
      (s) => s.secretKey === 'DATABASE_URL'
    )?.secretValue;
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL not available after loading from Infisical'
      );
    }
    process.env.DATABASE_URL = databaseUrl;
  }

  // Build a minimal Payload instance with the same DB config as the main app,
  // and run the migrations directly against the database.
  // getConfig() is called here (not at import time) so DATABASE_URL is already set.
  const payload = await getPayload({
    config: getConfig(),
    disableOnInit: true
  });
  await payload.db.migrate({ migrations: migrations as Migration[] });
  process.exit(0);
} catch (error) {
  console.error('[migrate] Failed:', error);
  process.exit(1);
}
