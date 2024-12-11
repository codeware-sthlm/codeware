import * as core from '@actions/core';
import { getRepositoryDefaultBranch } from '@codeware/core/actions';

import type { ActionInputs } from '../schemas/action-inputs.schema';
import {
  type DeploymentConfig,
  DeploymentConfigSchema
} from '../schemas/deployment-config.schema';

const arrayToRecord = (
  arr: Array<string>
): Record<string, string> | undefined =>
  arr.length
    ? arr
        .map((secret) => secret.split('='))
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        )
    : undefined;

/**
 * Get deployment configuration from action inputs.
 *
 * Default values are applied for optional inputs
 * and the configuration is validated by schema.
 *
 * @param inputs Action inputs
 * @returns Deployment configuration
 * @throws If configuration is invalid
 */
export const getDeploymentConfig = async (
  inputs: ActionInputs
): Promise<DeploymentConfig> => {
  const {
    env: envInput,
    flyApiToken,
    flyOrg,
    flyRegion,
    mainBranch: mainBranchInput,
    secrets: secretsInput,
    token
  } = inputs;

  // Check main branch; if not provided, get default branch
  const mainBranch =
    mainBranchInput || (await getRepositoryDefaultBranch(token));

  // Parse environment variables from input
  const env = arrayToRecord(envInput);

  // Parse secrets from input
  const secrets = arrayToRecord(secretsInput);

  const config: DeploymentConfig = {
    env,
    fly: {
      token: flyApiToken || process.env['FLY_API_TOKEN'] || '',
      org: flyOrg,
      region: flyRegion
    },
    mainBranch,
    secrets,
    token
  };
  core.info(JSON.stringify(config, null, 2));

  // Validate and return deployment configuration
  return DeploymentConfigSchema.parse(config);
};
