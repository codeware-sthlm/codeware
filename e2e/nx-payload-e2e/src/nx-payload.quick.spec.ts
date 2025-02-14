import { logDebug, runCommand } from '@codeware/core/utils';
import {
  ensureCreateNxWorkspaceProject,
  ensureLockFileIsDetected
} from '@codeware/e2e/utils';
import type { NxJsonConfiguration } from '@nx/devkit';
import {
  checkFilesExist,
  readJson,
  runCommandAsync,
  runNxCommand,
  runNxCommandAsync
} from '@nx/plugin/testing';

/**
 * This test suite does not use the preset, but starts with an empty workspace ('apps' preset)
 * and adds the plugin afterwards.
 */

describe('Test plugin by starting with an empty workspace (limited test suite)', () => {
  jest.setTimeout(300_000);

  // Setup an empty workspace and add the plugin afterwards
  beforeAll(async () => {
    const { packageManager } = await ensureCreateNxWorkspaceProject({
      preset: 'apps'
    });
    ensureLockFileIsDetected(packageManager);

    logDebug(
      'Empty workspace - package.json',
      JSON.stringify(readJson('package.json'), null, 2)
    );

    await runNxCommandAsync('add @cdwr/nx-payload');
    logDebug(
      'Plugin added - package.json',
      JSON.stringify(readJson('package.json'), null, 2)
    );
  });

  afterAll(() => {
    runNxCommand('reset', { silenceError: true });
  });

  describe('verify setup', () => {
    it('should have installed @cdwr/nx-payload', async () => {
      await runCommandAsync('npm ls @cdwr/nx-payload');
    });

    it('should only have nx-payload plugin in nx.json', () => {
      const nxJson = readJson<NxJsonConfiguration>('nx.json');
      expect(nxJson.plugins).toBeDefined();
      expect(nxJson.plugins).toEqual([
        {
          plugin: '@cdwr/nx-payload/plugin',
          options: {
            generateTargetName: 'gen',
            payloadTargetName: 'payload',
            payloadGraphqlTargetName: 'payload-graphql',
            dxMongodbTargetName: 'dx:mongodb',
            dxPostgresTargetName: 'dx:postgres',
            dxStartTargetName: 'dx:start',
            dxStopTargetName: 'dx:stop'
          }
        }
      ]);
    });
  });

  describe('generate default payload app and run targets', () => {
    const appName = 'app-default';
    const appDirectory = `apps/${appName}`;

    beforeAll(async () => {
      await runNxCommandAsync(
        `g @cdwr/nx-payload:app ${appName} --directory ${appDirectory}`
      );
      logDebug(
        'Application generated - package.json',
        JSON.stringify(readJson('package.json'), null, 2)
      );
    });

    it('should have added eslint,jest,next plugins to nx.json', () => {
      const nxJson = readJson<NxJsonConfiguration>('nx.json');
      const plugins = nxJson.plugins
        .map((p) => (typeof p === 'string' ? p : p.plugin))
        .sort();

      expect(plugins).toEqual([
        '@cdwr/nx-payload/plugin',
        '@nx/eslint/plugin',
        '@nx/jest/plugin',
        '@nx/next/plugin'
      ]);
    });

    it('should build application', async () => {
      await runNxCommandAsync(`build ${appName}`);
      expect(() =>
        checkFilesExist(
          `${appDirectory}/.next/standalone`,
          `${appDirectory}/.next/static`
        )
      ).not.toThrow();
    });

    it('should test application', async () => {
      await runNxCommandAsync(`test ${appName}`);
    });

    it('should lint application', async () => {
      await runNxCommandAsync(`lint ${appName}`);
    });

    it('should serve application (dev target)', async () => {
      await runCommand(`nx dev ${appName}`, {
        doneFn: (log) => /Ready in \d/.test(log),
        errorDetector: /Error:/,
        verbose: process.env.NX_VERBOSE_LOGGING === 'true'
      });
    });

    it('should generate types', async () => {
      await runNxCommandAsync(`gen ${appName}`);

      expect(() =>
        checkFilesExist(`${appDirectory}/src/generated/payload-types.ts`)
      ).not.toThrow();
    });

    it('should invoke payload cli', async () => {
      await runNxCommandAsync(`payload ${appName} info`);
    });
  });
});
