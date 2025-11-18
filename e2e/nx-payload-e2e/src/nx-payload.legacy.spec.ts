import { runCommand } from '@codeware/core/utils';
import {
  ensureCreateNxWorkspaceProject,
  ensureLockFileIsDetected,
  getFolderFiles
} from '@codeware/e2e/utils';
import type { CreateNxWorkspaceProject } from '@codeware/e2e/utils';
import type { NxJsonConfiguration, ProjectConfiguration } from '@nx/devkit';
import {
  checkFilesExist,
  readJson,
  runCommandAsync,
  runNxCommand,
  runNxCommandAsync
} from '@nx/plugin/testing';

/**
 * This test suite use legacy Nx behavior to opt-out of plugin inference
 * and create project targets.
 */

describe('Test plugin by creating workspace with preset (legacy test suite)', () => {
  /** Default workspace project */
  let project: CreateNxWorkspaceProject;

  jest.setTimeout(500_000);

  beforeAll(async () => {
    process.env['NX_ADD_PLUGINS'] = 'false';
    project = await ensureCreateNxWorkspaceProject({
      preset: '@cdwr/nx-payload'
    });
    ensureLockFileIsDetected(project.packageManager);
  });

  afterAll(() => {
    delete process.env['NX_ADD_PLUGINS'];
    runNxCommand('reset', { silenceError: true });
  });

  describe('verify setup', () => {
    it('should have installed @cdwr/nx-payload', async () => {
      await runCommandAsync('npm ls @cdwr/nx-payload');
    });

    it('should have created an initial payload application', () => {
      expect(readJson(`${project.appDirectory}/project.json`).name).toBe(
        project.appName
      );

      expect(() =>
        checkFilesExist(`${project.appDirectory}/src/payload.config.ts`)
      ).not.toThrow();
    });

    it('should not have any plugins in nx.json', () => {
      const nxJson = readJson<NxJsonConfiguration>('nx.json');
      expect(nxJson.plugins ?? []).toEqual([]);
    });

    it('should have all payload targets', () => {
      const projectJson = readJson<ProjectConfiguration>(
        `${project.appDirectory}/project.json`
      );
      for (const target of [
        'dx:mongodb',
        'dx:postgres',
        'dx:start',
        'dx:stop',
        'gen',
        'payload',
        'payload-graphql'
      ]) {
        expect(projectJson.targets[target]).toBeDefined();
      }
    });

    it('should have build and serve targets from next plugin', () => {
      const projectJson = readJson<ProjectConfiguration>(
        `${project.appDirectory}/project.json`
      );
      expect(projectJson.targets['build']).toBeDefined();
      expect(projectJson.targets['serve']).toBeDefined();
    });
  });

  describe('run targets', () => {
    it('should build application', async () => {
      await runNxCommandAsync(`build ${project.appName}`);
      expect(() =>
        checkFilesExist(
          `${project.appDirectory}/.next/standalone`,
          `${project.appDirectory}/.next/static`
        )
      ).not.toThrow();
    });

    it('should test application', async () => {
      // https://github.com/nrwl/nx/issues/32880
      await runNxCommandAsync(`test ${project.appName} --force-exit`);
    });

    it('should lint application', async () => {
      await runNxCommandAsync(`lint ${project.appName}`);
    });

    it('should serve application (serve target)', async () => {
      await runCommand(`nx serve ${project.appName}`, {
        doneFn: (log) => /Ready in \d/.test(log),
        errorDetector: /Error:/,
        verbose: process.env.NX_VERBOSE_LOGGING === 'true'
      });
    });

    it('should generate types', () => {
      expect(
        getFolderFiles(`${project.appDirectory}/src/generated`)
      ).toHaveLength(0);

      const result = runNxCommand(`gen ${project.appName}`);
      expect(result).toContain('Successfully ran target gen');

      // Only types should be generated
      expect(getFolderFiles(`${project.appDirectory}/src/generated`)).toEqual([
        'payload-types.ts'
      ]);
    });

    it('should invoke payload cli', async () => {
      await runNxCommandAsync(`payload ${project.appName} info`);
    });
  });
});
