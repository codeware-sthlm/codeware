import { dockerBuild, logError } from '@codeware/core';
import {
  ensureCleanupDockerContainers,
  ensureCreateNxWorkspaceProject,
  ensureDockerConnectToLocalRegistry,
  resetDocker,
  waitForDockerLogMatch
} from '@codeware/e2e/utils';
import { checkFilesExist, runNxCommand, tmpProjPath } from '@nx/plugin/testing';
import { agent } from 'supertest';

describe('Test Dockerfile and related targets', () => {
  let appName: string;

  jest.setTimeout(1000_000);

  beforeAll(async () => {
    const project = await ensureCreateNxWorkspaceProject({
      preset: '@cdwr/nx-payload'
    });
    appName = project.appName;

    ensureDockerConnectToLocalRegistry(appName);
    await ensureCleanupDockerContainers();
  });

  afterAll(async () => {
    await resetDocker(appName);
    runNxCommand('reset', { silenceError: true });
  });

  it('should hava a Dockerfile', async () => {
    expect(() => checkFilesExist(`apps/${appName}/Dockerfile`)).not.toThrow();
  });

  it('should build image with node', async () => {
    let error = null;
    try {
      await dockerBuild(
        {
          context: tmpProjPath(),
          dockerfile: `apps/${appName}/Dockerfile`,
          name: appName,
          tag: 'e2e'
        },
        true
      );
    } catch (err) {
      logError('Failed to build docker image', err.message);
      error = err;
    }

    expect(error).toBeNull();
  });

  it(`should build image with 'dx:docker-build' target`, () => {
    const result = runNxCommand('dx:docker-build');
    expect(result).toContain('Successfully ran target dx:docker-build');
  });

  it('should start application and navigate to first page', async () => {
    const startLog = runNxCommand('dx:start');
    expect(startLog).toContain('Successfully ran target dx:start');

    await waitForDockerLogMatch({
      containerName: appName,
      matchString: 'Using DB adapter',
      timeoutSeconds: 10
    });

    const startResponse = await agent('http://localhost:3000').get('/');
    expect(startResponse.status).toBe(302);
    expect(startResponse.headers['location']).toBe('/admin');

    // Shut down
    const stopLog = runNxCommand('dx:stop');
    expect(stopLog).toContain('Successfully ran target dx:stop');

    let stopCode: string;
    try {
      await agent('http://localhost:3000').get('/');
    } catch (error) {
      stopCode = error['code'];
    }
    expect(stopCode).toBe('ECONNREFUSED');
  });
});
