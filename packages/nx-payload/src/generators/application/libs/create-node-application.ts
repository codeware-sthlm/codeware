import type { Tree } from '@nx/devkit';
import { applicationGenerator } from '@nx/node';

import type { NormalizedSchema } from './normalize-options';

export async function createNodeApplication(
  host: Tree,
  options: NormalizedSchema
) {
  return await applicationGenerator(host, {
    ...options,
    skipFormat: true
  });
}
