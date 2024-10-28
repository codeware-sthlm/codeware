import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as devkit from '@nx/devkit';
import * as replaceInFile from 'replace-in-file';

import * as nxMigrateImport from './nx-migrate';
import * as addPullRequestAssignees from './utils/add-pull-request-assignees';
import * as addPullRequestLabels from './utils/add-pull-request-labels';
import * as cleanupPullRequests from './utils/cleanup-pull-requests';
import * as createOrUpdatePullRequest from './utils/create-or-update-pull-request';
import * as enablePullRequestAutoMerge from './utils/enable-pull-request-auto-merge';
import * as getNxVersionInfo from './utils/get-nx-version-info';
import * as runNxE2e from './utils/run-nx-e2e';
import * as runNxTests from './utils/run-nx-tests';
import type { ActionInputs } from './utils/types';

// Mock strategy:
// - Wrap every module/function with `jest.mock` to mock away the real implementation
// - Create a mock function using `jest.spyOn` for those functions that needs to be interacted with

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/github');
jest.mock('@nx/devkit');
jest.mock('replace-in-file');

describe('nxMigrate', () => {
  const infoMock = jest.spyOn(core, 'info');
  const execMock = jest.spyOn(exec, 'exec');
  const getExecOutputMock = jest.spyOn(exec, 'getExecOutput');
  const getPackageManagerCommandMock = jest.spyOn(
    devkit,
    'getPackageManagerCommand'
  );
  const replaceInFileMock = jest.spyOn(replaceInFile, 'replaceInFile');

  const addPullRequestAssigneesMock = jest.spyOn(
    addPullRequestAssignees,
    'addPullRequestAssignees'
  );
  const addPullRequestLabelsMock = jest.spyOn(
    addPullRequestLabels,
    'addPullRequestLabels'
  );
  const cleanupPullRequestsMock = jest.spyOn(
    cleanupPullRequests,
    'cleanupPullRequests'
  );
  const createPullRequestMock = jest.spyOn(
    createOrUpdatePullRequest,
    'createOrUpdatePullRequest'
  );
  const enablePullRequestAutoMergeMock = jest.spyOn(
    enablePullRequestAutoMerge,
    'enablePullRequestAutoMerge'
  );
  const getNxVersionInfoMock = jest.spyOn(getNxVersionInfo, 'getNxVersionInfo');
  const runNxTestsMock = jest.spyOn(runNxTests, 'runNxTests');
  const runNxE2eMock = jest.spyOn(runNxE2e, 'runNxE2e');

  const nxMigrateMock = jest.spyOn(nxMigrateImport, 'nxMigrate');
  const nxMigrate = nxMigrateImport.nxMigrate;

  /**
   * Setup test with default mock of `getNxVersionInfo`
   *
   * @param mode Nx version status mode
   * @param configOverride Additional config overrides
   * @returns Action inputs required values with optional overrides
   */
  const setupTest = (
    mode: 'up-to-date' | 'major-update' | 'minor-update',
    configOverride?: Partial<ActionInputs>
  ): ActionInputs => {
    switch (mode) {
      case 'up-to-date':
        getNxVersionInfoMock.mockResolvedValue({
          currentVersion: '1.0.0',
          latestVersion: '1.0.0',
          isMajorUpdate: false,
          isOutdated: false
        });
        break;
      case 'major-update':
        getNxVersionInfoMock.mockResolvedValue({
          currentVersion: '1.0.0',
          latestVersion: '2.0.0',
          isMajorUpdate: true,
          isOutdated: true
        });
        break;
      case 'minor-update':
        getNxVersionInfoMock.mockResolvedValue({
          currentVersion: '1.0.0',
          latestVersion: '1.0.1',
          isMajorUpdate: false,
          isOutdated: true
        });
        break;
    }

    return {
      ...{
        token: 'token',
        autoMerge: false,
        checkToken: false,
        committer: '',
        author: '',
        mainBranch: '',
        packagePatterns: [],
        prAssignees: '',
        skipE2E: false,
        dryRun: false
      },
      ...configOverride
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock default responses
    execMock.mockResolvedValue(0);
    getExecOutputMock.mockImplementation((cmd, args) => {
      if (args?.includes('write-tree')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Promise.resolve({ stdout: 'tree hash 1' } as any);
      }
      if (args?.includes('rev-parse')) {
        return Promise.resolve({ stdout: 'tree hash 2' });
      }
      return Promise.resolve({ stdout: 'whatever' });
    });
    getPackageManagerCommandMock.mockReturnValue({
      exec: 'npx',
      install: 'npm install --no-immutable'
    } as never);
    replaceInFileMock.mockResolvedValue([] as never);
    runNxE2eMock.mockResolvedValue(true);
    runNxTestsMock.mockResolvedValue(true);
  });

  describe('migrate config', () => {
    it('should get valid migrate config from only required inputs', async () => {
      const config = setupTest('up-to-date');

      expect(config).toEqual({
        author: '',
        autoMerge: false,
        checkToken: false,
        committer: '',
        dryRun: false,
        mainBranch: '',
        packagePatterns: [],
        prAssignees: '',
        skipE2E: false,
        token: 'token'
      } satisfies ActionInputs);

      await nxMigrate(config, true);
      expect(nxMigrateMock).toHaveReturned();
    });

    it('should fail migrate when token is missing', async () => {
      const config = setupTest('up-to-date', { token: '' });
      let error;
      try {
        await nxMigrate(config, true);
      } catch (e) {
        error = e;
      }
      expect(error).toContain('token is required');
    });
  });

  describe('migration responses', () => {
    it('should return status when workspace is up to date', async () => {
      const config = setupTest('up-to-date');
      const result = await nxMigrate(config, true);

      expect(result).toEqual({
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        isMajorUpdate: false,
        isMigrated: false,
        pullRequest: undefined
      });
    });

    it('should return status when workspace is up to date (dry-run)', async () => {
      const config = setupTest('up-to-date', { dryRun: true });
      const result = await nxMigrate(config, true);

      expect(result).toEqual({
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        isMajorUpdate: false,
        isMigrated: false,
        pullRequest: undefined
      });
    });

    it('should return status when workspace is minor version outdated', async () => {
      const config = setupTest('minor-update');
      const result = await nxMigrate(config, true);

      expect(result).toEqual({
        currentVersion: '1.0.0',
        latestVersion: '1.0.1',
        isMajorUpdate: false,
        isMigrated: true,
        pullRequest: 1
      });
    });

    it('should return status when workspace is minor version outdated (dry-run)', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      const result = await nxMigrate(config, true);

      expect(result).toEqual({
        currentVersion: '1.0.0',
        latestVersion: '1.0.1',
        isMajorUpdate: false,
        isMigrated: false,
        pullRequest: undefined
      });
    });

    it('should return status when workspace is major version outdated', async () => {
      const config = setupTest('major-update');
      const result = await nxMigrate(config, true);

      expect(result).toEqual({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        isMajorUpdate: true,
        isMigrated: true,
        pullRequest: 1
      });
    });

    it('should return status when workspace is major version outdated (dry-run)', async () => {
      const config = setupTest('major-update', { dryRun: true });
      const result = await nxMigrate(config, true);

      expect(result).toEqual({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        isMajorUpdate: true,
        isMigrated: false,
        pullRequest: undefined
      });
    });
  });

  describe('happy migration flows', () => {
    it('should update remote url to use token authentication', async () => {
      const config = setupTest('minor-update', { mainBranch: 'main' });
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('git', [
        'remote',
        'set-url',
        'origin',
        'https://x-access-token:token@github.com/owner/repo.git'
      ]);
    });

    it('should create feature branch from latest main commit', async () => {
      const config = setupTest('minor-update', { mainBranch: 'main' });
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('git', ['fetch', 'origin']);
      expect(exec.exec).toHaveBeenCalledWith('git', [
        'checkout',
        '-B',
        'update-nx-workspace-1.0.1',
        'origin/main'
      ]);
    });

    it('should run nx migrate', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('npx', ['nx', 'migrate', '1.0.1']);
    });

    it('should add create-nx-workspace dependency for latest version', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('npx', [
        'nx',
        'add',
        'create-nx-workspace@1.0.1'
      ]);
    });

    it('should install dependencies and allow lock file update', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('npm install --no-immutable');
    });

    it('should run migrations when migrations.json exist', async () => {
      execMock.mockResolvedValue(0);
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('npx', [
        'nx',
        'migrate',
        '--run-migrations'
      ]);
    });

    it('should not run migrations when migrations.json is missing', async () => {
      execMock.mockImplementation((cmd) =>
        Promise.resolve(cmd === 'test' ? 1 : 0)
      );
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).not.toHaveBeenCalledWith('npx', [
        'nx',
        'migrate',
        '--run-migrations'
      ]);
    });

    it('should stage changes and create and push commit', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('git', ['add', '.']);
      expect(exec.exec).toHaveBeenCalledWith('git', [
        'commit',
        '--author="actor <1+actor@users.noreply.github.com>"',
        '-m',
        'build(repo): update nx workspace to 1.0.1',
        '--no-verify'
      ]);
      expect(exec.exec).toHaveBeenCalledWith('git', [
        'push',
        '--force-with-lease',
        'origin',
        'update-nx-workspace-1.0.1'
      ]);
    });

    it('should call run nx tests function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(runNxTestsMock).toHaveBeenCalled();
    });

    it('should call run nx e2e function when nx tests pass', async () => {
      runNxTestsMock.mockResolvedValue(true);
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(runNxE2eMock).toHaveBeenCalled();
    });

    it('should not call run nx e2e function when nx tests fail', async () => {
      runNxTestsMock.mockResolvedValue(false);
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(runNxE2eMock).not.toHaveBeenCalled();
    });

    it('should discard unstaged changes', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(execMock).toHaveBeenCalledWith('git', ['checkout', '--', '.']);
    });

    it('should call create pull request function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(createPullRequestMock).toHaveBeenCalledWith(
        expect.any(Object),
        { currentVersion: '1.0.0', latestVersion: '1.0.1' },
        {
          e2ePass: true,
          testsPass: true
        }
      );
    });

    it('should call add pull request labels function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(addPullRequestLabelsMock).toHaveBeenCalledWith(
        'token',
        1,
        'nx migrate'
      );
    });

    it('should call add pull request assignees function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(addPullRequestAssigneesMock).toHaveBeenCalledWith('token', 1, []);
    });

    it('should call enable pull request auto merge function when enabled', async () => {
      const config = setupTest('minor-update', { autoMerge: true });
      await nxMigrate(config, true);

      expect(enablePullRequestAutoMergeMock).toHaveBeenCalledWith(
        'token',
        false,
        1
      );
    });

    it('should not call enable pull request auto merge function when disabled', async () => {
      const config = setupTest('minor-update', { autoMerge: false });
      await nxMigrate(config, true);

      expect(enablePullRequestAutoMergeMock).not.toHaveBeenCalled();
    });

    it('should call cleanup pull requests function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(cleanupPullRequestsMock).toHaveBeenCalledWith('token', 1);
    });
  });

  describe('skip migration', () => {
    it('should return early when workspace is up to date', async () => {
      const config = setupTest('up-to-date');
      await nxMigrate(config, true);

      expect(exec.exec).not.toHaveBeenCalledWith('git', expect.any(Array));
      expect(exec.exec).not.toHaveBeenCalledWith('npx', [
        'nx',
        expect.anything()
      ]);
    });

    it('should return early when pull request with same changes exists', async () => {
      getExecOutputMock.mockImplementation((cmd, args) => {
        if (args?.includes('write-tree')) {
          return Promise.resolve({ stdout: 'tree hash' } as any);
        }
        if (args?.includes('rev-parse')) {
          return Promise.resolve({ stdout: 'tree hash' });
        }
        return Promise.resolve({ stdout: 'whatever' });
      });
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).not.toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['commit'])
      );
    });
  });

  describe('dry-run', () => {
    it('should skip creating local branch ', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(exec.exec).not.toHaveBeenCalledWith('git', expect.any(Array));
    });

    it('should skip nx migrate and post changes', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(exec.exec).not.toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining(['nx'])
      );
      expect(exec.exec).not.toHaveBeenCalledWith(
        expect.arrayContaining(['install'])
      );
      expect(exec.exec).not.toHaveBeenCalledWith('test', expect.any(Array));
      expect(replaceInFile.replaceInFile).not.toHaveBeenCalled();
    });

    it('should not commit', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(execMock).not.toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['commit'])
      );
    });

    it('should not discard changes', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(execMock).not.toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['checkout'])
      );
    });

    it('should skip running tests', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(runNxTestsMock).not.toHaveBeenCalled();
      expect(runNxE2eMock).not.toHaveBeenCalled();
    });

    it('should skip pull request', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(createPullRequestMock).not.toHaveBeenCalled();
      expect(addPullRequestLabelsMock).not.toHaveBeenCalled();
      expect(addPullRequestAssigneesMock).not.toHaveBeenCalled();
      expect(enablePullRequestAutoMergeMock).not.toHaveBeenCalled();
      expect(cleanupPullRequestsMock).not.toHaveBeenCalled();
    });

    it(`should print 'skip' log`, async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(core.info).toHaveBeenCalledWith('Skip nx migration [dry-run]');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      // Mock error response for a function called early in the flow
      infoMock.mockImplementation(() => {
        throw new Error('error message');
      });
    });

    it('should set failed error message', async () => {
      const config = setupTest('up-to-date');
      await nxMigrate(config);

      expect(core.setFailed).toHaveBeenCalledWith('error message');
    });

    it('should return empty object', async () => {
      const config = setupTest('up-to-date');
      const result = await nxMigrate(config);

      expect(result).toEqual({});
    });

    it('should not passthough exceptions by default', async () => {
      const config = setupTest('up-to-date');

      await nxMigrate(config);
      expect(nxMigrateMock).toHaveReturned();
    });

    it('should passthough exceptions', async () => {
      const config = setupTest('up-to-date');

      let error;
      let result;

      try {
        result = await nxMigrate(config, true);
      } catch (e) {
        error = e;
      }

      expect(error).toBe('error message');
      expect(result).toBeUndefined();
    });
  });
});
