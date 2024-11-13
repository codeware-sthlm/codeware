import * as devkit from '@nx/devkit';
import * as tscExecutor from '@nx/js/src/executors/tsc/tsc.impl';
import * as runCommandsImpl from 'nx/src/executors/run-commands/run-commands.impl';

import { buildExecutor } from './build';
import {
  type NormalizedSchema,
  normalizeOptions
} from './libs/normalize-options';
import type { BuildExecutorSchema } from './schema';

jest.mock('@nx/devkit');
jest.mock('nx/src/executors/run-commands/run-commands.impl');
jest.mock('@nx/js/src/executors/tsc/tsc.impl');

describe('Build Executor', () => {
  let context: devkit.ExecutorContext;

  const loggerErrorMock = jest.spyOn(devkit.logger, 'error');
  const runCommandsImplMock = jest.spyOn(runCommandsImpl, 'default');
  const tscExecutorMock = jest.spyOn(tscExecutor, 'default');

  let testOptions: BuildExecutorSchema;
  let callOrder: Array<'runCommandsImpl' | 'tscExecutor'> = [];

  beforeEach(async () => {
    callOrder = [];
    jest.clearAllMocks();

    runCommandsImplMock.mockImplementation(async () => {
      callOrder.push('runCommandsImpl');
      return Promise.resolve({
        success: true,
        terminalOutput: ''
      });
    });
    tscExecutorMock.mockImplementation(async function* () {
      callOrder.push('tscExecutor');
      yield { success: true, outfile: '' };
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

    testOptions = {
      main: 'apps/testapp/src/main.ts',
      outputPath: 'dist/apps/testapp',
      outputFileName: 'src/main.js',
      tsConfig: 'apps/testapp/tsconfig.app.json',
      assets: [],
      watch: false,
      transformers: []
    };
  });

  describe('normalizeOptions', () => {
    it('should normalize options for valid config', () => {
      const options = normalizeOptions(testOptions, context);

      expect(options).toEqual<NormalizedSchema>({
        projectRoot: 'apps/testapp',
        sourceRoot: 'apps/testapp/src',
        outputPath: 'dist/apps/testapp',
        outputFileName: 'src/main.js',
        main: 'apps/testapp/src/main.ts',
        tsConfig: 'apps/testapp/tsconfig.app.json',
        assets: [],
        updateBuildableProjectDepsInPackageJson: true,
        buildableProjectDepsInPackageJsonType: 'dependencies',
        transformers: [],
        watch: false,
        clean: true
      });
    });

    it('should set assets to assets folder when undefined or missing', () => {
      testOptions.assets = undefined;
      expect(normalizeOptions(testOptions, context)).toMatchObject({
        assets: ['apps/testapp/src/assets']
      });

      delete testOptions.assets;
      expect(normalizeOptions(testOptions, context)).toMatchObject({
        assets: ['apps/testapp/src/assets']
      });
    });

    it('should keep assets for empty array', () => {
      testOptions.assets = [];
      expect(normalizeOptions(testOptions, context)).toMatchObject({
        assets: []
      });
    });

    it('should default clean to true', () => {
      delete testOptions.clean;
      expect(normalizeOptions(testOptions, context)).toMatchObject({
        clean: true
      });
    });

    it('should not be able to override watch false', () => {
      testOptions.watch = true;
      expect(normalizeOptions(testOptions, context)).toMatchObject({
        watch: false
      });

      delete testOptions.watch;
      expect(normalizeOptions(testOptions, context)).toMatchObject({
        watch: false
      });
    });

    it('should throw when projectName is missing', () => {
      delete context.projectName;
      expect(() => normalizeOptions(testOptions, context)).toThrow();
    });

    it('should throw when project configuration is missing', () => {
      delete context.projectsConfigurations?.projects.testapp;
      expect(() => normalizeOptions(testOptions, context)).toThrow();
    });

    it('should throw when project root is missing', () => {
      delete context.projectsConfigurations?.projects.testapp.root;
      expect(() => normalizeOptions(testOptions, context)).toThrow();
    });

    it('should throw when sourceRoot is missing', () => {
      delete context.projectsConfigurations?.projects.testapp.sourceRoot;
      expect(() => normalizeOptions(testOptions, context)).toThrow();
    });
  });

  describe('buildExecutor', () => {
    it('should build project', async () => {
      const result = await buildExecutor(testOptions, context);

      expect(loggerErrorMock).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should build app before payload', async () => {
      await buildExecutor(testOptions, context);

      expect(callOrder).toEqual(['tscExecutor', 'runCommandsImpl']);
    });

    it('should build app with arguments', async () => {
      await buildExecutor(testOptions, context);

      expect(tscExecutorMock).toHaveBeenCalledWith(
        {
          ...testOptions,
          projectRoot: 'apps/testapp',
          sourceRoot: 'apps/testapp/src',
          buildableProjectDepsInPackageJsonType: 'dependencies',
          clean: true,
          updateBuildableProjectDepsInPackageJson: true
        } satisfies NormalizedSchema,
        context
      );
    });

    it('should build payload with arguments', async () => {
      await buildExecutor(testOptions, context);

      expect(runCommandsImplMock).toHaveBeenCalledWith(
        expect.objectContaining({
          commands: ['npx payload build'],
          parallel: false,
          env: {
            PAYLOAD_CONFIG_PATH: 'apps/testapp/src/payload.config.ts'
          }
        }),
        context
      );
    });

    it('should return failure when app build fails', async () => {
      runCommandsImplMock.mockResolvedValue({
        success: false,
        terminalOutput: 'build failed'
      });
      const result = await buildExecutor(testOptions, context);

      expect(loggerErrorMock).toHaveBeenCalledWith('build failed');
      expect(result).toEqual({ success: false });
    });

    it('should return failure when payload build fails', async () => {
      runCommandsImplMock.mockResolvedValue({
        success: false,
        terminalOutput: 'build failed'
      });
      const result = await buildExecutor(testOptions, context);

      expect(loggerErrorMock).toHaveBeenCalledWith('build failed');
      expect(result).toEqual({ success: false });
    });
  });
});
