import { getRepositoryDefaultBranch } from '@codeware/core/actions';
import { arrayToRecord } from '@codeware/core/utils';

import type { ActionInputs } from '../schemas/action-inputs.schema';
import {
  type BuildConfig,
  BuildConfigSchema
} from '../schemas/build-config.schema';

/**
 * Get build configuration from action inputs.
 *
 * Default values are applied for optional inputs
 * and the configuration is validated by schema.
 *
 * @param inputs Action inputs
 * @returns Build configuration
 * @throws If configuration is invalid
 */
export const getBuildConfig = async (
  inputs: ActionInputs
): Promise<BuildConfig> => {
  const {
    buildArgs: buildArgsInput,
    flyApiToken,
    flyOrg,
    flyTraceCli,
    flyConsoleLogs,
    mainBranch: mainBranchInput,
    optOutDepotBuilder,
    apps,
    appDetails,
    token
  } = inputs;

  const mainBranch =
    mainBranchInput || (await getRepositoryDefaultBranch(token));

  const buildArgs = arrayToRecord(buildArgsInput ?? []);

  const config: BuildConfig = {
    buildArgs,
    fly: {
      token: flyApiToken || process.env['FLY_API_TOKEN'] || '',
      org: flyOrg || '',
      traceCLI: flyTraceCli ?? false,
      consoleLogs: flyConsoleLogs ?? false,
      optOutDepotBuilder: optOutDepotBuilder ?? false
    },
    mainBranch,
    apps,
    appDetails: appDetails ?? {},
    token
  };
  return BuildConfigSchema.parse(config);
};
