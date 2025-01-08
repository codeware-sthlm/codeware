import * as devkit from '@nx/devkit';
import * as esbuildExecutor from '@nx/esbuild/src/executors/esbuild/esbuild.impl';

import { opinionatedEsbuildOptions } from '../../utils/opinionated-esbuild-options';

import { BuildResult, buildExecutor } from './build';
import { normalizeOptions } from './libs/normalize-options';
import type { NormalizedSchema } from './libs/normalize-options';
import type { BuildExecutorSchema } from './schema';

jest.mock('@nx/devkit');
jest.mock('nx/src/executors/run-commands/run-commands.impl');
jest.mock('@nx/esbuild/src/executors/esbuild/esbuild.impl');

describe('Build Executor', () => {
  let context: devkit.ExecutorContext;

  const mockLoggerError = jest.spyOn(devkit.logger, 'error');
  const mockRunExecutor = jest.spyOn(devkit, 'runExecutor');
  const mockEsbuildExecutor = jest.spyOn(esbuildExecutor, 'default');

  let requiredOptions: BuildExecutorSchema;
  let callOrder: Array<'buildPayload' | 'buildServer'> = [];

  /**
   * Replace {projectRoot} and {workspaceRoot} with actual values
   * to make the test compatible with the context
   */
  const mappedOpinionatedEsbuildOptions = Object.keys(
    opinionatedEsbuildOptions
  ).reduce((acc, key) => {
    const value = opinionatedEsbuildOptions[key];

    const replacer = (value: string) =>
      typeof value === 'string'
        ? value
            .replace('{projectRoot}', 'apps/testapp')
            .replace('{workspaceRoot}', '/root')
        : value;

    let mappedValue = value;
    if (Array.isArray(value)) {
      mappedValue = value.map((v) => replacer(v));
    } else if (typeof value === 'object') {
      mappedValue = Object.keys(value).reduce((acc, k) => {
        acc[k] = replacer(value[k]);
        return acc;
      }, {});
    } else if (typeof value === 'string') {
      mappedValue = replacer(value);
    }

    return {
      ...acc,
      [key]: mappedValue
    };
  }, {});

  beforeEach(async () => {
    callOrder = [];
    jest.clearAllMocks();

    mockRunExecutor.mockImplementation(() =>
      Promise.resolve(
        (async function* () {
          callOrder.push('buildPayload');
          yield { success: true };
        })()
      )
    );

    mockEsbuildExecutor.mockImplementation(async function* () {
      callOrder.push('buildServer');
      yield { success: true, outfile: 'path/to/main.js' };
    });

    context = {
      root: '/root',
      cwd: '/root',
      projectsConfigurations: {
        version: 2,

        projects: {
          testapp: {
            root: 'apps/testapp',
            sourceRoot: 'apps/testapp/src'
          }
        }
      },
      projectGraph: { dependencies: {}, nodes: {} },
      nxJsonConfiguration: {},
      isVerbose: false,
      projectName: 'testapp',
      targetName: 'build'
    };

    requiredOptions = {
      main: 'apps/testapp/src/main.ts',
      outputPath: 'dist/apps/testapp',
      tsConfig: 'apps/testapp/tsconfig.app.json'
    };
  });

  describe('normalizeOptions', () => {
    it('should verify required options', () => {
      const options = normalizeOptions(requiredOptions, context);
      expect(options).toEqual<NormalizedSchema>({
        projectRoot: 'apps/testapp',
        sourceRoot: 'apps/testapp/src',
        main: 'apps/testapp/src/main.ts',
        outputPath: 'dist/apps/testapp',
        tsConfig: 'apps/testapp/tsconfig.app.json'
      });
    });

    it('should verify with opinionated options', () => {
      // Note! This a constructed test to proxy validate opinionated options
      // by passing into normalizeOptions function. It's not a real use-case.
      const options = normalizeOptions(
        {
          ...requiredOptions,
          ...mappedOpinionatedEsbuildOptions
        },
        context
      );

      expect(options).toEqual<NormalizedSchema>({
        projectRoot: 'apps/testapp',
        sourceRoot: 'apps/testapp/src',
        main: 'apps/testapp/src/main.ts',
        outputPath: 'dist/apps/testapp',
        tsConfig: 'apps/testapp/tsconfig.app.json',
        // Opinionated values
        assets: ['apps/testapp/src/assets'],
        bundle: false,
        deleteOutputPath: true,
        esbuildOptions: {
          outdir: '/root/dist/apps/testapp/server',
          outExtension: { '.js': '.js' }
        },
        format: ['cjs'],
        generatePackageJson: true,
        outputHashing: 'none',
        outputFileName: 'server/main.js',
        platform: 'node',
        target: 'esnext',
        watch: false
      });
    });

    it('should override with custom options', () => {
      const options = normalizeOptions(
        {
          ...requiredOptions,
          additionalEntryPoints: ['foo/bar'],
          assets: ['foo/bar/assets'],
          bundle: true,
          clean: false,
          format: ['cjs'],
          generatePackageJson: false,
          metafile: true,
          minify: true,
          outputFileName: 'foo/bar/main.js',
          outputHashing: 'all',
          platform: 'browser',
          skipTypeCheck: true,
          sourcemap: true,
          target: 'es2020',
          watch: true,
          esbuildOptions: {
            outdir: 'foo/bar/server'
          }
        },
        context
      );
      expect(options).toMatchObject({
        ...requiredOptions,
        assets: ['foo/bar/assets'],
        bundle: true,
        clean: false,
        format: ['cjs'],
        generatePackageJson: false,
        metafile: true,
        minify: true,
        outputFileName: 'foo/bar/main.js',
        outputHashing: 'all',
        platform: 'browser',
        skipTypeCheck: true,
        sourcemap: true,
        target: 'es2020',
        watch: true,
        esbuildOptions: {
          outdir: 'foo/bar/server'
        }
      });
    });

    it('should throw when projectName is missing', () => {
      delete context.projectName;
      expect(() => normalizeOptions(requiredOptions, context)).toThrow();
    });

    it('should throw when project configuration is missing', () => {
      delete context.projectsConfigurations?.projects.testapp;
      expect(() => normalizeOptions(requiredOptions, context)).toThrow();
    });

    it('should throw when project root is missing', () => {
      delete context.projectsConfigurations?.projects.testapp.root;
      expect(() => normalizeOptions(requiredOptions, context)).toThrow();
    });

    it('should throw when sourceRoot is missing', () => {
      delete context.projectsConfigurations?.projects.testapp.sourceRoot;
      expect(() => normalizeOptions(requiredOptions, context)).toThrow();
    });
  });

  describe('buildExecutor', () => {
    const runBuildExecutor = async () => {
      let result = {} as BuildResult;
      for await (const s of buildExecutor(requiredOptions, context)) {
        result = s;
      }
      return result;
    };

    it('should build project', async () => {
      const result = await runBuildExecutor();
      expect(mockLoggerError).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, outfile: 'path/to/main.js' });
    });

    it('should yield a single result after server and payload builds', async () => {
      const results: Array<BuildResult> = [];
      const output = buildExecutor(requiredOptions, context);
      while (true) {
        const event = await output.next();
        if (event.done) {
          break;
        }
        results.push(await event.value);
      }
      expect(results).toEqual([{ success: true, outfile: 'path/to/main.js' }]);
    });

    it('should build server before payload', async () => {
      await runBuildExecutor();
      expect(callOrder).toEqual(['buildServer', 'buildPayload']);
    });

    it('should build server with required options and project roots', async () => {
      await runBuildExecutor();
      expect(mockEsbuildExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          ...requiredOptions,
          projectRoot: 'apps/testapp',
          sourceRoot: 'apps/testapp/src'
        }),
        context
      );
    });

    it('should build payload with arguments', async () => {
      await runBuildExecutor();
      expect(mockRunExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          target: 'payload',
          project: 'testapp'
        }),
        { command: 'npx payload build' },
        context
      );
    });

    it('should return failure when server build fails', async () => {
      mockEsbuildExecutor.mockImplementation(async function* () {
        yield { success: false };
      });
      const result = await runBuildExecutor();
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Failed to build server for project 'testapp'`
      );
      expect(result).toEqual({ success: false });
    });

    it('should return failure when payload build fails', async () => {
      mockRunExecutor.mockImplementation(() =>
        Promise.resolve(
          (async function* () {
            yield { success: false };
          })()
        )
      );
      const result = await runBuildExecutor();
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Failed to build payload admin ui for project 'testapp'`
      );
      expect(result).toEqual({ success: false });
    });
  });
});
