/**
 * Unit tests for the action's main functionality.
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core';

import * as main from './main';
import * as nxMigrate from './nx-migrate';
import type { ActionInputs, ActionOutputs } from './utils/types';

jest.mock('@actions/core');
jest.mock('./nx-migrate');

describe('main', () => {
  const getBooleanInputMock = jest.spyOn(core, 'getBooleanInput');
  const getInputMock = jest.spyOn(core, 'getInput');
  const getMultilineInputMock = jest.spyOn(core, 'getMultilineInput');
  const setFailedMock = jest.spyOn(core, 'setFailed');
  const setOutputMock = jest.spyOn(core, 'setOutput');

  const runMock = jest.spyOn(main, 'run');
  const nxMigrateMock = jest.spyOn(nxMigrate, 'nxMigrate');

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock values
    getInputMock.mockReturnValue('');
    getBooleanInputMock.mockReturnValue(false);
    getMultilineInputMock.mockReturnValue([]);
  });

  it('should run without exceptions', async () => {
    await main.run();
    expect(runMock).toHaveReturned();
  });

  it('should print inputs debug information', async () => {
    await main.run();
    expect(core.debug).toHaveBeenCalled();
  });

  it('should call nxMigrate with inputs', async () => {
    getInputMock.mockImplementation((name: string) => {
      switch (name) {
        case 'token':
          return 'token';
        case 'auto-merge':
          return 'true';
        case 'committer':
          return 'committer';
        case 'author':
          return 'author';
        case 'main-branch':
          return 'main-branch';
        case 'pull-request-assignees':
          return 'user1,user2';
        default:
          return '';
      }
    });
    getBooleanInputMock.mockImplementation((name: string) => {
      switch (name) {
        case 'auto-merge':
          return true;
        case 'dry-run':
          return true;
        default:
          return false;
      }
    });
    getMultilineInputMock.mockImplementation((name) => {
      switch (name) {
        case 'package-patterns':
          return ['packages/apps/**/package.json'];
        default:
          return [];
      }
    });

    await main.run();

    expect(nxMigrateMock).toHaveBeenCalledWith({
      token: 'token',
      autoMerge: true,
      committer: 'committer',
      author: 'author',
      mainBranch: 'main-branch',
      packagePatterns: ['packages/apps/**/package.json'],
      prAssignees: 'user1,user2',
      dryRun: true
    } satisfies ActionInputs);
  });

  it('should set outputs', async () => {
    nxMigrateMock.mockResolvedValue({
      currentVersion: '1.0.0',
      isMajorUpdate: false,
      isMigrated: true,
      latestVersion: '1.0.1',
      pullRequest: 1
    } satisfies ActionOutputs);
    await main.run();

    expect(setOutputMock).toHaveBeenCalledWith('current-version', '1.0.0');
    expect(setOutputMock).toHaveBeenCalledWith('latest-version', '1.0.1');
    expect(setOutputMock).toHaveBeenCalledWith('is-major-update', false);
    expect(setOutputMock).toHaveBeenCalledWith('is-migrated', true);
    expect(setOutputMock).toHaveBeenCalledWith('pull-request', 1);
  });

  it('should handle errors', async () => {
    const error = new Error('error message');
    nxMigrateMock.mockRejectedValue(error);

    await main.run();
    expect(setFailedMock).toHaveBeenCalledWith('error message');
  });
});
