import * as exec from '@actions/exec';
import { vol } from 'memfs';

import { analyzeAppsToDeploy } from './analyze-apps-to-deploy';

/**
 * Integration tests for `analyzeAppsToDeploy` function.
 *
 * These tests verify the real behavior of analyzeAppsToDeploy without mocking
 * its internal dependencies (getNxApps, getNxProject, file system operations).
 * This ensures the complete workflow from Nx workspace queries to deployment
 * decisions works correctly.
 */

// Mock the file system to create a controlled test environment
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

// Mock exec for Nx CLI commands
vi.mock('@actions/exec');

describe('analyzeAppsToDeploy - Integration', () => {
  const mockGetExecOutput = vi.mocked(exec.getExecOutput);

  /**
   * Helper to create a mock Nx workspace structure
   */
  const createWorkspace = (
    projects: {
      name: string;
      root: string;
      hasGithubJson?: boolean;
      githubConfig?: Record<string, unknown>;
      hasFlyToml?: boolean;
    }[]
  ) => {
    const files: Record<string, string> = {};

    for (const project of projects) {
      // Create github.json if specified
      if (project.hasGithubJson) {
        const githubConfig = project.githubConfig || {
          deploy: true,
          flyConfig: 'fly.toml'
        };
        files[`/${project.root}/github.json`] = JSON.stringify(githubConfig);
      }

      // Create fly.toml if specified
      if (project.hasFlyToml) {
        files[`/${project.root}/fly.toml`] = `app = "${project.name}"`;
      }
    }

    vol.fromJSON(files);
  };

  /**
   * Mock getNxApps response (affected apps)
   */
  const mockAffectedApps = (appNames: string[]) => {
    mockGetExecOutput.mockImplementation(async (command, args) => {
      const argsStr = args?.join(' ') || '';

      // Mock: nx show projects --type app --affected --json
      if (argsStr.includes('show projects') && argsStr.includes('--affected')) {
        return {
          exitCode: 0,
          stdout: JSON.stringify(appNames),
          stderr: ''
        };
      }

      throw new Error(`Unexpected exec call: ${command} ${argsStr}`);
    });
  };

  /**
   * Mock getNxProject response for a specific project
   */
  const mockNxProject = (projects: { name: string; root: string }[]) => {
    mockGetExecOutput.mockImplementation(async (command, args) => {
      const argsStr = args?.join(' ') || '';

      // Mock: nx show projects --type app --affected --json
      if (argsStr.includes('show projects') && argsStr.includes('--affected')) {
        return {
          exitCode: 0,
          stdout: JSON.stringify(projects.map((p) => p.name)),
          stderr: ''
        };
      }

      // Mock: nx show project <name> --json
      if (argsStr.includes('show project')) {
        const projectName = args?.find(
          (arg, idx) => args[idx - 1] === 'project'
        );
        const project = projects.find((p) => p.name === projectName);

        if (project) {
          return {
            exitCode: 0,
            stdout: JSON.stringify({
              name: project.name,
              root: project.root,
              sourceRoot: `${project.root}/src`
            }),
            stderr: ''
          };
        }
      }

      throw new Error(`Unexpected exec call: ${command} ${argsStr}`);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vol.reset();
    process.cwd = () => '/';
  });

  afterEach(() => {
    vol.reset();
  });

  describe('successful deployment scenarios', () => {
    it('should return apps ready for deployment when all conditions are met', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'web',
          root: 'apps/web',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: true
        },
        {
          name: 'cms',
          root: 'apps/cms',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: true
        }
      ]);

      mockNxProject([
        { name: 'web', root: 'apps/web' },
        { name: 'cms', root: 'apps/cms' }
      ]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        projectName: 'web',
        status: 'deploy',
        flyConfigFile: 'apps/web/fly.toml',
        githubConfig: { deploy: true, flyConfig: 'fly.toml' }
      });
      expect(result[1]).toMatchObject({
        projectName: 'cms',
        status: 'deploy',
        flyConfigFile: 'apps/cms/fly.toml',
        githubConfig: { deploy: true, flyConfig: 'fly.toml' }
      });
    });

    it('should handle single app deployment', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'api',
          root: 'apps/api',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: true
        }
      ]);

      mockNxProject([{ name: 'api', root: 'apps/api' }]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectName: 'api',
        status: 'deploy'
      });
    });

    it('should handle custom fly config file name', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'web',
          root: 'apps/web',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'custom-fly.toml' },
          hasFlyToml: false
        }
      ]);

      // Create custom fly config
      vol.fromJSON({
        '/apps/web/custom-fly.toml': 'app = "web-custom"'
      });

      mockNxProject([{ name: 'web', root: 'apps/web' }]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectName: 'web',
        status: 'deploy',
        flyConfigFile: 'apps/web/custom-fly.toml'
      });
    });
  });

  describe('skip scenarios - missing configuration', () => {
    it('should skip app when github.json is missing', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'web',
          root: 'apps/web',
          hasGithubJson: false,
          hasFlyToml: true
        }
      ]);

      mockNxProject([{ name: 'web', root: 'apps/web' }]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectName: 'web',
        status: 'skip',
        reason: 'github.json not found for the project'
      });
    });

    it('should skip app when fly config file is missing', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'web',
          root: 'apps/web',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: false
        }
      ]);

      mockNxProject([{ name: 'web', root: 'apps/web' }]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectName: 'web',
        status: 'skip',
        reason: 'Fly config file not found: apps/web/fly.toml'
      });
    });

    it('should skip app when Nx project config not found', async () => {
      // Arrange
      mockGetExecOutput.mockImplementation(async (command, args) => {
        const argsStr = args?.join(' ') || '';

        // Mock: nx show projects --type app --affected --json
        if (
          argsStr.includes('show projects') &&
          argsStr.includes('--affected')
        ) {
          return {
            exitCode: 0,
            stdout: JSON.stringify(['nonexistent']),
            stderr: ''
          };
        }

        // Mock: nx show project fails
        if (argsStr.includes('show project')) {
          return {
            exitCode: 0,
            stdout: JSON.stringify({
              name: 'wrong-name', // Mismatched name
              root: 'apps/nonexistent'
            }),
            stderr: ''
          };
        }

        throw new Error(`Unexpected exec call: ${command} ${argsStr}`);
      });

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectName: 'nonexistent',
        status: 'skip',
        reason: 'Nx project configuration not found'
      });
    });
  });

  describe('skip scenarios - configuration validation', () => {
    it('should skip app when deploy is disabled in github.json', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'web',
          root: 'apps/web',
          hasGithubJson: true,
          githubConfig: { deploy: false, flyConfig: 'fly.toml' },
          hasFlyToml: true
        }
      ]);

      mockNxProject([{ name: 'web', root: 'apps/web' }]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectName: 'web',
        status: 'skip',
        reason: 'Deployment is disabled in github.json for the project'
      });
    });

    it('should skip app when github.json has invalid schema', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'web',
          root: 'apps/web',
          hasGithubJson: true,
          githubConfig: { invalid: 'config' }, // Missing required fields
          hasFlyToml: true
        }
      ]);

      mockNxProject([{ name: 'web', root: 'apps/web' }]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('skip');
      if (result[0].status === 'skip') {
        expect(result[0].reason).toContain('Invalid github.json');
      }
    });

    it('should handle github.json with malformed JSON', async () => {
      // Arrange
      vol.fromJSON({
        '/apps/web/github.json': '{ invalid json }'
      });

      mockNxProject([{ name: 'web', root: 'apps/web' }]);

      // Act & Assert
      await expect(analyzeAppsToDeploy()).rejects.toThrow();
    });
  });

  describe('mixed scenarios', () => {
    it('should return mixed results when some apps deploy and some skip', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'web',
          root: 'apps/web',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: true
        },
        {
          name: 'cms',
          root: 'apps/cms',
          hasGithubJson: true,
          githubConfig: { deploy: false, flyConfig: 'fly.toml' },
          hasFlyToml: true
        },
        {
          name: 'api',
          root: 'apps/api',
          hasGithubJson: false,
          hasFlyToml: true
        }
      ]);

      mockNxProject([
        { name: 'web', root: 'apps/web' },
        { name: 'cms', root: 'apps/cms' },
        { name: 'api', root: 'apps/api' }
      ]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        projectName: 'web',
        status: 'deploy'
      });
      expect(result[1]).toMatchObject({
        projectName: 'cms',
        status: 'skip',
        reason: 'Deployment is disabled in github.json for the project'
      });
      expect(result[2]).toMatchObject({
        projectName: 'api',
        status: 'skip',
        reason: 'github.json not found for the project'
      });
    });

    it('should return empty array when no apps are affected', async () => {
      // Arrange
      mockAffectedApps([]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toEqual([]);
    });

    it('should process apps in order', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'app-a',
          root: 'apps/app-a',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: true
        },
        {
          name: 'app-b',
          root: 'apps/app-b',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: true
        },
        {
          name: 'app-c',
          root: 'apps/app-c',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: true
        }
      ]);

      mockNxProject([
        { name: 'app-a', root: 'apps/app-a' },
        { name: 'app-b', root: 'apps/app-b' },
        { name: 'app-c', root: 'apps/app-c' }
      ]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result.map((r) => r.projectName)).toEqual([
        'app-a',
        'app-b',
        'app-c'
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle nested project directories', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'nested-app',
          root: 'apps/nested/deep/app',
          hasGithubJson: true,
          githubConfig: { deploy: true, flyConfig: 'fly.toml' },
          hasFlyToml: true
        }
      ]);

      mockNxProject([{ name: 'nested-app', root: 'apps/nested/deep/app' }]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectName: 'nested-app',
        status: 'deploy',
        flyConfigFile: 'apps/nested/deep/app/fly.toml'
      });
    });

    it('should handle github.json with extra properties', async () => {
      // Arrange
      createWorkspace([
        {
          name: 'web',
          root: 'apps/web',
          hasGithubJson: true,
          githubConfig: {
            deploy: true,
            flyConfig: 'fly.toml',
            extraProperty: 'value',
            anotherExtra: { nested: 'object' }
          },
          hasFlyToml: true
        }
      ]);

      mockNxProject([{ name: 'web', root: 'apps/web' }]);

      // Act
      const result = await analyzeAppsToDeploy();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        projectName: 'web',
        status: 'deploy'
      });
    });
  });
});
