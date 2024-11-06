import { type Tree } from '@nx/devkit';

import { type AppGeneratorSchema } from '../../application/schema';
import { type PresetGeneratorSchema } from '../schema';

/**
 * App generator properties which are opinionated by the preset.
 *
 * For full flexibility the app generator should be used, after the workspace has been created.
 */
export type NormalizedSchema = AppGeneratorSchema;

export function normalizeOptions(
  host: Tree,
  options: PresetGeneratorSchema
): NormalizedSchema {
  const {
    payloadAppName,
    payloadAppDirectory,
    name: workspaceName,
    ...appOptions
  } = options;

  // There seems to be a bug in Nx causing `appName` not to be passed down to this generator properly.
  // It's always empty, hence we must use our own custom payload prefixed properties for name (and directory for consistency).
  // There's a comment abount this in the Nx Remix preset:
  // https://github.com/nrwl/nx/blob/master/packages/remix/src/generators/preset/lib/normalize-options.ts

  if ('appName' in appOptions) {
    delete appOptions['appName'];
  }

  const name = payloadAppName || workspaceName;
  const directory = payloadAppDirectory || `apps/${name}`;

  return {
    name,
    directory,
    ...appOptions
  };
}
