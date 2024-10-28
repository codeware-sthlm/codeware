import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as devkit from '@nx/devkit';

import * as nxMigrateImport from './nx-migrate';
import * as addPullRequestAssignees from './utils/add-pull-request-assignees';
import * as addPullRequestLabels from './utils/add-pull-request-labels';
import * as cleanupPullRequests from './utils/cleanup-pull-requests';
import * as createMigrationGitCommit from './utils/create-migration-git-commit';
import * as createPullRequest from './utils/create-pull-request';
import * as enablePullRequestAutoMerge from './utils/enable-pull-request-auto-merge';
import * as getNxVersionInfo from './utils/get-nx-version-info';
import * as revertToLatestGitCommit from './utils/revert-to-latest-git-commit';
import * as runNxE2e from './utils/run-nx-e2e';
import * as runNxTests from './utils/run-nx-tests';
import type { ActionInputs } from './utils/types';
import * as updatePackageVersions from './utils/update-package-versions';

// Mock strategy:
// - Wrap every module/function with `jest.mock` to mock away the real implementation
// - Create a mock function using `jest.spyOn` for those functions that needs to be interacted with

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/github');
jest.mock('@nx/devkit');

describe('nxMigrate', () => {
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
  const createMigrationGitCommitMock = jest.spyOn(
    createMigrationGitCommit,
    'createMigrationGitCommit'
  );
  const createPullRequestMock = jest.spyOn(
    createPullRequest,
    'createPullRequest'
  );
  const enablePullRequestAutoMergeMock = jest.spyOn(
    enablePullRequestAutoMerge,
    'enablePullRequestAutoMerge'
  );
  const execMock = jest.spyOn(exec, 'exec');
  const getNxVersionInfoMock = jest.spyOn(getNxVersionInfo, 'getNxVersionInfo');
  const getPackageManagerCommandMock = jest.spyOn(
    devkit,
    'getPackageManagerCommand'
  );
  const revertToLatestGitCommitMock = jest.spyOn(
    revertToLatestGitCommit,
    'revertToLatestGitCommit'
  );
  const runNxTestsMock = jest.spyOn(runNxTests, 'runNxTests');
  const runNxE2eMock = jest.spyOn(runNxE2e, 'runNxE2e');
  const updatePackageVersionsMock = jest.spyOn(
    updatePackageVersions,
    'updatePackageVersions'
  );

  const nxMigrateMock = jest.spyOn(nxMigrateImport, 'nxMigrate');
  const nxMigrate = nxMigrateImport.nxMigrate;

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
        committer: 'Committer <c.user@domain.io>',
        author: 'Author <a.user@domain.io>',
        mainBranch: 'main-branch',
        packagePatterns: ['packages/**/package.json'],
        prAssignees: 'user1,user2',
        dryRun: false
      },
      ...configOverride
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock default responses
    execMock.mockResolvedValue(0);
    getPackageManagerCommandMock.mockReturnValue({ exec: 'npx' } as never);
    runNxE2eMock.mockResolvedValue(true);
    runNxTestsMock.mockResolvedValue(true);
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
    it('should create a local branch', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('git', [
        'checkout',
        '-b',
        'update-nx-workspace-1.0.1'
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
        'add',
        'create-nx-workspace@1.0.1'
      ]);
    });

    it('should install dependencies and allow lock file update', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(exec.exec).toHaveBeenCalledWith('npx', [
        'install',
        '--no-immutable'
      ]);
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

    it('should call update package versions function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(updatePackageVersionsMock).toHaveBeenCalledWith('1.0.1', [
        'packages/**/package.json'
      ]);
    });

    it('should call create migration commit function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(createMigrationGitCommitMock).toHaveBeenCalledWith(
        { name: 'Author', email: 'a.user@domain.io' },
        { name: 'Committer', email: 'c.user@domain.io' },
        '1.0.1'
      );
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

    it('should call revert to latest git commit function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(revertToLatestGitCommitMock).toHaveBeenCalled();
    });

    it('should call create pull request function', async () => {
      const config = setupTest('minor-update');
      await nxMigrate(config, true);

      expect(createPullRequestMock).toHaveBeenCalledWith(
        'token',
        'main-branch',
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

      expect(addPullRequestAssigneesMock).toHaveBeenCalledWith('token', 1, [
        'user1',
        'user2'
      ]);
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

  describe('edge cases', () => {
    it('should return early if workspace is up to date', async () => {
      const config = setupTest('up-to-date');
      await nxMigrate(config, true);

      expect(exec.exec).not.toHaveBeenCalledWith('git', expect.any(Array));
      expect(exec.exec).not.toHaveBeenCalledWith('npx', [
        'nx',
        expect.anything()
      ]);
    });

    it('should skip creating local branch in dry-run mode', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(exec.exec).not.toHaveBeenCalledWith('git', expect.any(Array));
    });

    it('should skip nx migrate and post changes in dry-run mode', async () => {
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
      expect(updatePackageVersionsMock).not.toHaveBeenCalled();
    });

    it('should skip migration commit in dry-run mode', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(createMigrationGitCommitMock).not.toHaveBeenCalled();
      expect(revertToLatestGitCommitMock).not.toHaveBeenCalled();
    });

    it('should skip running tests in dry-run mode', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(runNxTestsMock).not.toHaveBeenCalled();
      expect(runNxE2eMock).not.toHaveBeenCalled();
    });

    it('should skip pull request in dry-run mode', async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(createPullRequestMock).not.toHaveBeenCalled();
      expect(addPullRequestLabelsMock).not.toHaveBeenCalled();
      expect(addPullRequestAssigneesMock).not.toHaveBeenCalled();
      expect(enablePullRequestAutoMergeMock).not.toHaveBeenCalled();
      expect(cleanupPullRequestsMock).not.toHaveBeenCalled();
    });

    it(`should print 'skip' logs in dry-run mode`, async () => {
      const config = setupTest('minor-update', { dryRun: true });
      await nxMigrate(config, true);

      expect(core.info).toHaveBeenNthCalledWith(
        1,
        'Skip nx migration [dry-run]'
      );
      expect(core.info).toHaveBeenNthCalledWith(2, 'Skip tests [dry-run]');
      expect(core.info).toHaveBeenLastCalledWith('Skip pull request [dry-run]');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      getPackageManagerCommandMock.mockImplementation(() => {
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
