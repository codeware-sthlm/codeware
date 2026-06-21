import { type Migration, getPayload } from 'payload';

import { withInfisical } from '@codeware/shared/feature/infisical';

import config from './migrate.config';
import { migrations } from './migrations';

// Invoked via Fly release_command before machines are updated.
// Passes migrations directly so no filesystem read is required in the standalone build.
if (process.env.TENANT_ID) {
  console.log('[migrate] Tenant mode - migrations are managed by the host app');
  process.exit(0);
}

console.log('[migrate] Running migrations for cms host...');

// DATABASE_URL is env-specific and loaded from Infisical at runtime by the app.
// The release machine has the Infisical credentials as Fly secrets, so load them
// here if DATABASE_URL isn't already set as a native Fly secret.
if (!process.env.DATABASE_URL) {
  await withInfisical({
    environment: process.env['DEPLOY_ENV'],
    filter: { path: '/apps/cms', recurse: true },
    injectEnv: true
  });
}

const payload = await getPayload({ config, disableOnInit: true });

try {
  await payload.db.migrate({ migrations: migrations as Migration[] });
  process.exit(0);
} catch (error) {
  console.error('[migrate] Failed:', error);
  process.exit(1);
}
