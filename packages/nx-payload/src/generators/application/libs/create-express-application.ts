import { type Tree } from '@nx/devkit';
import { applicationGenerator } from '@nx/express';

import { type NormalizedSchema } from './normalize-options';

export async function createExpressApplication(
  host: Tree,
  options: NormalizedSchema
) {
  // `e2eTestRunner` not found among devkit types?
  const e2e = options?.skipE2e ? { e2eTestRunner: 'none' } : {};

  const expressTask = await applicationGenerator(host, {
    ...options,
    js: false,
    skipFormat: true,
    skipPackageJson: false,
    ...e2e
  });

  return expressTask;
}
