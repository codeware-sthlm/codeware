import { runCommand } from '@codeware/core/utils';
import {
  type CreateNxWorkspaceProject,
  ensureCreateNxWorkspaceProject,
  ensureLockFileIsDetected,
  getFolderFiles,
  removeFolderFiles
} from '@codeware/e2e/utils';
import type { NxJsonConfiguration, ProjectConfiguration } from '@nx/devkit';
import {
  checkFilesExist,
  readJson,
  runCommandAsync,
  runNxCommand,
  updateFile
} from '@nx/plugin/testing';

/**
 * This test suite use Nx default behavior to add plugins to nx.json
 * and infer targets to projects.
 */

describe('Test plugin by creating workspace with preset (extended test suite)', () => {
  /** Default workspace project */
  let project: CreateNxWorkspaceProject;

  jest.setTimeout(300_000);

  beforeAll(async () => {
    project = await ensureCreateNxWorkspaceProject({
      preset: '@cdwr/nx-payload'
    });
    ensureLockFileIsDetected(project.packageManager);
  });

  afterAll(() => {
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

    it('should not have any project targets', () => {
      const projectJson = readJson<ProjectConfiguration>(
        `${project.appDirectory}/project.json`
      );
      expect(projectJson.targets ?? {}).toEqual({});
    });

    it('should have added nx-payload and related plugins to nx.json', () => {
      const nxJson = readJson<NxJsonConfiguration>('nx.json');

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
        },
        {
          plugin: '@nx/next/plugin',
          options: expect.any(Object)
        },
        {
          plugin: '@nx/jest/plugin',
          options: expect.any(Object)
        },
        {
          plugin: '@nx/eslint/plugin',
          options: expect.any(Object)
        }
      ]);
    });
  });

  describe('run targets and verify outputs', () => {
    it('should build application', () => {
      const result = runNxCommand(`build ${project.appName}`);
      expect(result).toContain('Successfully ran target build');

      // No types or schemas should be generated in app source folder
      expect(
        getFolderFiles(`${project.appDirectory}/src/generated`)
      ).toHaveLength(0);

      // Expect a standalone NextJS build
      const standaloneDir = `${project.appDirectory}/.next/standalone`;
      const staticDir = `${project.appDirectory}/.next/static`;

      expect(() =>
        checkFilesExist(
          `${standaloneDir}/package.json`,
          `${standaloneDir}/node_modules`,
          `${standaloneDir}/${project.appDirectory}/server.js`,
          staticDir
        )
      ).not.toThrow();
    });

    it('should test application', () => {
      const result = runNxCommand(`test ${project.appName}`);
      expect(result).toContain('Successfully ran target test');
    });

    it('should lint application', () => {
      const result = runNxCommand(`lint ${project.appName}`);
      expect(result).toContain('Successfully ran target lint');
    });

    it('should serve application (dev target)', async () => {
      await runCommand(`nx dev ${project.appName}`, {
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

    it('should invoke payload cli', () => {
      const result = runNxCommand(`payload ${project.appName} info`);
      expect(result).toContain('Operating System:');
      expect(result).toContain('Successfully ran target payload');
    });
  });

  describe('enable graphql', () => {
    beforeAll(() => {
      removeFolderFiles(`${project.appDirectory}/src/generated`);
      updateFile(`${project.appDirectory}/src/payload.config.ts`, (content) =>
        content.replace(
          /(graphQL:\s*{[^}]*?)disable:\s*true([^}]*?})/,
          '$1disable: false$2'
        )
      );
    });

    it('should generate types and graphql schema', () => {
      expect(
        getFolderFiles(`${project.appDirectory}/src/generated`)
      ).toHaveLength(0);

      const result = runNxCommand(`gen ${project.appName}`);
      expect(result).toContain('Successfully ran target gen');

      expect(getFolderFiles(`${project.appDirectory}/src/generated`)).toEqual([
        'payload-types.ts',
        'schema.graphql'
      ]);
    });
  });

  describe('generate applications with options', () => {
    it('should apply tags (--tags)', () => {
      const appName = 'app-tags-long';
      runNxCommand(
        `g @cdwr/nx-payload:app ${appName} --directory apps/${appName} --tags scope:test,type:e2e`
      );
      expect(readJson(`apps/${appName}/project.json`).tags).toEqual([
        'scope:test',
        'type:e2e'
      ]);
    });

    it('should apply tags (alias -t)', () => {
      const appName = 'app-tags-alias';
      runNxCommand(
        `g @cdwr/nx-payload:app ${appName} --directory apps/${appName} -t tag:alias`
      );
      expect(readJson(`apps/${appName}/project.json`).tags).toEqual([
        'tag:alias'
      ]);
    });

    it('should generate playwright e2e project', () => {
      const appName = 'app-playwright';
      runNxCommand(
        `g @cdwr/nx-payload:app ${appName} --directory apps/${appName} --e2eTestRunner playwright`
      );
      expect(() =>
        checkFilesExist(`apps/${appName}-e2e/project.json`)
      ).not.toThrow();
    });
  });
});
