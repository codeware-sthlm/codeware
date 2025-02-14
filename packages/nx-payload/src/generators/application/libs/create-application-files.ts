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

  const rootDir = options.directory;
  const srcDir = `${rootDir}/src`;

  // Remove all files in `spec` folder
  host.children(`${rootDir}/specs`).forEach((child) => {
    host.delete(`${rootDir}/specs/${child}`);
  });

  // Remove all files in `src/app` folder
  host.children(`${srcDir}/app`).forEach((child) => {
    host.delete(`${srcDir}/app/${child}`);
  });

  // Remove eslint config js file since it's replaced with ESM config
  if (host.exists(`${rootDir}/eslint.config.js`)) {
    host.delete(`${rootDir}/eslint.config.js`);
  }

  // Remove next config js file since Payload requires ESM config
  if (host.exists(`${rootDir}/next.config.js`)) {
    host.delete(`${rootDir}/next.config.js`);
  }

  generateFiles(
    host,
    join(__dirname, '../files'),
    options.directory,
    templateVariables
  );
}
