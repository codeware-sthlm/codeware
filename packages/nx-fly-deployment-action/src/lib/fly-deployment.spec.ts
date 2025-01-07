import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import { WebhookPayload } from '@actions/github/lib/interfaces';
import * as coreAction from '@codeware/core/actions';
import { type DeployAppOptions, Fly } from '@codeware/fly-node';
import * as devkit from '@nx/devkit';
import { ProjectConfiguration } from '@nx/devkit';
import type { PullRequestEvent } from '@octokit/webhooks-types';
import { vol } from 'memfs';

import { flyDeployment } from './fly-deployment';
import type { ActionInputs } from './schemas/action-inputs.schema';
import { ActionOutputs } from './schemas/action-outputs.schema';

// Mock strategy:
// - Wrap every module/function with `vi.mock` to mock away the real implementation
// - Create a mock function for those functions that needs to be interacted with
vi.mock('fs', async () => {
  const memfs = await vi.importActual('memfs');
  return {
    ...memfs,
    default: memfs,
    promises: memfs['promises'],
    existsSync: memfs['existsSync'],
    readFileSync: memfs['readFileSync'],
    __esModule: true
  };
});
vi.mock('@actions/core');
vi.mock('@actions/exec');
vi.mock('@actions/github', () => ({
  ...vi.importActual('@actions/github'),
  // Make context mock editable
  context: {}
}));
vi.mock('@codeware/core/actions', async () => ({
  ...(await vi.importActual('@codeware/core/actions')),
  addPullRequestComment: vi.fn(),
  getPullRequest: vi.fn(),
  getRepositoryDefaultBranch: vi.fn(),
  withGitHubContext: vi.fn()
}));
vi.mock('@codeware/fly-node');
vi.mock('@nx/devkit');

describe('flyDeployment', () => {
  // Save environment variables before tests
  let envFlyPostgres: {
    preview?: string;
    production?: string;
  };

  // Static mock values
  vi.mocked(devkit.getPackageManagerCommand).mockReturnValue({
    exec: 'npx',
    install: 'npm install --no-immutable'
  } as ReturnType<typeof devkit.getPackageManagerCommand>);
  vi.mocked(coreAction.getRepositoryDefaultBranch).mockResolvedValue('main');

  // Dynamic mock values or spies
  const mockCoreEndGroup = vi.mocked(core.endGroup);
  const mockCoreInfo = vi.mocked(core.info);
  const mockCoreStartGroup = vi.mocked(core.startGroup);
  const mockCoreWarning = vi.mocked(core.warning);
  const mockCoreActionGetPullRequest = vi.mocked(coreAction.getPullRequest);
  const mockExecGetExecOutput = vi.mocked(exec.getExecOutput);
  const mockGithubContext = vi.mocked(github.context);
  const mockFly = vi.mocked(Fly);

  /**
   * Helper to get the mocked Fly instance to interact and spy on methods
   */
  const getMockFly = () =>
    mockFly.mock.results[0].value as typeof Fly.prototype;

  /**
   * Set github context
   *
   * @param event Event context preset
   * @param override Override values
   */
  const setContext = (
    event:
      | 'pr-closed'
      | 'pr-opened'
      | 'push-feature-branch'
      | 'push-main-branch',
    override?: Pick<typeof github.context, 'eventName' | 'payload'>
  ) => {
    const isPR = event.match(/pr-/);
    const payload =
      event === 'pr-closed'
        ? ({
            number: 1,
            pull_request: { state: 'closed' }
          } as PullRequestEvent)
        : event === 'pr-opened'
          ? ({
              number: 1,
              pull_request: { state: 'open' }
            } as PullRequestEvent)
          : undefined;

    mockGithubContext.eventName =
      override?.eventName || isPR ? 'pull_request' : 'push';

    mockGithubContext.payload = {
      ...payload,
      ...(override?.payload ?? {})
    } as WebhookPayload;

    // Never changes
    mockGithubContext.ref = 'refs/heads/main';
    mockGithubContext.repo = {
      owner: 'owner',
      repo: 'repo'
    };
  };

  /**
   * Setup mock implementations
   *
   * - Virtual file system
   * - Fly class
   * - Nx commands
   * - Debug logging
   */
  const setupMocks = (
    overrides: {
      /**
       * Deployed apps than can be destroyed
       * @default
       * [{ name: 'app-one' }, { name: 'app-two' }]
       */
      flyApps?: Awaited<ReturnType<typeof Fly.prototype.apps.list>>;
      /**
       * Affected projects can be deployed
       * @default
       * ['app-one', 'app-two']
       */
      affectedProjects?: Array<string>;
      /**
       * Project configuration required for deployment
       * @default
       * [{ name: 'app-one', root: '/apps/app-one' }, { name: 'app-two', root: '/apps/app-two' }]
       */
      projectConfigs?: Array<Pick<ProjectConfiguration, 'name' | 'root'>>;
      /**
       * GitHub configuration file exists for projects
       * @default
       * { 'app-one': true, 'app-two': true }
       */
      githubConfigExists?: Record<string, boolean>;
      /**
       * Fly configuration file exists for projects
       * @default
       * { 'app-one': true, 'app-two': true }
       */
      flyConfigExists?: Record<string, boolean>;
      /**
       * Environment variable values for postgres cluster name keys.
       * - preview: `${TEST_FLY_POSTGRES_PREVIEW}`
       * - production: `${TEST_FLY_POSTGRES_PRODUCTION}`
       *
       * **ONLY** in `/apps/app-one/github.json`.
       *
       * `null` value will delete the environment variable.
       * @default
       * {
       *   TEST_FLY_POSTGRES_PREVIEW: 'pg-preview',
       *   TEST_FLY_POSTGRES_PRODUCTION: 'pg-production'
       * }
       */
      envFlyPostgres?: {
        TEST_FLY_POSTGRES_PREVIEW?: string | null;
        TEST_FLY_POSTGRES_PRODUCTION?: string | null;
      };
    } = {}
  ) => {
    const {
      flyApps,
      affectedProjects,
      projectConfigs,
      githubConfigExists,
      flyConfigExists,
      envFlyPostgres
    } = {
      flyApps: overrides.flyApps || [{ name: 'app-one' }, { name: 'app-two' }],
      affectedProjects: overrides.affectedProjects || ['app-one', 'app-two'],
      projectConfigs: overrides.projectConfigs || [
        {
          name: 'app-one',
          root: '/apps/app-one'
        },
        {
          name: 'app-two',
          root: '/apps/app-two'
        }
      ],
      githubConfigExists: overrides.githubConfigExists || {
        'app-one': true,
        'app-two': true
      },
      flyConfigExists: overrides.flyConfigExists || {
        'app-one': true,
        'app-two': true
      },
      envFlyPostgres: overrides.envFlyPostgres || {
        TEST_FLY_POSTGRES_PREVIEW: 'pg-preview',
        TEST_FLY_POSTGRES_PRODUCTION: 'pg-production'
      }
    };

    // Environment variables
    if (envFlyPostgres.TEST_FLY_POSTGRES_PREVIEW !== null) {
      process.env['TEST_FLY_POSTGRES_PREVIEW'] =
        envFlyPostgres.TEST_FLY_POSTGRES_PREVIEW;
    } else {
      delete process.env['TEST_FLY_POSTGRES_PREVIEW'];
    }
    if (envFlyPostgres.TEST_FLY_POSTGRES_PRODUCTION !== null) {
      process.env['TEST_FLY_POSTGRES_PRODUCTION'] =
        envFlyPostgres.TEST_FLY_POSTGRES_PRODUCTION;
    } else {
      delete process.env['TEST_FLY_POSTGRES_PRODUCTION'];
    }

    // Create virtual file system.
    // app-one uses default paths and app-two uses custom paths.
    // app-one has postgres setup, app-two does not.
    vol.reset();
    vol.fromNestedJSON({
      '/apps/app-one': {
        'fly.toml': '',
        [githubConfigExists['app-one'] ? 'github.json' : 'azure.json']:
          JSON.stringify({
            deploy: true,
            flyConfig: flyConfigExists['app-one']
              ? 'fly.toml'
              : 'secret/fly.toml',
            flyPostgresPreview: '${TEST_FLY_POSTGRES_PREVIEW}',
            flyPostgresProduction: '${TEST_FLY_POSTGRES_PRODUCTION}'
          })
      },
      '/apps/app-two/src': {
        'fly.toml': '',
        config: {
          [githubConfigExists['app-two'] ? 'github.json' : 'azure.json']:
            JSON.stringify({
              deploy: true,
              flyConfig: flyConfigExists['app-two']
                ? 'src/fly.toml'
                : 'secret/fly.toml'
            })
        }
      }
    });

    // Debug logging
    mockCoreEndGroup.mockImplementation(() => console.log('[GRP-]'));
    mockCoreInfo.mockImplementation((msg) => console.log(`[INFO] ${msg}`));
    mockCoreStartGroup.mockImplementation((msg) =>
      console.log(`[GRP+] ${msg}`)
    );
    mockCoreWarning.mockImplementation((msg) => console.log(`[WARN] ${msg}`));

    // Mock Fly class
    mockFly.mockReturnValue({
      apps: {
        destroy: vi.fn(),
        // Deployed apps than can be destroyed
        list: vi.fn().mockResolvedValue(flyApps)
      },
      cli: {
        isInstalled: vi.fn().mockResolvedValue(true)
      },
      config: {
        show: vi.fn().mockImplementation(({ config }) =>
          Promise.resolve({
            // App name from fly.toml is '{app-name}-config'
            app: config.replace(/\/apps\/([^/]+)\/.*/, '$1-config')
          })
        )
      },
      deploy: vi.fn().mockImplementation(({ app }) =>
        Promise.resolve({
          app,
          url: `https://${app}.fly.dev`
        })
      ),
      isReady: vi.fn()
    } as unknown as Fly);

    mockExecGetExecOutput.mockImplementation((cmd, args = []) => {
      const argsStr = args.join(' ');

      if (argsStr.match(/nx show projects --type app --affected --json/)) {
        return Promise.resolve({
          stdout: JSON.stringify(affectedProjects),
          stderr: '',
          exitCode: 0
        });
      }
      // Get project configuration, [nx, show, project, <project-name>, --json]
      else if (argsStr.match(/nx show project .* --json/)) {
        return Promise.resolve({
          stdout:
            JSON.stringify(projectConfigs.find((p) => p.name === args[3])) ||
            '{}',
          stderr: '',
          exitCode: 0
        });
      }

      return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 });
    });
  };

  /**
   * Setup test
   *
   * @param configOverride Additional config overrides
   * @returns Action inputs required values with optional overrides
   */
  const setupTest = (configOverride?: Partial<ActionInputs>): ActionInputs => {
    return {
      ...{
        env: [],
        flyApiToken: 'fly-api-token',
        flyOrg: 'fly-org',
        flyRegion: '',
        mainBranch: '',
        secrets: [],
        token: 'token'
      },
      ...configOverride
    };
  };

  beforeAll(() => {
    envFlyPostgres = {
      preview: process.env['TEST_FLY_POSTGRES_PREVIEW'],
      production: process.env['TEST_FLY_POSTGRES_PRODUCTION']
    };
  });

  afterAll(() => {
    if (envFlyPostgres.preview) {
      process.env['TEST_FLY_POSTGRES_PREVIEW'] = envFlyPostgres.preview;
    } else {
      delete process.env['TEST_FLY_POSTGRES_PREVIEW'];
    }
    if (envFlyPostgres.production) {
      process.env['TEST_FLY_POSTGRES_PRODUCTION'] = envFlyPostgres.production;
    } else {
      delete process.env['TEST_FLY_POSTGRES_PRODUCTION'];
    }
  });

  beforeEach(() => {
    // Clear the virtual file system before each test
    vol.reset();

    vi.clearAllMocks();

    setupMocks();
    setContext('push-main-branch');
  });

  describe('start up', () => {
    it('should get valid migrate config from only required inputs', async () => {
      const config = setupTest();

      expect(config).toEqual({
        env: [],
        flyApiToken: 'fly-api-token',
        flyOrg: 'fly-org',
        flyRegion: '',
        mainBranch: '',
        secrets: [],
        token: 'token'
      } satisfies ActionInputs);

      expect(async () => await flyDeployment(config, true)).not.toThrow();
    });

    it('should fail deployment when fly token is missing', async () => {
      const config = setupTest({ flyApiToken: '' });

      await expect(
        async () => await flyDeployment(config, true)
      ).rejects.toThrow('token is required');
    });

    it('should fail deployment when github token is missing', async () => {
      const config = setupTest({ token: '' });

      await expect(
        async () => await flyDeployment(config, true)
      ).rejects.toThrow('token is required');
    });
  });

  describe('deploy to preview', () => {
    it('should analyze affected projects', async () => {
      setContext('pr-opened');
      setupMocks();
      const config = setupTest();
      await flyDeployment(config, true);

      expect(mockExecGetExecOutput).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'nx',
          'show',
          'projects',
          '--type',
          'app',
          '--affected',
          '--json'
        ])
      );
    });

    it('should return skipped projects when project configuration is missing', async () => {
      setContext('pr-opened');
      setupMocks({ projectConfigs: [] });
      const config = setupTest();
      const result = await flyDeployment(config, true);

      expect(result).toEqual({
        environment: 'preview',
        projects: [
          {
            action: 'skip',
            appOrProject: 'app-one',
            reason: 'Project config not found'
          },
          {
            action: 'skip',
            appOrProject: 'app-two',
            reason: 'Project config not found'
          }
        ]
      } satisfies ActionOutputs);
    });

    it('should return skipped projects when github configuration is missing', async () => {
      setContext('pr-opened');
      setupMocks({
        githubConfigExists: { 'app-one': false, 'app-two': false }
      });
      const config = setupTest();
      const result = await flyDeployment(config, true);

      expect(result).toEqual({
        environment: 'preview',
        projects: [
          {
            action: 'skip',
            appOrProject: 'app-one',
            reason: 'GitHub config file not found for the project'
          },
          {
            action: 'skip',
            appOrProject: 'app-two',
            reason: 'GitHub config file not found for the project'
          }
        ]
      } satisfies ActionOutputs);
    });

    it('should deploy to preview when all config files exists', async () => {
      setContext('pr-opened');
      setupMocks();
      const config = setupTest();
      const result = await flyDeployment(config, true);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config-pr-1',
        config: '/apps/app-one/fly.toml',
        env: {
          APP_NAME: 'app-one-config-pr-1',
          PR_NUMBER: '1'
        },
        environment: 'preview',
        postgres: expect.any(String)
      } satisfies DeployAppOptions);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config-pr-1',
        config: '/apps/app-two/src/fly.toml',
        env: {
          APP_NAME: 'app-two-config-pr-1',
          PR_NUMBER: '1'
        },
        environment: 'preview',
        postgres: undefined
      } satisfies DeployAppOptions);

      expect(result).toEqual({
        environment: 'preview',
        projects: [
          {
            action: 'deploy',
            app: 'app-one-config-pr-1',
            name: 'app-one',
            url: 'https://app-one-config-pr-1.fly.dev'
          },
          {
            action: 'deploy',
            app: 'app-two-config-pr-1',
            name: 'app-two',
            url: 'https://app-two-config-pr-1.fly.dev'
          }
        ]
      } satisfies ActionOutputs);
    });

    it('should deploy apps to preview with environment variables', async () => {
      setContext('pr-opened');
      setupMocks();
      const config = setupTest({
        env: ['ENV_KEY1=env-value1', 'ENV_KEY2=env-value2']
      });
      await flyDeployment(config, true);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config-pr-1',
        config: '/apps/app-one/fly.toml',
        environment: 'preview',
        env: {
          APP_NAME: 'app-one-config-pr-1',
          ENV_KEY1: 'env-value1',
          ENV_KEY2: 'env-value2',
          PR_NUMBER: '1'
        },
        postgres: expect.any(String)
      } satisfies DeployAppOptions);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config-pr-1',
        config: '/apps/app-two/src/fly.toml',
        environment: 'preview',
        env: {
          APP_NAME: 'app-two-config-pr-1',
          ENV_KEY1: 'env-value1',
          ENV_KEY2: 'env-value2',
          PR_NUMBER: '1'
        },
        postgres: undefined
      } satisfies DeployAppOptions);
    });

    it('should deploy apps to preview with the same secrets', async () => {
      setContext('pr-opened');
      setupMocks();
      const config = setupTest({
        secrets: ['SECRET_KEY1=secret-value1', 'SECRET_KEY2=secret-value2']
      });
      await flyDeployment(config, true);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config-pr-1',
        config: '/apps/app-one/fly.toml',
        environment: 'preview',
        env: expect.any(Object),
        postgres: expect.any(String),
        secrets: {
          SECRET_KEY1: 'secret-value1',
          SECRET_KEY2: 'secret-value2'
        }
      } satisfies DeployAppOptions);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config-pr-1',
        config: '/apps/app-two/src/fly.toml',
        environment: 'preview',
        env: expect.any(Object),
        postgres: undefined,
        secrets: {
          SECRET_KEY1: 'secret-value1',
          SECRET_KEY2: 'secret-value2'
        }
      } satisfies DeployAppOptions);
    });

    it('should deploy apps to preview and attach to postgres when preview cluster is set', async () => {
      setContext('pr-opened');
      setupMocks();
      const config = setupTest();
      await flyDeployment(config, true);

      // app-one has postgres setup, app-two does not.
      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config-pr-1',
        config: '/apps/app-one/fly.toml',
        environment: 'preview',
        env: expect.any(Object),
        postgres: 'pg-preview'
      });

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config-pr-1',
        config: '/apps/app-two/src/fly.toml',
        environment: 'preview',
        env: expect.any(Object),
        postgres: undefined
      });
    });

    it('should deploy apps to preview and not attach to postgres when only production cluster is set', async () => {
      setContext('pr-opened');
      setupMocks({ envFlyPostgres: { TEST_FLY_POSTGRES_PREVIEW: undefined } });
      const config = setupTest();
      await flyDeployment(config, true);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config-pr-1',
        config: '/apps/app-one/fly.toml',
        environment: 'preview',
        env: expect.any(Object),
        postgres: undefined
      });

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config-pr-1',
        config: '/apps/app-two/src/fly.toml',
        environment: 'preview',
        env: expect.any(Object),
        postgres: undefined
      });
    });
  });

  describe('destroy preview', () => {
    it('should not analyze affected projects', async () => {
      setContext('pr-closed');
      setupMocks();
      const config = setupTest();
      await flyDeployment(config, true);

      expect(mockExecGetExecOutput).not.toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining(['nx', 'show', 'projects'])
      );
    });

    it('should destroy preview apps when pull request is closed', async () => {
      setContext('pr-closed');
      setupMocks({
        flyApps: [
          { name: 'app-one-pr-1' },
          { name: 'app-two-pr-1' }
        ] as Awaited<ReturnType<typeof Fly.prototype.apps.list>>
      });
      const config = setupTest();
      mockCoreActionGetPullRequest.mockResolvedValue({
        state: 'closed'
      } as any);
      const result = await flyDeployment(config, true);

      expect(getMockFly().apps.destroy).toHaveBeenCalledWith('app-one-pr-1');
      expect(getMockFly().apps.destroy).toHaveBeenCalledWith('app-two-pr-1');

      expect(result).toEqual({
        environment: 'preview',
        projects: [
          {
            action: 'destroy',
            app: 'app-one-pr-1'
          },
          {
            action: 'destroy',
            app: 'app-two-pr-1'
          }
        ]
      } satisfies ActionOutputs);
    });

    it('should destroy preview apps with pull request number', async () => {
      setContext('pr-closed');
      setupMocks({
        flyApps: [{ name: 'app-one-1' }, { name: 'app-two-pr-1' }] as Awaited<
          ReturnType<typeof Fly.prototype.apps.list>
        >
      });
      const config = setupTest();
      mockCoreActionGetPullRequest.mockResolvedValue({
        state: 'closed'
      } as any);
      const result = await flyDeployment(config, true);

      expect(getMockFly().apps.destroy).toHaveBeenCalledWith('app-two-pr-1');

      expect(result).toEqual({
        environment: 'preview',
        projects: [
          {
            action: 'destroy',
            app: 'app-two-pr-1'
          }
        ]
      } satisfies ActionOutputs);
    });

    it('should not destroy preview apps when pull request is open', async () => {
      setContext('pr-closed');
      setupMocks({
        flyApps: [
          { name: 'app-one-pr-1' },
          { name: 'app-two-pr-1' }
        ] as Awaited<ReturnType<typeof Fly.prototype.apps.list>>
      });
      const config = setupTest();
      mockCoreActionGetPullRequest.mockResolvedValue({
        state: 'open'
      } as any);
      const result = await flyDeployment(config, true);

      expect(getMockFly().apps.destroy).not.toHaveBeenCalled();

      expect(result).toEqual({
        environment: 'preview',
        projects: []
      } satisfies ActionOutputs);
    });
  });

  describe('deploy to production', () => {
    it('should analyze affected projects', async () => {
      setContext('push-main-branch');
      setupMocks();
      const config = setupTest();
      await flyDeployment(config, true);

      expect(mockExecGetExecOutput).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining([
          'nx',
          'show',
          'projects',
          '--type',
          'app',
          '--affected',
          '--json'
        ])
      );
    });

    it('should return empty projects when nothing to deploy', async () => {
      setContext('push-main-branch');
      setupMocks({ affectedProjects: [] });
      const config = setupTest();
      const result = await flyDeployment(config, true);

      expect(result).toEqual({ environment: expect.any(String), projects: [] });
    });

    it('should return skipped projects when project configuration is missing', async () => {
      setContext('push-main-branch');
      setupMocks({ projectConfigs: [] });
      const config = setupTest();
      const result = await flyDeployment(config, true);

      expect(result).toEqual({
        environment: 'production',
        projects: [
          {
            action: 'skip',
            appOrProject: 'app-one',
            reason: 'Project config not found'
          },
          {
            action: 'skip',
            appOrProject: 'app-two',
            reason: 'Project config not found'
          }
        ]
      } satisfies ActionOutputs);
    });

    it('should return skipped projects when github configuration is missing', async () => {
      setContext('push-main-branch');
      setupMocks({
        githubConfigExists: { 'app-one': false, 'app-two': false }
      });
      const config = setupTest();
      const result = await flyDeployment(config, true);

      expect(result).toEqual({
        environment: 'production',
        projects: [
          {
            action: 'skip',
            appOrProject: 'app-one',
            reason: 'GitHub config file not found for the project'
          },
          {
            action: 'skip',
            appOrProject: 'app-two',
            reason: 'GitHub config file not found for the project'
          }
        ]
      } satisfies ActionOutputs);
    });

    it('should deploy to production when all config files exists', async () => {
      setContext('push-main-branch');
      setupMocks();
      const config = setupTest();
      const result = await flyDeployment(config, true);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config',
        config: '/apps/app-one/fly.toml',
        env: {
          APP_NAME: 'app-one-config',
          PR_NUMBER: ''
        },
        environment: 'production',
        postgres: expect.any(String)
      } satisfies DeployAppOptions);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config',
        config: '/apps/app-two/src/fly.toml',
        env: {
          APP_NAME: 'app-two-config',
          PR_NUMBER: ''
        },
        environment: 'production',
        postgres: undefined
      } satisfies DeployAppOptions);

      expect(result).toEqual({
        environment: 'production',
        projects: [
          {
            action: 'deploy',
            app: 'app-one-config',
            name: 'app-one',
            url: 'https://app-one-config.fly.dev'
          },
          {
            action: 'deploy',
            app: 'app-two-config',
            name: 'app-two',
            url: 'https://app-two-config.fly.dev'
          }
        ]
      } satisfies ActionOutputs);
    });

    it('should deploy apps to production with environment variables', async () => {
      setContext('push-main-branch');
      setupMocks();
      const config = setupTest({
        env: [
          'APP_NAME=app-one',
          'ENV_KEY1=env"fnutt',
          'ENV_KEY2=env space',
          'ENV_KEY3=env\\backslash',
          'PR_NUMBER='
        ]
      });
      await flyDeployment(config, true);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config',
        config: '/apps/app-one/fly.toml',
        environment: 'production',
        postgres: expect.any(String),
        env: {
          APP_NAME: 'app-one-config',
          ENV_KEY1: 'env"fnutt',
          ENV_KEY2: 'env space',
          ENV_KEY3: 'env\\backslash',
          PR_NUMBER: ''
        }
      } satisfies DeployAppOptions);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config',
        config: '/apps/app-two/src/fly.toml',
        environment: 'production',
        postgres: undefined,
        env: {
          APP_NAME: 'app-two-config',
          ENV_KEY1: 'env"fnutt',
          ENV_KEY2: 'env space',
          ENV_KEY3: 'env\\backslash',
          PR_NUMBER: ''
        }
      } satisfies DeployAppOptions);
    });

    it('should deploy apps to production with the same secrets', async () => {
      setContext('push-main-branch');
      setupMocks();
      const config = setupTest({
        secrets: [
          'SECRET_KEY1=secret"fnutt',
          'SECRET_KEY2=secret space',
          'SECRET_KEY3=secret\\backslash'
        ]
      });
      await flyDeployment(config, true);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config',
        config: '/apps/app-one/fly.toml',
        environment: 'production',
        env: expect.any(Object),
        postgres: expect.any(String),
        secrets: {
          SECRET_KEY1: 'secret"fnutt',
          SECRET_KEY2: 'secret space',
          SECRET_KEY3: 'secret\\backslash'
        }
      } satisfies DeployAppOptions);

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config',
        config: '/apps/app-two/src/fly.toml',
        environment: 'production',
        env: expect.any(Object),
        postgres: undefined,
        secrets: {
          SECRET_KEY1: 'secret"fnutt',
          SECRET_KEY2: 'secret space',
          SECRET_KEY3: 'secret\\backslash'
        }
      } satisfies DeployAppOptions);
    });

    it('should deploy apps to production and attach to postgres production when production cluster is set', async () => {
      setContext('push-main-branch');
      setupMocks();
      const config = setupTest();
      await flyDeployment(config, true);

      // app-one has postgres setup, app-two does not.
      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config',
        config: '/apps/app-one/fly.toml',
        environment: 'production',
        env: expect.any(Object),
        postgres: 'pg-production'
      });

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config',
        config: '/apps/app-two/src/fly.toml',
        environment: 'production',
        env: expect.any(Object),
        postgres: undefined
      });
    });

    it('should deploy apps to production and not attach to postgres production when only preview cluster is set', async () => {
      setContext('push-main-branch');
      setupMocks({
        envFlyPostgres: { TEST_FLY_POSTGRES_PRODUCTION: undefined }
      });
      const config = setupTest();
      await flyDeployment(config, true);

      // app-one has postgres setup, app-two does not.
      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-one-config',
        config: '/apps/app-one/fly.toml',
        environment: 'production',
        env: expect.any(Object),
        postgres: undefined
      });

      expect(getMockFly().deploy).toHaveBeenCalledWith({
        app: 'app-two-config',
        config: '/apps/app-two/src/fly.toml',
        environment: 'production',
        env: expect.any(Object),
        postgres: undefined
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      // Mock error response for a function called early in the flow
      mockCoreInfo.mockImplementation(() => {
        throw new Error('error message');
      });
    });

    it('should set failed error message', async () => {
      const config = setupTest();
      await flyDeployment(config);

      expect(core.setFailed).toHaveBeenCalledWith('error message');
    });

    it('should return empty properties', async () => {
      const config = setupTest();
      const result = await flyDeployment(config);

      expect(result).toEqual({
        environment: null,
        projects: []
      });
    });

    it('should not passthough exceptions by default', async () => {
      const config = setupTest();

      expect(async () => await flyDeployment(config)).not.toThrow();
    });

    it('should passthough exceptions', async () => {
      const config = setupTest();

      let error;
      let result;

      try {
        result = await flyDeployment(config, true);
      } catch (e) {
        error = e;
      }

      expect(error).toBe('error message');
      expect(result).toBeUndefined();
    });
  });
});
