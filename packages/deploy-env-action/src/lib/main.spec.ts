/**
 * Unit tests for the action's main functionality.
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core';

import * as flyEnvironment from './fly-environment';
import * as main from './main';
import type { ActionInputs, ActionOutputs } from './utils/types';

vi.mock('@actions/core');
vi.mock('./fly-environment');

describe('main', () => {
  const getInputMock = vi.spyOn(core, 'getInput');
  const setFailedMock = vi.spyOn(core, 'setFailed');
  const setOutputMock = vi.spyOn(core, 'setOutput');

  const runMock = vi.spyOn(main, 'run');
  const flyEnvironmentMock = vi.spyOn(flyEnvironment, 'flyEnvironment');

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock values
    getInputMock.mockReturnValue('');
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
    getInputMock.mockImplementation((name: string) => name);
    await main.run();

    expect(flyEnvironmentMock).toHaveBeenCalledWith({
      mainBranch: 'main-branch',
      token: 'token'
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should have valid inputs with no inputs provided', async () => {
    await main.run();

    expect(flyEnvironmentMock).toHaveBeenCalledWith({
      mainBranch: '',
      token: ''
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should set outputs', async () => {
    const result: ActionOutputs = {
      environment: 'preview'
    };
    flyEnvironmentMock.mockResolvedValue(result);
    await main.run();

    expect(setOutputMock).toHaveBeenCalledWith('environment', 'preview');
  });

  it('should handle errors', async () => {
    const error = new Error('error message');
    flyEnvironmentMock.mockRejectedValue(error);

    await main.run();
    expect(setFailedMock).toHaveBeenCalledWith('error message');
  });
});
