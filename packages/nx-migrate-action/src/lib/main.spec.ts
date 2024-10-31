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
    getBooleanInputMock.mockImplementation(() => true);
    getInputMock.mockImplementation((name: string) => name);
    getMultilineInputMock.mockImplementation((name: string) => [name]);
  });

  it('should run without exceptions', async () => {
    await main.run();
    expect(runMock).toHaveReturned();
  });

  it('should print inputs debug information', async () => {
    await main.run();
    expect(core.debug).toHaveBeenCalled();
  });

  it('should have valid inputs with all inputs provided truthly', async () => {
    await main.run();

    expect(nxMigrateMock).toHaveBeenCalledWith({
      token: 'token',
      autoMerge: true,
      checkToken: true,
      committer: 'committer',
      author: 'author',
      mainBranch: 'main-branch',
      packagePatterns: ['package-patterns'],
      prAssignees: 'pull-request-assignees',
      dryRun: true
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should have valid inputs with only token provided', async () => {
    getInputMock.mockImplementation((name: string) => {
      switch (name) {
        case 'token':
          return 'token';
        default:
          return '';
      }
    });
    getBooleanInputMock.mockImplementation(() => false);
    getMultilineInputMock.mockImplementation(() => []);
    await main.run();

    expect(nxMigrateMock).toHaveBeenCalledWith({
      token: 'token',
      autoMerge: false,
      checkToken: false,
      committer: '',
      author: '',
      mainBranch: '',
      packagePatterns: [],
      prAssignees: '',
      dryRun: false
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should have invalid inputs with missing required inputs', async () => {
    getInputMock.mockReturnValue('');
    await main.run();

    expect(setFailedMock).toHaveBeenCalled();
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
