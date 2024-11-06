import type { ExecutorContext } from '@nx/devkit';

import {
  type NormalizedSchema,
  normalizeOptions
} from './libs/normalize-options';
import type { BuildExecutorSchema } from './schema';

describe('Build Executor', () => {
  let context: ExecutorContext;
  let testOptions: BuildExecutorSchema;

  beforeEach(async () => {
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
      clean: false
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

  it('should not be able to override clean false', () => {
    testOptions.clean = true;
    expect(normalizeOptions(testOptions, context)).toMatchObject({
      clean: false
    });

    delete testOptions.clean;
    expect(normalizeOptions(testOptions, context)).toMatchObject({
      clean: false
    });
  });

  it('should throw when projectName is missing', (done) => {
    delete context.projectName;
    try {
      normalizeOptions(testOptions, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      done();
    }
  });

  it('should throw when project configuration is missing', (done) => {
    delete context.projectsConfigurations?.projects.testapp;
    try {
      normalizeOptions(testOptions, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      done();
    }
  });

  it('should throw when project root is missing', (done) => {
    delete context.projectsConfigurations?.projects.testapp.root;
    try {
      normalizeOptions(testOptions, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      done();
    }
  });

  it('should throw when sourceRoot is missing', (done) => {
    delete context.projectsConfigurations?.projects.testapp.sourceRoot;
    try {
      normalizeOptions(testOptions, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      done();
    }
  });
});
