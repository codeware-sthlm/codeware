import * as core from '@actions/core';
import * as github from '@actions/github';
import * as coreAction from '@codeware/core/actions';

import { flyEnvironment } from './fly-environment';
import type { ActionInputs } from './utils/types';

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

describe('flyEnvironment', () => {
  let originalToken: string;

  vi.mocked(coreAction.getRepositoryDefaultBranch).mockResolvedValue('main');

  // Dynamic mock values or spies
  const mockCoreInfo = vi.mocked(core.info);
  const mockGithubContext = vi.mocked(github.context);

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
  const setupTest = (configOverride?: Partial<ActionInputs>): ActionInputs => {
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
  });

  it('should get valid migrate config from no inputs', async () => {
    const config = setupTest();

    expect(async () => await flyEnvironment(config, true)).not.toThrow();
  });

  it('should return preview for pull request', async () => {
    setContext('pull-request');
    const config = setupTest();
    const result = await flyEnvironment(config, true);

    expect(result).toEqual({
      environment: 'preview'
    });
  });

  it('should return production for push to main branch', async () => {
    setContext('push-main-branch');
    const config = setupTest();
    const result = await flyEnvironment(config, true);

    expect(result).toEqual({ environment: 'production' });
  });

  it('should return empty for push to feature branch', async () => {
    setContext('push-feature-branch');
    const config = setupTest();
    const result = await flyEnvironment(config, true);

    expect(result).toEqual({ environment: '' });
  });

  it('should return empty for other events', async () => {
    setContext('tag');
    const config = setupTest();
    const result = await flyEnvironment(config, true);

    expect(result).toEqual({ environment: '' });
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
      await flyEnvironment(config);

      expect(core.setFailed).toHaveBeenCalledWith('error message');
    });

    it('should return empty object', async () => {
      const config = setupTest();
      const result = await flyEnvironment(config);

      expect(result).toEqual({});
    });

    it('should not passthough exceptions by default', async () => {
      const config = setupTest();

      expect(async () => await flyEnvironment(config)).not.toThrow();
    });

    it('should passthough exceptions', async () => {
      const config = setupTest();

      let error;
      let result;

      try {
        result = await flyEnvironment(config, true);
      } catch (e) {
        error = e;
      }

      expect(error).toBe('error message');
      expect(result).toBeUndefined();
    });
  });
});
