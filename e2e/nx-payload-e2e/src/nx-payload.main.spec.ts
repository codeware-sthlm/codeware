import { logInfo, runCommand } from '@codeware/core';
import {
  type CreateNxWorkspaceProject,
  ensureCreateNxWorkspaceProject
} from '@codeware/e2e/utils';
import type { NxJsonConfiguration, ProjectConfiguration } from '@nx/devkit';
import {
  checkFilesExist,
  fileExists,
  readJson,
  runCommandAsync,
  runNxCommand,
  tmpProjPath,
  uniq,
  updateFile
} from '@nx/plugin/testing';

describe('Main plugin targets no docker', () => {
  /** Default inference project to test targets */
  let project: CreateNxWorkspaceProject;
  let originalEnv: string;

  jest.setTimeout(300_000);

  const resetInference = () => {
    delete process.env['NX_ADD_PLUGINS'];

    try {
      updateFile('nx.json', (content) => {
        const nxJson = JSON.parse(content);
        delete nxJson['useInferencePlugins'];
        return JSON.stringify(nxJson);
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      /* empty */
    }
  };

  const optOutInference = (option: 'envVariable' | 'nxConfig') => {
    switch (option) {
      case 'envVariable':
        process.env['NX_ADD_PLUGINS'] = 'false';
        break;
      case 'nxConfig':
        try {
          updateFile('nx.json', (content) => {
            const nxJson = JSON.parse(content);
            nxJson['useInferencePlugins'] = false;
            return JSON.stringify(nxJson);
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          /* empty */
        }
    }
  };

  beforeAll(async () => {
    originalEnv = process.env.NX_ADD_PLUGINS;

    resetInference();
    project = await ensureCreateNxWorkspaceProject({
      preset: '@cdwr/nx-payload'
    });
  });

  afterAll(() => {
    process.env.NX_ADD_PLUGINS = originalEnv;
    runNxCommand('reset', { silenceError: true });
  });

  describe('initial workspace project', () => {
    describe('verify preset', () => {
      it('should have installed nx-payload plugin', async () => {
        await runCommandAsync('npm ls @cdwr/nx-payload');
      });

      it('should have applied app name and directory', () => {
        expect(readJson(`${project.appDirectory}/project.json`).name).toBe(
          project.appName
        );
      });
    });

    describe('verify inference', () => {
      it('should add plugin to nx config without custom target names', () => {
        const nxJson = readJson<NxJsonConfiguration>('nx.json');
        const plugin = nxJson.plugins.find(
          (p) => p === '@cdwr/nx-payload/plugin'
        );
        expect(plugin).toEqual('@cdwr/nx-payload/plugin');
      });
    });

    describe('run targets', () => {
      it('should build application without generating types and graphql schema', () => {
        const result = runNxCommand(`build ${project.appName}`);
        expect(result).toContain('Successfully ran target build');

        expect(() =>
          checkFilesExist(
            `dist/apps/${project.appName}/build/index.html`,
            `dist/apps/${project.appName}/package.json`,
            `dist/apps/${project.appName}/src/main.js`
          )
        ).not.toThrow();

        expect(
          fileExists(`${project.appDirectory}/src/generated/payload-types.ts`)
        ).toBeFalsy();
        expect(
          fileExists(`${project.appDirectory}/src/generated/schema.graphql`)
        ).toBeFalsy();
      });

      it('should test application', () => {
        const result = runNxCommand(`test ${project.appName}`);
        expect(result).toContain('Successfully ran target test');
      });

      it('should lint application', () => {
        const result = runNxCommand(`lint ${project.appName}`);
        expect(result).toContain('Successfully ran target lint');
      });

      it('should serve application', async () => {
        const output = await runCommand(`nx serve ${project.appName}`, {
          cwd: tmpProjPath(),
          doneFn: (log) => log.includes('[ started ]'),
          errorDetector: /Error:/,
          verbose: process.env.NX_VERBOSE_LOGGING === 'true'
        });

        expect(
          output.includes(
            `Done compiling TypeScript files for project "${project.appName}"`
          )
        ).toBeTruthy();
        expect(output.includes(`[ started ] on port 3000 (test)`)).toBeTruthy();
      });

      it('should generate types and graphql schema', () => {
        const result = runNxCommand(`gen ${project.appName}`);
        expect(result).toContain('Successfully ran target gen');

        expect(() =>
          checkFilesExist(
            `${project.appDirectory}/src/generated/payload-types.ts`,
            `${project.appDirectory}/src/generated/schema.graphql`
          )
        ).not.toThrow();
      });

      it('should invoke payload cli', () => {
        const result = runNxCommand(`payload ${project.appName}`);
        expect(result).toContain('Successfully ran target payload');
      });
    });
  });

  // Generate applications with and without inference
  const testMatrix: Array<{
    name: string;
    optOut?: { by: 'envVariable' | 'nxConfig'; apply: 'single' | 'double' };
    projectTargets: Array<string>;
    resolvedTargets?: Array<string>;
  }> = [
    {
      name: 'using inference',
      projectTargets: ['lint', 'test'],
      resolvedTargets: [
        'build',
        'gen',
        'lint',
        'payload',
        'serve',
        'test',
        'dx:docker-build',
        'dx:docker-run',
        'dx:mongodb',
        'dx:postgres',
        'dx:start',
        'dx:stop'
      ]
    },
    {
      name: 'opt out via env',
      optOut: { by: 'envVariable', apply: 'single' },
      projectTargets: ['build', 'lint', 'gen', 'payload', 'serve', 'test']
    },
    {
      name: 'opt out via nx config only',
      optOut: { by: 'nxConfig', apply: 'single' },
      projectTargets: ['build', 'lint', 'gen', 'payload', 'serve', 'test']
    },
    {
      name: 'opt out via nx config overrides env',
      optOut: { by: 'nxConfig', apply: 'double' },
      projectTargets: ['build', 'lint', 'gen', 'payload', 'serve', 'test']
    }
  ];

  testMatrix.forEach(({ name, optOut, projectTargets, resolvedTargets }) => {
    describe(`generate app - ${name}`, () => {
      const appName = uniq('app');
      const appDirectory = `apps/${appName}`;
      resolvedTargets = resolvedTargets ?? projectTargets;

      beforeAll(() => {
        resetInference();
        if (optOut) {
          if (optOut.apply === 'single') {
            optOutInference(optOut.by);
          } else {
            if (optOut.by === 'nxConfig') {
              // This should be overrided by nx.json setting
              process.env['NX_ADD_PLUGINS'] = 'true';
            } else if (optOut.by === 'envVariable') {
              logInfo(
                `Test case opt out by '${optOut.by}' has no effect for '${optOut.apply}'`
              );
            }
            optOutInference(optOut.by);
          }
        }

        runNxCommand(
          `g @cdwr/nx-payload:app ${appName} --directory ${appDirectory}`
        );
      });

      it('should have inference flags set properly', () => {
        const nxJson = readJson<NxJsonConfiguration>('nx.json');

        switch (`${optOut?.by}-${optOut?.apply}`) {
          case 'envVariable-single':
            expect(nxJson.useInferencePlugins).toBeUndefined();
            expect(process.env.NX_ADD_PLUGINS).toBe('false');
            break;
          case 'nxConfig-single':
            expect(nxJson.useInferencePlugins).toBe(false);
            expect(process.env.NX_ADD_PLUGINS).toBeUndefined();
            break;
          case 'nxConfig-double':
            expect(nxJson.useInferencePlugins).toBe(false);
            expect(process.env.NX_ADD_PLUGINS).toBe('true');
            break;
          default:
            expect(nxJson.useInferencePlugins).toBeUndefined();
            expect(process.env.NX_ADD_PLUGINS).toBeUndefined();
        }
      });

      it('should have targets in project.json', () => {
        const projectJson = readJson<ProjectConfiguration>(
          `${project.appDirectory}/project.json`
        );
        expect(Object.keys(projectJson.targets).sort).toEqual(
          projectTargets.sort
        );
      });

      it('should resolve project targets', () => {
        const projectConfig: ProjectConfiguration = JSON.parse(
          runNxCommand(`show project ${project.appName} --json`)
        );
        expect(Object.keys(projectConfig.targets).sort).toEqual(
          resolvedTargets.sort
        );
      });

      it('should have application files', () => {
        expect(() =>
          checkFilesExist(
            `${appDirectory}/project.json`,
            `${appDirectory}/src/main.ts`,
            `${appDirectory}-e2e/project.json`,
            `${appDirectory}-e2e/src/${appName}/${appName}.spec.ts`
          )
        ).not.toThrow();
      });
    });
  });

  describe(`generate app with options`, () => {
    beforeAll(() => {
      resetInference();
    });

    it('should apply tags (--tags)', () => {
      const appName = uniq('app');
      runNxCommand(
        `g @cdwr/nx-payload:app ${appName} --directory apps/${appName} --tags e2etag,e2ePackage`
      );

      expect(readJson(`apps/${appName}/project.json`).tags).toEqual([
        'e2etag',
        'e2ePackage'
      ]);
    });

    it('should apply tags (alias -t)', () => {
      const appName = uniq('app');
      runNxCommand(
        `g @cdwr/nx-payload:app ${appName} --directory apps/${appName} -t aliasTag`
      );

      expect(readJson(`apps/${appName}/project.json`).tags).toEqual([
        'aliasTag'
      ]);
    });

    it('should skip e2e project', () => {
      const appName = uniq('app');
      runNxCommand(
        `g @cdwr/nx-payload:app ${appName} --directory apps/${appName} --skip-e2e`
      );

      expect(() =>
        checkFilesExist(`apps/${appName}-e2e/project.json`)
      ).toThrow();
    });
  });
});
