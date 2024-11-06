import { join } from 'path';

import { type Tree, generateFiles, names } from '@nx/devkit';

import { type NormalizedSchema } from './normalize-options';

/**
 * Create application files from template `files` folder
 */
export function createApplicationFiles(host: Tree, options: NormalizedSchema) {
  const templateVariables = {
    ...names(options.name),
    ...options,
    tmpl: ''
  };

  host.delete(`${options.name}/src/main.ts`);

  generateFiles(
    host,
    join(__dirname, '../files'),
    options.directory,
    templateVariables
  );
}
