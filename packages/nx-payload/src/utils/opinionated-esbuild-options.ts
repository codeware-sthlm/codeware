import type { EsBuildExecutorOptions } from '@nx/esbuild/src/executors/esbuild/schema';

/**
 * Opinionated esbuild options for the build executor.
 *
 * All target options can be overridden by the user.
 *
 * However, we have to set some defaults to get the desired build output
 * and to be compatible with our Docker deployment setup.
 *
 * - https://nx.dev/nx-api/esbuild/executors/esbuild
 * - https://nx.dev/nx-api/js/executors/node
 * - https://esbuild.github.io/getting-started/
 */
export const opinionatedEsbuildOptions: Pick<
  EsBuildExecutorOptions,
  | 'assets'
  | 'bundle'
  | 'deleteOutputPath'
  | 'esbuildOptions'
  | 'format'
  | 'generatePackageJson'
  | 'outputFileName'
  | 'outputHashing'
  | 'platform'
  | 'target'
  | 'watch'
> = {
  // Default assets
  assets: ['{projectRoot}/src/assets'],

  // Do not create a single file bundle
  bundle: false,

  // Start clean
  deleteOutputPath: true,

  // Payload code runs both in node and browser and v2 doesn't support `esm`
  format: ['cjs'],

  // Recommended when running the app in a container
  generatePackageJson: true,

  // Defaults to the name of `main` option but we want it in `server` folder.
  // This option value is used by `@nx/js:node` executor to serve the app.
  // Must be in sync with `esbuildOptions.outdir`.
  outputFileName: 'server/main.js',

  // Hashing files is not needed and will also break payload build
  outputHashing: 'none',

  // Nx will generate a file structure similar to the default payload workspace,
  // which will also resolve all path mappings correctly.
  platform: 'node',

  // Build modern apps
  target: 'esnext',

  // Delegate watch mode to the `@nx/js:node` executor
  watch: false,

  // Custom esbuild options
  esbuildOptions: {
    // We want the node app in `server` at the same level as the payload admin in `build`
    // and let the clean option delete both folders. Assumes outputPath use projectRoot structure.
    // It will make a good separation between server and client build outputs.
    // Must be in sync with `outputFileName`.
    outdir: '{workspaceRoot}/dist/{projectRoot}/server',

    // When using `cjs` format we must set extension to get `.js` files
    outExtension: {
      '.js': '.js'
    }
  }
};
