import * as core from '@actions/core';
import { getRepositoryDefaultBranch } from '@codeware/core/actions';

import type { ActionInputs } from '../schemas/action-inputs.schema';
import {
  type DeploymentConfig,
  DeploymentConfigSchema
} from '../schemas/deployment-config.schema';

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
    flyApiToken,
    flyOrg,
    flyRegion,
    mainBranch: mainBranchInput,
    token
  } = inputs;

  // Check main branch; if not provided, get default branch
  const mainBranch =
    mainBranchInput || (await getRepositoryDefaultBranch(token));

  const config: DeploymentConfig = {
    fly: {
      token: flyApiToken || process.env['FLY_API_TOKEN'] || '',
      org: flyOrg,
      region: flyRegion
    },
    mainBranch,
    token
  };
  core.info(JSON.stringify(config, null, 2));

  // Validate and return deployment configuration
  return DeploymentConfigSchema.parse(config);
};
