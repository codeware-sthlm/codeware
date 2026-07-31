import { randomUUID } from 'crypto';

import { loadEnv } from '@codeware/app-cms/feature/env-loader';
import { getPayload } from 'payload';

import config from '../payload.config';

/**
 * Rotate a tenant's Payload API key using the local-api.
 *
 * The `apiKey` field is write-protected for REST, GraphQL and the admin UI
 * (`update: () => false`), which the local-api bypasses with `overrideAccess`.
 * That is why rotation runs as a script rather than from the admin panel.
 *
 * Driven by env vars so the caller controls which database is targeted:
 * - `ROTATE_TENANT_SLUG` - tenant to rotate (required)
 * - `DATABASE_URL` - target database (defaults to the resolved environment)
 *
 * The new key is written to stdout as `ROTATED_API_KEY=<key>` for the caller to
 * mirror into Infisical. Nothing else prints it.
 */
async function rotate() {
  const slug = process.env['ROTATE_TENANT_SLUG'];

  if (!slug) {
    console.error('Error: ROTATE_TENANT_SLUG is required');
    process.exit(1);
  }

  const env = await loadEnv();

  if (!env) {
    console.error('Environment variables could not be loaded, abort');
    process.exit(1);
  }

  console.log(`[DB] Using schema '${env.DATABASE_SCHEMA}'`);

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    overrideAccess: true,
    depth: 0,
    limit: 1
  });

  const tenant = docs[0];

  if (!tenant) {
    console.error(`Error: No tenant found with slug '${slug}'`);
    process.exit(1);
  }

  const apiKey = randomUUID();

  await payload.update({
    collection: 'tenants',
    id: tenant.id,
    data: { apiKey, enableAPIKey: true },
    overrideAccess: true
  });

  console.log(`[ROTATE] Tenant '${slug}' (id: ${tenant.id}) updated`);
  console.log(`ROTATED_API_KEY=${apiKey}`);

  process.exit(0);
}

rotate();
