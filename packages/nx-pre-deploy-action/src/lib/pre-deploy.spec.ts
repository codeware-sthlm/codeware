import * as core from '@actions/core';
import * as github from '@actions/github';
import * as coreAction from '@codeware/core/actions';
import { analyzeAppsToDeploy } from '@codeware/core/actions-internal';

import { preDeploy } from './pre-deploy';
import type { ActionInputs } from './schemas/action-inputs.schema';
import { DeployRules } from './schemas/deploy-rules.schema';
import * as fetchAppTenantsModule from './utils/fetch-app-tenants';
import * as fetchDeployRulesModule from './utils/fetch-deploy-rules';
import * as filterByDeployRulesModule from './utils/filter-by-deploy-rules';

vi.mock('@actions/core');
vi.mock('@actions/github', () => ({
  ...vi.importActual('@actions/github'),
  // Make context mock editable
  context: {}
}));
vi.mock('@codeware/core/actions', async () => ({
  ...(await vi.importActual('@codeware/core/actions')),
  getRepositoryDefaultBranch: vi.fn()
}));
vi.mock('@codeware/core/actions-internal', () => ({
  analyzeAppsToDeploy: vi.fn()
}));
vi.mock('./utils/fetch-app-tenants', () => ({
  fetchAppTenants: vi.fn()
}));
vi.mock('./utils/fetch-deploy-rules', () => ({
  fetchDeployRules: vi.fn()
}));
// We don't mock `filterByDeployRules` to test its actual implementation,
// since it's a simple pure function without external dependencies.

describe('preDeploy', () => {
  let originalToken: string;

  vi.mocked(coreAction.getRepositoryDefaultBranch).mockResolvedValue('main');

  // Dynamic mock values or spies
  const mockCoreInfo = vi.mocked(core.info);
  const mockGithubContext = vi.mocked(github.context);
  const mockAnalyzeAppsToDeploy = vi.mocked(analyzeAppsToDeploy);
  const mockFetchAppTenants = vi.mocked(fetchAppTenantsModule.fetchAppTenants);
  const mockFetchDeployRules = vi.mocked(
    fetchDeployRulesModule.fetchDeployRules
  );
  const spyFilterByDeployRules = vi.spyOn(
    filterByDeployRulesModule,
    'filterByDeployRules'
  );

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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        }
      ]);

      setContext('push-main-branch');
      const config = setupTest();
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: ['web', 'api'],
        appTenants: {},
        environment: 'production'
      });
      expect(mockCoreInfo).toHaveBeenCalledWith('Deploy: web');
      expect(mockCoreInfo).toHaveBeenCalledWith(
        'Skip: cms - Deployment is disabled'
      );
      expect(mockCoreInfo).toHaveBeenCalledWith('Deploy: api');
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        }
      ]);

      setContext('push-main-branch');
      const config = setupTest(); // No Infisical config
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: ['web'],
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        }
      ]);

      setContext('push-feature-branch'); // Non-deployable environment
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: ['web'],
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

    it('should fetch tenants for single app', async () => {
      mockAnalyzeAppsToDeploy.mockResolvedValue([
        {
          projectName: 'web',
          status: 'deploy',
          flyConfigFile: 'apps/web/fly.toml',
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }, { tenant: 'customer1' }]
      });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: ['web'],
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        },
        {
          projectName: 'api',
          status: 'deploy',
          flyConfigFile: 'apps/api/fly.toml',
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
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
        apps: ['web', 'api'],
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        cms: []
      });

      setContext('push-main-branch');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: ['cms'],
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        }
      ]);

      mockFetchAppTenants.mockResolvedValue({
        web: [{ tenant: 'demo' }]
      });

      setContext('pull-request');
      const config = setupTest(infisicalConfig);
      const result = await preDeploy(config, true);

      expect(result).toEqual({
        apps: ['web'],
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
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
          githubConfig: {
            deploy: true,
            flyConfig: 'fly.toml'
          }
        },
        {
          projectName: 'cms',
          status: 'deploy',
          flyConfigFile: 'apps/cms/fly.toml',
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        },
        {
          projectName: 'api',
          status: 'deploy',
          flyConfigFile: 'apps/api/fly.toml',
          githubConfig: {
            deploy: true,
            flyConfig: 'fly.toml'
          }
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
        apps: ['web', 'cms', 'api'],
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        }
      ]);

      const mockAppTenants: fetchAppTenantsModule.AppTenantsMap = {
        web: [{ tenant: 'demo' }, { tenant: 'acme' }, { tenant: 'globex' }]
      };
      const mockRules: DeployRules = { apps: '*', tenants: 'demo' };

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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
        },
        {
          projectName: 'api',
          status: 'deploy',
          flyConfigFile: 'apps/api/fly.toml',
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
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
        apps: ['web', 'api'],
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
          githubConfig: { deploy: true, flyConfig: 'fly.toml' }
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
        apps: ['web'],
        appTenants: { web: [{ tenant: 'demo' }] },
        environment: 'preview'
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
