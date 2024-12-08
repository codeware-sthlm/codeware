import * as core from '@actions/core';
import { getRepositoryDefaultBranch } from '@codeware/core/actions';

import { EnvironmentConfigSchema } from '../schemas/environment-config.schema';

import type { ActionInputs, EnvironmentConfig } from './types';

/**
 * Get environment configuration from action inputs.
 *
 * Default values are applied for optional inputs
 * and the configuration is validated by schema.
 *
 * @param inputs Action inputs
 * @returns Environment configuration
 * @throws If configuration is invalid
 */
export const getEnvironmentConfig = async (
  inputs: ActionInputs
): Promise<EnvironmentConfig> => {
  const { mainBranch: mainBranchInput, token: tokenInput } = inputs;

  // Check token; if not provided, use GitHub token
  const token = tokenInput || (process.env['GITHUB_TOKEN'] as string);

  // Check main branch; if not provided, get default branch
  const mainBranch =
    mainBranchInput || (await getRepositoryDefaultBranch(token));

  const config: EnvironmentConfig = {
    mainBranch,
    token
  };
  core.info(JSON.stringify(config, null, 2));

  // Validate and return environment configuration
  return EnvironmentConfigSchema.parse(config);
};
