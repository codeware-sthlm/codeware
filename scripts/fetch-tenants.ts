#!/usr/bin/env tsx

/**
 * Fetch tenant IDs from Infisical
 * 
 * This script connects to Infisical and retrieves all tenant IDs
 * from the /web/tenants path structure.
 * 
 * Outputs tenant IDs as newline-separated values to stdout.
 * Logs and errors are written to stderr.
 */

// @ts-ignore - Module resolution handled by tsx at runtime
import { withInfisical } from '@codeware/shared/feature/infisical';

async function main() {
  try {
    console.error('[fetch-tenants] Connecting to Infisical...');

    // Fetch all secrets from /web/tenants/* paths recursively
    const secrets = await withInfisical({
      environment: process.env.DEPLOY_ENV || 'production',
      filter: { path: '/web/tenants', recurse: true },
      silent: false,
      site: 'eu'
    });

    if (!secrets || secrets.length === 0) {
      console.error('[fetch-tenants] No tenants found in Infisical');
      process.exit(0);
    }

    // Extract unique tenant IDs from secret paths
    // Path format: /web/tenants/<tenant-id>
    const tenantIds = new Set<string>();

    for (const secret of secrets) {
      const { secretPath } = secret;
      if (!secretPath) continue;

      const match = secretPath.match(/^\/web\/tenants\/([^/]+)$/);
      if (match && match[1]) {
        tenantIds.add(match[1]);
      }
    }

    const tenants = Array.from(tenantIds).sort();

    console.error(`[fetch-tenants] Found ${tenants.length} tenant(s): ${tenants.join(', ')}`);

    // Output tenant IDs to stdout (one per line)
    for (const tenantId of tenants) {
      console.log(tenantId);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('[fetch-tenants] Error:', error.message);
      // @ts-ignore - Error.cause is available in Node 16+
      if (error.cause) {
        // @ts-ignore
        console.error('[fetch-tenants] Cause:', error.cause);
      }
    } else {
      console.error('[fetch-tenants] Unknown error:', error);
    }
    process.exit(1);
  }
}

main();
