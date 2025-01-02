import fs from 'fs';
import { dirname, resolve } from 'path';

import env from '../env-resolver/resolved-env';

/**
 * Resolve tsconfig paths to Webpack aliases to support
 * workspace path mappings.
 *
 * @param tsConfigPath Full path to the tsconfig file that defines `compilerOptions.paths`
 * @return Payload webpack config alias object
 */
export const resolveTsconfigPathsToAlias = (
  tsConfigPath: string,
  webpackBasePath?: string
) => {
  if (!fs.existsSync(tsConfigPath)) {
    console.error(`Paths can not be resolved, file not found: ${tsConfigPath}`);
    return {};
  }

  if (!webpackBasePath) {
    // Assume tsconfig paths are relative to file location
    webpackBasePath = dirname(tsConfigPath);
  }

  const rawTsConfig = fs
    .readFileSync(tsConfigPath, 'utf-8')
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}');

  const tsConfig = JSON.parse(rawTsConfig) as {
    compilerOptions: { paths: Record<string, string[]> };
  };

  const paths = tsConfig?.compilerOptions?.paths;
  if (!paths) {
    console.error(`No paths to resolve in ${tsConfigPath}`);
    return {};
  }

  const aliases = {} as Record<string, string>;

  // Convert paths to aliases with absolute paths
  Object.keys(paths).forEach((item) => {
    const key = item.replace(/\/\*/g, '');
    const value = resolve(
      webpackBasePath,
      paths[item][0].replace(/\/\*/g, '').replace(/\*/g, '')
    );

    // Lookup the source file for the alias
    if (fs.existsSync(value)) {
      aliases[key] = value;
    } else {
      // Lookup compiled file when we're in run-time
      const compiledFile = value.replace('.ts', '.js');
      if (fs.existsSync(compiledFile)) {
        aliases[key] = compiledFile;
      }
      // Ignore files that have been tree-shaken
    }
  });

  if (env.DEPLOY_ENV === 'development' && env.LOG_LEVEL === 'debug') {
    console.log(
      `[DEBUG] Resolved aliases: ${JSON.stringify(aliases, null, 2)}`
    );
  } else {
    const count = Object.keys(aliases).length;
    console.log(`Resolved ${count} webpack aliases from ${tsConfigPath}`);
  }

  return aliases;
};
