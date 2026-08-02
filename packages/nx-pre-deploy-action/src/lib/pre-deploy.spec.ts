import * as core from '@actions/core';
import * as github from '@actions/github';
import * as tenancy from '@codeware/shared/feature/tenancy';
import * as coreAction from '@codeware/shared/util/github';
import { analyzeAppsToDeploy } from '@codeware/shared/util/nx-deploy';

import { preDeploy } from './pre-deploy';
import type { ActionInputs } from './schemas/action-inputs.schema';

vi.mock('@actions/core');
vi.mock('@actions/github', () => ({
  ...vi.importActual('@actions/github'),
  // Make context mock editable
  context: {}
}));
vi.mock('@codeware/shared/util/github', async () => ({
  ...(await vi.importActual('@codeware/shared/util/github')),
  getRepositoryDefaultBranch: vi.fn()
}));
vi.mock('@codeware/shared/util/nx-deploy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@codeware/shared/util/nx-deploy')>()),
  analyzeAppsToDeploy: vi.fn()
}));
// Partially mock the tenancy lib: override the fetchers, but spread through
// the real `filterByDeployRules` to test its actual (pure) implementation.
vi.mock('@codeware/shared/feature/tenancy', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@codeware/shared/feature/tenancy')
  >()),
  fetchAppSentry: vi.fn(),
  fetchAppTenants: vi.fn(),
  fetchDeployRules: vi.fn()
}));

describe('preDeploy', () => {
  let originalToken: string;

  vi.mocked(coreAction.getRepositoryDefaultBranch).mockResolvedValue('main');

  // Dynamic mock values or spies
  const mockCoreInfo = vi.mocked(core.info);
  const mockGithubContext = vi.mocked(github.context);
  const mockAnalyzeAppsToDeploy = vi.mocked(analyzeAppsToDeploy);
  const mockFetchAppSentry = vi.mocked(tenancy.fetchAppSentry);
  const mockFetchAppTenants = vi.mocked(tenancy.fetchAppTenants);
  const mockFetchDeployRules = vi.mocked(tenancy.fetchDeployRules);
  const spyFilterByDeployRules = vi.spyOn(tenancy, 'filterByDeployRules');

  /**
   * Set github context
   *
   * @param event Event context preset
   * @param override Override values
   */
  const setContext = (
    event: 'pull-request' | 'push-feature-branch' | 'push-main-branch' | 'tag'
  ) => {
    mockGithubContext.eventName =
      event === 'pull-request'
        ? 'pull_request'
        : event === 'tag'
          ? 'tag'
          : 'push';

    mockGithubContext.ref =
      event === 'pull-request'
        ? 'refs/heads/pr-branch'
        : event === 'push-main-branch'
          ? 'refs/heads/main'
          : event === 'push-feature-branch'
            ? 'refs/heads/feature'
            : 'refs/tags/tag';

    // Never changes
    mockGithubContext.repo = {
      owner: 'owner',
      repo: 'repo'
    };
  };

  /**
   * Setup test
   *
   * @param configOverride Additional config overrides
   * @returns Action inputs required values with optional overrides
   */
  const setupTest = (
    configOverride?: Partial<
      Pick<
        ActionInputs,
        | 'infisicalClientId'
        | 'infisicalClientSecret'
        | 'infisicalProjectId'
        | 'infisicalSite'
        | 'manualApp'
        | 'manualTenant'
        | 'manualEnvironment'
      >
    >
  ): ActionInputs => {
    return {
      ...{
        mainBranch: '',
        token: ''
      },
      ...configOverride
    };
  };

  beforeAll(() => {
    // Save original token
    originalToken = process.env['GITHUB_TOKEN'] as string;

    process.env['GITHUB_TOKEN'] = 'github-token';
  });

  afterAll(() => {
    if (originalToken) {
      process.env['GITHUB_TOKEN'] = originalToken;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();

    setContext('push-main-branch');

    // Default mocks
    mockAnalyzeAppsToDeploy.mockResolvedValue([]);
    mockFetchAppSentry.mockResolvedValue({});
    mockFetchAppTenants.mockResolvedValue({});
    mockFetchDeployRules.mockResolvedValue({ apps: '*', tenants: '*' });
  });

  describe('analyze environment', () => {
    it('should get valid migrate config from no inputs', async () => {
      const config = setupTest();

      expect(async () => await preDeploy(config, true)).not.toThrow();
    });

    it('should return preview for pull request', async () => {
      setContext('pull-request');
      const config = setupTest();
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [],
        appTenants: {},
        environment: 'preview'
      });
    });

    it('should return production for push to main branch', async () => {
      setContext('push-main-branch');
      const config = setupTest();
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [],
        appTenants: {},
        environment: 'production'
      });
    });

    it('should return empty for push to feature branch', async () => {
      setContext('push-feature-branch');
      const config = setupTest();
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [],
        appTenants: {},
        environment: ''
      });
    });

    it('should return empty for other events', async () => {
      setContext('tag');
      const config = setupTest();
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [],
        appTenants: {},
        environment: ''
      });
    });
  });

  describe('determine applications to deploy', () => {
    it('should filter and return only apps marked for deployment', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        },
        {
          projectName: 'cms',
          status: 'skip',
          reason: 'Deployment is disabled'
        },
        {
          projectName: 'api',
          status: 'deploy',
          flyConfigFile: 'apps/api/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      setContext('push-main-branch');
      const config = setupTest();
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          },
          {
            name: 'api',
            flyConfigFile: 'apps/api/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: {},
        environment: 'production'
      });
      expect(mockCoreInfo).toHaveBeenCalledWith('Deploy: web @ 1.0.0');
      expect(mockCoreInfo).toHaveBeenCalledWith(
        'Skip: cms - Deployment is disabled'
      );
      expect(mockCoreInfo).toHaveBeenCalledWith('Deploy: api @ 1.0.0');
    });

    it('should return empty apps array when no apps are ready for deployment', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'skip',
          reason: 'github.json not found'
        },
        {
          projectName: 'cms',
          status: 'skip',
          reason: 'Deployment is disabled'
        }
      ]);

      setContext('push-main-branch');
      const config = setupTest();
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [],
        appTenants: {},
        environment: 'production'
      });
    });

    it('should return empty apps array when analyzeAppsToDeploy returns empty', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([]);

      setContext('push-main-branch');
      const config = setupTest();
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [],
        appTenants: {},
        environment: 'production'
      });
    });

    it('should call analyzeAppsToDeploy once', async () => {
      setContext('push-main-branch');
      const config = setupTest();
      await preDeploy(config, true);

      expect(mockAnalyzeAppsToDeploy).toHaveBeenCalledTimes(1);
    });

    it('should pass environment to analyzeAppsToDeploy', async () => {
      setContext('push-main-branch');
      const config = setupTest();
      await preDeploy(config, true);

      expect(mockAnalyzeAppsToDeploy).toHaveBeenCalledWith(
        'production',
        undefined,
        undefined
      );
    });
  });

  describe('fetch app tenants from Infisical', () => {
    const infisicalConfig: Partial<ActionInputs> = {
      infisicalClientId: 'test-client-id',
      infisicalClientSecret: 'test-client-secret',
      infisicalProjectId: 'test-project-id',
      infisicalSite: 'eu'
    };

    it('should not fetch from Infisical when configuration is not provided', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      setContext('push-main-branch');
      const config = setupTest(); // No Infisical config
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: {},
        environment: 'production'
      });
      expect(mockFetchAppTenants).not.toHaveBeenCalled();
      expect(mockFetchDeployRules).not.toHaveBeenCalled();
      expect(mockCoreInfo).toHaveBeenCalledWith(
        'Infisical configuration not provided, skipping tenant fetching'
      );
    });

    it('should not fetch from Infisical when environment is empty', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      setContext('push-feature-branch'); // Non-deployable environment
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: {},
        environment: ''
      });
      expect(mockFetchAppTenants).not.toHaveBeenCalled();
      expect(mockFetchDeployRules).not.toHaveBeenCalled();
      expect(mockCoreInfo).toHaveBeenCalledWith(
        'Skipping tenant fetching (no valid environment)'
      );
    });

    it('should not fetch from Infisical when no apps to deploy', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([]);

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [],
        appTenants: {},
        environment: 'production'
      });
      expect(mockFetchAppTenants).not.toHaveBeenCalled();
      expect(mockFetchDeployRules).not.toHaveBeenCalled();
      expect(mockCoreInfo).toHaveBeenCalledWith(
        'Skipping tenant fetching (no apps to deploy)'
      );
    });

    it('should attach Sentry details to the apps that have them', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        },
        {
          projectName: 'cms',
          status: 'deploy',
          flyConfigFile: 'apps/cms/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      mockFetchAppSentry.mockResolvedValue({
        web: { project: 'web', dsn: 'https://web@sentry.io/2' }
      });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result.apps).toEqual([
        {
          name: 'web',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0',
          sentry: { project: 'web', dsn: 'https://web@sentry.io/2' }
        },
        {
          name: 'cms',
          flyConfigFile: 'apps/cms/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);
      expect(mockFetchAppSentry).toHaveBeenCalledWith(
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          projectId: 'test-project-id',
          site: 'eu',
          environment: 'production'
        },
        ['web', 'cms']
      );
    });

    it('should fetch tenants for single app', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'customer1' }]
      });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: { web: [{ tenant: 'demo' }, { tenant: 'customer1' }] },
        environment: 'production'
      });

      expect(mockFetchAppTenants).toHaveBeenCalledWith(
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          projectId: 'test-project-id',
          site: 'eu',
          environment: 'production'
        },
        ['web']
      );
      expect(spyFilterByDeployRules).toHaveBeenCalledWith(
        { web: [{ tenant: 'demo' }, { tenant: 'customer1' }] },
        { apps: '*', tenants: '*' }
      );
    });

    it('should fetch tenants for multiple apps', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        },
        {
          projectName: 'api',
          status: 'deploy',
          flyConfigFile: 'apps/api/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        },
        {
          projectName: 'cms',
          status: 'skip',
          reason: 'Deployment is disabled'
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'acme' }, { tenant: 'globex' }],
        api: [{ tenant: 'demo' }, { tenant: 'acme' }]
      });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          },
          {
            name: 'api',
            flyConfigFile: 'apps/api/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: {
          web: [{ tenant: 'demo' }, { tenant: 'acme' }, { tenant: 'globex' }],
          api: [{ tenant: 'demo' }, { tenant: 'acme' }]
        },
        environment: 'production'
      });

      expect(mockFetchAppTenants).toHaveBeenCalledWith(
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          projectId: 'test-project-id',
          site: 'eu',
          environment: 'production'
        },
        ['web', 'api']
      );
      expect(spyFilterByDeployRules).toHaveBeenCalledWith(
        {
          web: [{ tenant: 'demo' }, { tenant: 'acme' }, { tenant: 'globex' }],
          api: [{ tenant: 'demo' }, { tenant: 'acme' }]
        },
        { apps: '*', tenants: '*' }
      );
    });

    it('should handle app with no tenants (single-tenant app)', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'cms',
          status: 'deploy',
          flyConfigFile: 'apps/cms/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        cms: []
      });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'cms',
            flyConfigFile: 'apps/cms/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: { cms: [] },
        environment: 'production'
      });
    });

    it('should fetch tenants for preview environment', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }]
      });

      setContext('pull-request');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: { web: [{ tenant: 'demo' }] },
        environment: 'preview'
      });

      expect(mockFetchAppTenants).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'preview'
        }),
        ['web']
      );
    });

    it('should use US site when configured', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({ web: [] });

      setContext('push-main-branch');
      const config = setupTest({
        ...infisicalConfig,
        infisicalSite: 'us'
      });
      await preDeploy(config, true);

      expect(mockFetchAppTenants).toHaveBeenCalledWith(
        expect.objectContaining({
          site: 'us'
        }),
        ['web']
      );
    });

    it('should handle mixed multi-tenant and single-tenant apps', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        },
        {
          projectName: 'cms',
          status: 'deploy',
          flyConfigFile: 'apps/cms/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        },
        {
          projectName: 'api',
          status: 'deploy',
          flyConfigFile: 'apps/api/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'customer1' }],
        cms: [],
        api: [{ tenant: 'demo' }]
      });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          },
          {
            name: 'cms',
            flyConfigFile: 'apps/cms/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          },
          {
            name: 'api',
            flyConfigFile: 'apps/api/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: {
          web: [{ tenant: 'demo' }, { tenant: 'customer1' }],
          cms: [],
          api: [{ tenant: 'demo' }]
        },
        environment: 'production'
      });

      expect(mockCoreInfo).toHaveBeenCalledWith(
        'Multi-tenant apps: web (2), api (1)'
      );
      expect(mockCoreInfo).toHaveBeenCalledWith('Single-tenant apps: cms');
    });
  });

  describe('deployment rules filtering', () => {
    const infisicalConfig: Partial<ActionInputs> = {
      infisicalClientId: 'test-client-id',
      infisicalClientSecret: 'test-client-secret',
      infisicalProjectId: 'test-project-id',
      infisicalSite: 'eu'
    };

    it('should call fetchDeployRules with correct config', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'acme' }]
      });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      await preDeploy(config, true);

      expect(mockFetchDeployRules).toHaveBeenCalledWith({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        projectId: 'test-project-id',
        site: 'eu',
        environment: 'production'
      });
      expect(mockFetchDeployRules).toHaveBeenCalledTimes(1);
    });

    it('should call filter by deploy rules with fetched tenants and rules', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);

      const mockAppTenants: fetchAppTenantsModule.AppTenantsMap = {
        web: [{ tenant: 'demo' }, { tenant: 'acme' }, { tenant: 'globex' }]
      };
      const mockRules: tenancy.DeployRules = { apps: '*', tenants: 'demo' };

      mockFetchAppTenants.mockResolvedValue(mockAppTenants);
      mockFetchDeployRules.mockResolvedValue(mockRules);

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(spyFilterByDeployRules).toHaveBeenCalledWith(
        mockAppTenants,
        mockRules
      );
      expect(spyFilterByDeployRules).toHaveBeenCalledTimes(1);
      expect(result.appTenants).toEqual({ web: [{ tenant: 'demo' }] });
    });

    it('should use filtered results in output', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        },
        {
          projectName: 'api',
          status: 'deploy',
          flyConfigFile: 'apps/api/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);
      // Filter should remove api based on apps rule
      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'acme' }],
        api: [{ tenant: 'demo' }]
      });
      mockFetchDeployRules.mockResolvedValue({ apps: 'web', tenants: '*' });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          },
          {
            name: 'api',
            flyConfigFile: 'apps/api/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: {
          web: [{ tenant: 'demo' }, { tenant: 'acme' }]
        },
        environment: 'production'
      });
    });

    it('should handle tenant filtering in preview environment', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);
      // Filter should keep only 'demo' tenant based on tenants rule
      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'acme' }, { tenant: 'globex' }]
      });
      mockFetchDeployRules.mockResolvedValue({ apps: '*', tenants: 'demo' });

      setContext('pull-request');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(mockFetchDeployRules).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'preview'
        })
      );
      expect(result).toEqual({
        apps: [
          {
            name: 'web',
            flyConfigFile: 'apps/web/fly.toml',
            githubConfig: {},
            version: '1.0.0',
            previousVersion: '0.9.0'
          }
        ],
        appTenants: { web: [{ tenant: 'demo' }] },
        environment: 'preview'
      });
    });
  });

  describe('manual deployment overrides', () => {
    const infisicalConfig: Partial<ActionInputs> = {
      infisicalClientId: 'test-client-id',
      infisicalClientSecret: 'test-client-secret',
      infisicalProjectId: 'test-project-id',
      infisicalSite: 'eu'
    };

    const allApps = [
      {
        projectName: 'web',
        status: 'deploy' as const,
        flyConfigFile: 'apps/web/fly.toml',
        githubConfig: {},
        version: '1.0.0',
        previousVersion: '0.9.0'
      },
      {
        projectName: 'cms',
        status: 'deploy' as const,
        flyConfigFile: 'apps/cms/fly.toml',
        githubConfig: {},
        version: '1.0.0',
        previousVersion: '0.9.0'
      }
    ];

    beforeEach(() => {
      mockAnalyzeAppsToDeploy.mockImplementation(async (_env, _preid, apps) =>
        apps ? allApps.filter((a) => apps.includes(a.projectName)) : allApps
      );
    });

    it('should override environment when manualEnvironment is provided', async () => {
      setContext('push-feature-branch'); // Normally no environment
      const config = setupTest({
        ...infisicalConfig,
        manualEnvironment: 'production'
      });
      const result = await preDeploy(config, true);

      expect(result.environment).toBe('production');
      expect(mockCoreInfo).toHaveBeenCalledWith(
        expect.stringContaining('Manual environment override: production')
      );
    });

    it('should override app when manualApp is provided', async () => {
      setContext('push-main-branch');
      const config = setupTest({
        ...infisicalConfig,
        manualApp: 'cms'
      });
      mockFetchAppTenants.mockResolvedValue({ cms: [] });
      const result = await preDeploy(config, true);

      expect(result.apps).toEqual([
        {
          name: 'cms',
          flyConfigFile: 'apps/cms/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);
      expect(mockCoreInfo).toHaveBeenCalledWith('Manual app override: cms');
      expect(mockAnalyzeAppsToDeploy).toHaveBeenCalledWith(
        'production',
        undefined,
        ['cms']
      );
    });

    it('should override tenant when manualTenant is provided', async () => {
      setContext('push-main-branch');
      const config = setupTest({
        ...infisicalConfig,
        manualTenant: 'acme'
      });
      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'acme' }, { tenant: 'globex' }],
        cms: []
      });

      const result = await preDeploy(config, true);

      expect(result.appTenants).toEqual({
        web: [{ tenant: 'acme' }],
        cms: []
      });
      expect(mockCoreInfo).toHaveBeenCalledWith('Manual tenant override: acme');
    });

    it('should combine manual app and environment overrides', async () => {
      setContext('push-feature-branch'); // Normally no environment
      const config = setupTest({
        ...infisicalConfig,
        manualApp: 'web',
        manualEnvironment: 'preview'
      });
      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }]
      });

      const result = await preDeploy(config, true);

      expect(result.apps).toEqual([
        {
          name: 'web',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);
      expect(result.environment).toBe('preview');
      expect(mockAnalyzeAppsToDeploy).toHaveBeenCalledWith(
        'preview',
        undefined,
        ['web']
      );
    });

    it('should combine manual app, tenant, and environment overrides', async () => {
      setContext('push-feature-branch'); // Normally no environment
      const config = setupTest({
        ...infisicalConfig,
        manualApp: 'web',
        manualTenant: 'demo',
        manualEnvironment: 'production'
      });
      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'acme' }]
      });

      const result = await preDeploy(config, true);

      expect(result.apps).toEqual([
        {
          name: 'web',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: {},
          version: '1.0.0',
          previousVersion: '0.9.0'
        }
      ]);
      expect(result.environment).toBe('production');
      expect(result.appTenants).toEqual({
        web: [{ tenant: 'demo' }]
      });
      expect(mockAnalyzeAppsToDeploy).toHaveBeenCalledWith(
        'production',
        undefined,
        ['web']
      );
    });

    it('should not affect affected app analysis when manual overrides are not provided', async () => {
      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }],
        cms: []
      });

      await preDeploy(config, true);

      expect(mockAnalyzeAppsToDeploy).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeAppsToDeploy).toHaveBeenCalledWith(
        'production',
        undefined,
        undefined
      );
    });

    it('should filter out tenants that do not match manualTenant', async () => {
      setContext('push-main-branch');
      const config = setupTest({
        ...infisicalConfig,
        manualTenant: 'nonexistent'
      });
      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'acme' }],
        cms: []
      });

      const result = await preDeploy(config, true);

      expect(result.appTenants).toEqual({
        web: [],
        cms: []
      });
    });

    it('should still fetch from Infisical with manual environment override', async () => {
      setContext('push-feature-branch'); // Normally no environment
      const config = setupTest({
        ...infisicalConfig,
        manualEnvironment: 'preview'
      });
      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }],
        cms: []
      });

      await preDeploy(config, true);

      expect(mockFetchAppTenants).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'preview'
        }),
        ['web', 'cms']
      );
      expect(mockFetchDeployRules).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'preview'
        })
      );
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
      await preDeploy(config);

      expect(core.setFailed).toHaveBeenCalledWith('error message');
    });

    it('should return empty object', async () => {
      const config = setupTest();
      const result = await preDeploy(config);

      expect(result).toEqual({});
    });

    it('should not passthough exceptions by default', async () => {
      const config = setupTest();

      expect(async () => await preDeploy(config)).not.toThrow();
    });

    it('should passthough exceptions', async () => {
      const config = setupTest();

      let error;
      let result;

      try {
        result = await preDeploy(config, true);
      } catch (e) {
        error = e;
      }

      expect(error).toBe('error message');
      expect(result).toBeUndefined();
    });
  });
});
