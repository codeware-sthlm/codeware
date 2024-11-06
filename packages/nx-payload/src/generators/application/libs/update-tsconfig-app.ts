import { type Tree } from '@nx/devkit';
import { joinPathFragments, updateJson } from '@nx/devkit';

import type { NormalizedSchema } from './normalize-options';

/**
 * Update `tsconfig.app.ts` to exclude `generated` and `migrations` folders
 */
export function updateTsConfigApp(tree: Tree, options: NormalizedSchema): void {
  updateJson(
    tree,
    joinPathFragments(options.directory, 'tsconfig.app.json'),
    (json) => {
      json = {
        ...json,
        exclude: [...json.exclude, 'src/generated/*.ts', 'src/migrations/*.ts']
      };
      return json;
    }
  );
}
