import type { NxJsonConfiguration } from '@nx/devkit';

export const isPluginInferenceEnabled = (
  nxConfig: NxJsonConfiguration
): boolean => {
  if (
    process.env.NX_ADD_PLUGINS === 'false' ||
    nxConfig?.useInferencePlugins === false
  ) {
    return false;
  }

  return true;
};
