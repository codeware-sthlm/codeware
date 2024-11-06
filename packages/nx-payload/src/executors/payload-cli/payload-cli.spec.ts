import type { ExecutorContext } from '@nx/devkit';

import {
  type NormalizedSchema,
  normalizeOptions
} from './libs/normalize-options';
import type { PayloadCliExecutorSchema } from './schema';

describe('Payload Cli Executor', () => {
  let context: ExecutorContext;
  let testOptions: PayloadCliExecutorSchema;

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
      targetName: 'payload-cli'
    };

    testOptions = {
      _: []
    };
  });

  it('should normalize options for valid config', () => {
    const options = normalizeOptions(testOptions, context);

    expect(options).toEqual<NormalizedSchema>({
      projectRoot: 'apps/testapp',
      sourceRoot: 'apps/testapp/src'
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
