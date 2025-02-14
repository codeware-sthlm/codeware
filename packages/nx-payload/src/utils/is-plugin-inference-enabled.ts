import { readNxJson } from '@nx/devkit';

export const isPluginInferenceEnabled = (
  nxJson: ReturnType<typeof readNxJson>
): boolean => {
  if (
    process.env.NX_ADD_PLUGINS === 'false' ||
    nxJson?.useInferencePlugins === false
  ) {
    return false;
  }

  return true;
};
