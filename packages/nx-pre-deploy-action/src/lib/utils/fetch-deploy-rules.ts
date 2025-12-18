import * as core from '@actions/core';
import { withInfisical } from '@codeware/shared/feature/infisical';

import type { InfisicalConfig } from '../schemas/config.schema';
import {
  type DeployRules,
  DeployRulesSchema
} from '../schemas/deploy-rules.schema';

/**
 * Fetch deployment rules from Infisical.
 *
 * Looks for a `DEPLOY_RULES` secret in the root path for the current environment.
 * Rules can be specified in two ways:
 *
 * #### Option 1: Metadata (preferred)
 * Add metadata to the secret with `apps` and `tenants` keys.
 * Native metadata support in Infisical UI, but only visible in secret details.
 *
 * #### Option 2: JSON secret value (fallback)
 * Store rules as JSON in the secret value: `{"apps": "web,cms", "tenants": "demo"}`.
 * Useful if you prefer editing JSON directly or want to see rules in the secret list.
 *
 * Both approaches are environment-specific - Infisical returns the secret for the current environment.
 * If metadata contains `apps` or `tenants` keys, it takes precedence over the JSON value.
 *
 * Either way, the rules must be valid otherwise an error is thrown.
 *
 * Rules format:
 * - `apps: '*'` = all apps
 * - `apps: 'web,cms'` = only web and cms apps
 * - `tenants: '*'` = all discovered tenants (multi-tenant deployment)
 * - `tenants: 'demo'` = only demo tenant
 * - `tenants: 'demo,acme'` = only demo and acme tenants
 *
 * @param config - Infisical configuration with environment
 * @returns Deploy rules
 * @throws Error if DEPLOY_RULES is missing or invalid
 */
export async function fetchDeployRules({
  environment,
  clientId,
  clientSecret,
  projectId,
  site
}: InfisicalConfig): Promise<DeployRules> {
  try {
    const secrets = await withInfisical({
      clientId,
      clientSecret,
      projectId,
      site,
      environment,
      filter: {
        path: '/',
        recurse: false
      }
    });

    if (!secrets || secrets.length === 0) {
      throw new Error(
        'No secrets found in root path. DEPLOY_RULES is required for deployment.'
      );
    }

    const deployRulesSecret = secrets.find(
      (s) => s.secretKey === 'DEPLOY_RULES'
    );

    if (!deployRulesSecret) {
      throw new Error(
        'DEPLOY_RULES secret not found in root path. This secret is required to control deployment scope.'
      );
    }

    // Parse metadata first
    const metadata = deployRulesSecret.secretMetadata.reduce(
      (acc, meta) => ({ ...acc, ...meta }),
      {} as Record<string, unknown>
    );

    if (metadata && metadata['apps'] && metadata['tenants']) {
      const rules = DeployRulesSchema.parse({
        apps: metadata['apps'],
        tenants: metadata['tenants']
      });

      core.info(
        `[fetch-deploy-rules] Found rules in metadata: apps=${rules.apps}, tenants=${rules.tenants}`
      );
      return rules;
    }

    // Fallback: try to parse secret value as JSON
    try {
      const parsed = JSON.parse(deployRulesSecret.secretValue);
      const rules = DeployRulesSchema.parse(parsed);

      core.info(
        `[fetch-deploy-rules] Found rules in value: apps=${rules.apps}, tenants=${rules.tenants}`
      );
      return rules;
    } catch (parseError) {
      throw new Error(
        `DEPLOY_RULES format is invalid. Must have metadata with 'apps' and 'tenants' keys, or be valid JSON. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }
  } catch (error) {
    // Re-throw our own errors
    if (error instanceof Error && error.message.includes('DEPLOY_RULES')) {
      throw error;
    }

    // Wrap unexpected errors
    throw new Error(
      `Failed to fetch DEPLOY_RULES: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
