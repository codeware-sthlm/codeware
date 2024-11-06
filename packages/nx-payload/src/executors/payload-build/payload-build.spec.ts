import type { ExecutorContext } from '@nx/devkit';

import {
  type NormalizedSchema,
  normalizeOptions
} from './libs/normalize-options';

describe('Payload Build Executor', () => {
  let context: ExecutorContext;

  beforeEach(async () => {
    context = {
      root: '/root',
      cwd: '/root',
      projectsConfigurations: {
        version: 2,
        projects: {
          testapp: { root: 'apps/testapp', sourceRoot: 'apps/testapp/src' }
        }
      },
      projectGraph: { dependencies: {}, nodes: {} },
      nxJsonConfiguration: {},
      isVerbose: false,
      projectName: 'testapp',
      targetName: 'payload-build'
    };
  });

  it('should normalize options when outputPath is missing', () => {
    const options = normalizeOptions({}, context);

    expect(options).toEqual<NormalizedSchema>({
      projectRoot: 'apps/testapp',
      sourceRoot: 'apps/testapp/src'
    });
  });

  it('should normalize options when outputPath is undefined', () => {
    const options = normalizeOptions({}, context);

    expect(options).toEqual<NormalizedSchema>({
      projectRoot: 'apps/testapp',
      sourceRoot: 'apps/testapp/src'
    });
  });

  it('should normalize options when outputPath has a value', () => {
    const options = normalizeOptions(
      { outputPath: 'dist/apps/testapp' },
      context
    );

    expect(options).toEqual<NormalizedSchema>({
      projectRoot: 'apps/testapp',
      sourceRoot: 'apps/testapp/src',
      outputPath: 'dist/apps/testapp'
    });
  });

  it('should throw when projectName is missing', (done) => {
    delete context.projectName;
    try {
      normalizeOptions({}, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      done();
    }
  });

  it('should throw when project configuration is missing', (done) => {
    delete context.projectsConfigurations?.projects.testapp;
    try {
      normalizeOptions({}, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      done();
    }
  });

  it('should throw when project root is missing', (done) => {
    delete context.projectsConfigurations?.projects.testapp.root;
    try {
      normalizeOptions({}, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      done();
    }
  });

  it('should throw when sourceRoot is missing', (done) => {
    delete context.projectsConfigurations?.projects.testapp.sourceRoot;
    try {
      normalizeOptions({}, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      done();
    }
  });
});
