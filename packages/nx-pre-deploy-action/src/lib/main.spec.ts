/**
 * Unit tests for the action's main functionality.
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core';

import * as main from './main';
import * as preDeploy from './pre-deploy';
import type { ActionInputs } from './schemas/action-inputs.schema';
import type { ActionOutputs } from './schemas/action-outputs.schema';

vi.mock('@actions/core');
vi.mock('./pre-deploy');

describe('main', () => {
  const exportVariableMock = vi.spyOn(core, 'exportVariable');
  const getInputMock = vi.spyOn(core, 'getInput');
  const setFailedMock = vi.spyOn(core, 'setFailed');
  const setOutputMock = vi.spyOn(core, 'setOutput');

  const runMock = vi.spyOn(main, 'run');
  const preDeployMock = vi.spyOn(preDeploy, 'preDeploy');

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
    getInputMock.mockImplementation((name: string) => {
      if (name === 'infisical-site') return 'eu';
      if (name === 'manual-environment') return 'production';
      if (name === 'pr-number') return '467';
      return name;
    });
    await main.run();

    expect(preDeployMock).toHaveBeenCalledWith({
      mainBranch: 'main-branch',
      token: 'token',
      infisicalClientId: 'infisical-client-id',
      infisicalClientSecret: 'infisical-client-secret',
      infisicalProjectId: 'infisical-project-id',
      infisicalSite: 'eu',
      prNumber: '467',
      manualApp: 'manual-app',
      manualTenant: 'manual-tenant',
      manualEnvironment: 'production'
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should have valid inputs with no inputs provided', async () => {
    await main.run();

    expect(preDeployMock).toHaveBeenCalledWith({
      mainBranch: '',
      token: '',
      infisicalClientId: undefined,
      infisicalClientSecret: undefined,
      infisicalProjectId: undefined,
      infisicalSite: undefined,
      prNumber: undefined,
      manualApp: undefined,
      manualTenant: undefined,
      manualEnvironment: undefined
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should have valid inputs with manual override inputs provided', async () => {
    getInputMock.mockImplementation((name: string) => {
      if (name === 'manual-app') return 'web';
      if (name === 'manual-tenant') return 'acme';
      if (name === 'manual-environment') return 'production';
      return '';
    });
    await main.run();

    expect(preDeployMock).toHaveBeenCalledWith({
      mainBranch: '',
      token: '',
      infisicalClientId: undefined,
      infisicalClientSecret: undefined,
      infisicalProjectId: undefined,
      infisicalSite: undefined,
      prNumber: undefined,
      manualApp: 'web',
      manualTenant: 'acme',
      manualEnvironment: 'production'
    } satisfies ActionInputs);
    expect(runMock).toHaveReturned();
  });

  it('should reject a non-numeric pr-number', async () => {
    getInputMock.mockImplementation((name: string) =>
      name === 'pr-number' ? 'not-a-number' : ''
    );
    await main.run();

    expect(preDeployMock).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalled();
  });

  it('should set the environment variable', async () => {
    const result: ActionOutputs = {
      apps: [],
      appTenants: {},
      environment: 'preview'
    };
    preDeployMock.mockResolvedValue(result);
    await main.run();

    expect(exportVariableMock).toHaveBeenCalledWith('DEPLOY_ENV', 'preview');
  });

  it('should set the environment variable', async () => {
    const result: ActionOutputs = {
      apps: [],
      appTenants: {},
      environment: 'preview'
    };
    preDeployMock.mockResolvedValue(result);
    await main.run();

    expect(exportVariableMock).toHaveBeenCalledWith('DEPLOY_ENV', 'preview');
  });

  it('should set outputs', async () => {
    const apps: ActionOutputs['apps'] = [
      {
        name: 'app1',
        flyConfigFile: 'apps/app1/fly.toml',
        githubConfig: {},
        version: '1.0.0',
        previousVersion: '0.9.0'
      },
      {
        name: 'app2',
        flyConfigFile: 'apps/app2/fly.toml',
        githubConfig: {},
        version: '1.0.0',
        previousVersion: '0.9.0'
      }
    ];
    const result: ActionOutputs = {
      apps,
      appTenants: { app1: [{ tenant: 'tenant1' }], app2: [] },
      environment: 'preview'
    };
    preDeployMock.mockResolvedValue(result);
    await main.run();

    expect(setOutputMock).toHaveBeenCalledWith('apps', JSON.stringify(apps));
    expect(setOutputMock).toHaveBeenCalledWith('environment', 'preview');
    expect(setOutputMock).toHaveBeenCalledWith(
      'app-tenants',
      JSON.stringify({ app1: [{ tenant: 'tenant1' }], app2: [] })
    );
  });

  it('should handle errors', async () => {
    const error = new Error('error message');
    preDeployMock.mockRejectedValue(error);

    await main.run();
    expect(setFailedMock).toHaveBeenCalledWith('error message');
  });
});
