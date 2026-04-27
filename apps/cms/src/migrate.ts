import { type Migration, getPayload } from 'payload';

import { migrations } from './migrations';
import config from './payload.config';

// Invoked via Fly release_command before machines are updated.
// Passes migrations directly so no filesystem read is required in the standalone build.
if (process.env.TENANT_ID) {
  console.log('[migrate] Tenant mode - migrations are managed by the host app');
  process.exit(0);
}

const payload = await getPayload({ config, disableOnInit: true });

try {
  await payload.db.migrate({ migrations: migrations as Migration[] });
  process.exit(0);
} catch (error) {
  console.error('[migrate] Failed:', error);
  process.exit(1);
}
