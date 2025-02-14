import type { Tree } from '@nx/devkit';
import { addOverrideToLintConfig } from '@nx/eslint/src/generators/utils/eslint-file';

import type { NormalizedSchema } from './normalize-options';

/**
 * Update `eslint.config.mjs` to ignore Nx module boundaries rule
 * for `src/app/(payload)` folder.
 *
 * Otherwise there will be lint errors for path alias `@payload-config`
 * since it points to a file within the project itself.
 */
export function updateEslintConfig(
  host: Tree,
  options: NormalizedSchema
): void {
  if (options.linter === 'none') {
    return;
  }

  addOverrideToLintConfig(
    host,
    options.directory,
    {
      files: ['src/app/(payload)/**/*'],
      rules: {
        '@nx/enforce-module-boundaries': 'off'
      }
    },
    { insertAtTheEnd: true }
  );
}
