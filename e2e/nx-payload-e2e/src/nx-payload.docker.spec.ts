import { dockerBuild, logDebug, logError } from '@codeware/core/utils';
import {
  type CreateNxWorkspaceProject,
  ensureCleanupDockerContainers,
  ensureCreateNxWorkspaceProject,
  ensureDockerConnectToLocalRegistry,
  resetDocker,
  waitForDockerLogMatch
} from '@codeware/e2e/utils';
import { checkFilesExist, runNxCommand, tmpProjPath } from '@nx/plugin/testing';
import { agent } from 'supertest';

/**
 * !! Important !!
 *
 * This test suite requires docker to be running.
 */

describe('Test docker targets', () => {
  /** Default workspace project */
  let project: CreateNxWorkspaceProject;

  jest.setTimeout(1000_000);

  beforeAll(async () => {
    project = await ensureCreateNxWorkspaceProject({
      preset: '@cdwr/nx-payload'
    });

    ensureDockerConnectToLocalRegistry(project.appName);
    await ensureCleanupDockerContainers();
  });

  afterAll(async () => {
    await resetDocker(project.appName);
    runNxCommand('reset', { silenceError: true });
  });

  it('should hava a Dockerfile', async () => {
    expect(() =>
      checkFilesExist(`${project.appDirectory}/Dockerfile`)
    ).not.toThrow();
  });

  it('should build image with node', async () => {
    let error = null;
    try {
      await dockerBuild(
        {
          context: tmpProjPath(),
          dockerfile: `${project.appDirectory}/Dockerfile`,
          name: project.appName,
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

  it('should start application and detect admin page', async () => {
    const startLog = runNxCommand(`dx:start ${project.appName}`);
    expect(startLog).toContain('Successfully ran target dx:start');

    await waitForDockerLogMatch({
      containerName: project.appName,
      match: /Ready in \d/,
      timeoutSeconds: 10
    });

    logDebug('Application started in docker container');

    // Detect start page status OK
    const startPage = await agent('http://localhost:3000').get('/');
    expect(startPage.status).toBe(200);

    logDebug('Start page is reachable');

    // Detect admin page status OK after redirect to create admin user form
    const adminPage = await agent('http://localhost:3000')
      .get('/admin')
      .redirects(1);
    expect(adminPage.status).toBe(200);

    logDebug('Admin page is reachable');

    // Shut down
    const stopLog = runNxCommand(`dx:stop ${project.appName}`);
    expect(stopLog).toContain('Successfully ran target dx:stop');

    logDebug('Application docker container stopped');

    let stopCode: string;
    try {
      await agent('http://localhost:3000').get('/');
    } catch (error) {
      stopCode = error['code'];
    }
    expect(stopCode).toBe('ECONNREFUSED');
  });
});
