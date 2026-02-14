/**
 * Unit tests for the action's main functionality.
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core';

import * as flyDeployment from './fly-deployment';
import * as main from './main';
import type { ActionInputs } from './schemas/action-inputs.schema';
import type { ActionOutputs } from './schemas/action-outputs.schema';

vi.mock('@homebridge/node-pty-prebuilt-multiarch', () => ({
  spawn: vi.fn()
}));
vi.mock('@actions/core');
vi.mock('./fly-deployment');

describe('main', () => {
  const getBooleanInputMock = vi.spyOn(core, 'getBooleanInput');
  const getInputMock = vi.spyOn(core, 'getInput');
  const getMultilineInputMock = vi.spyOn(core, 'getMultilineInput');
  const setFailedMock = vi.spyOn(core, 'setFailed');
  const setOutputMock = vi.spyOn(core, 'setOutput');

  const runMock = vi.spyOn(main, 'run');
  const flyDeploymentMock = vi.spyOn(flyDeployment, 'flyDeployment');

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock values
    getBooleanInputMock.mockImplementation(() => true);
    getInputMock.mockImplementation((name: string) => {
      if (name === 'apps') return '';
      if (name === 'app-details') return '{}';
      if (name === 'environment') return '';
      return name;
    });
    getMultilineInputMock.mockImplementation(() => []);
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
    getInputMock.mockImplementation((name: string) => {
      if (name === 'apps') return '["app1","app2"]';
      if (name === 'app-details')
        return '{"web":[{"tenant":"t1","secrets":{"KEY":"val"}}]}';
      if (name === 'environment') return '';
      return name;
    });
    await main.run();

    expect(flyDeploymentMock).toHaveBeenCalledWith({
      appDetails: { web: [{ tenant: 't1', secrets: { KEY: 'val' } }] },
      apps: ['app1', 'app2'],
      buildArgs: [],
      env: [],
      environment: undefined,
      flyApiToken: 'fly-api-token',
      flyOrg: 'fly-org',
      flyRegion: 'fly-region',
      flyTraceCli: true,
      flyConsoleLogs: true,
      mainBranch: 'main-branch',
      optOutDepotBuilder: true,
      secrets: [],
      token: 'token'
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should have valid inputs with only required inputs provided', async () => {
    getInputMock.mockImplementation((name: string) => {
      switch (name) {
        case 'token':
          return name;
        default:
          return '';
      }
    });
    await main.run();

    expect(flyDeploymentMock).toHaveBeenCalledWith({
      apps: undefined,
      appDetails: {},
      buildArgs: [],
      env: [],
      environment: undefined,
      flyApiToken: '',
      flyOrg: '',
      flyRegion: '',
      flyTraceCli: true,
      flyConsoleLogs: true,
      mainBranch: '',
      optOutDepotBuilder: true,
      secrets: [],
      token: 'token'
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should have invalid inputs with missing required inputs', async () => {
    getInputMock.mockReturnValue('');
    await main.run();

    expect(setFailedMock).toHaveBeenCalled();
  });

  it('should set outputs', async () => {
    const result: ActionOutputs = {
      environment: 'preview',
      projects: [
        // Mixing actions is not valid use case, but here it's just for type checking
        {
          action: 'deploy',
          app: 'app-one-app',
          name: 'app-one',
          url: 'one.preview.io'
        },
        {
          action: 'deploy',
          app: 'app-two-app',
          name: 'app-two',
          url: 'two.preview.io'
        },
        { action: 'destroy', app: 'api-one-app' },
        { action: 'destroy', app: 'api-two-app' },
        {
          action: 'failed',
          appOrProject: 'web-two',
          error: 'deployment error'
        },
        { action: 'skip', appOrProject: 'web-one', reason: 'outdated' }
      ]
    };
    flyDeploymentMock.mockResolvedValue(result);
    await main.run();

    expect(setOutputMock).toHaveBeenCalledWith('environment', 'preview');
    expect(setOutputMock).toHaveBeenCalledWith('deployed', {
      'app-one': 'one.preview.io',
      'app-two': 'two.preview.io'
    });
    expect(setOutputMock).toHaveBeenCalledWith('destroyed', [
      'api-one-app',
      'api-two-app'
    ]);
    expect(setOutputMock).toHaveBeenCalledWith('skipped', ['web-one']);
    expect(setOutputMock).toHaveBeenCalledWith('failed', ['web-two']);

    expect(setFailedMock).toHaveBeenCalledWith(
      'Deployment failed for 1 project(s):\nweb-two: deployment error'
    );
  });

  it('should handle errors', async () => {
    getInputMock.mockImplementation((name: string) => {
      if (name === 'apps') return '';
      if (name === 'app-details') return '{}';
      if (name === 'environment') return '';
      return name;
    });
    const error = new Error('error message');
    flyDeploymentMock.mockRejectedValue(error);

    await main.run();
    expect(setFailedMock).toHaveBeenCalledWith('error message');
  });
});
