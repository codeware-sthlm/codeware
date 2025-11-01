import type { ReplaceInFileConfig } from 'replace-in-file';

import { runMigration } from './run-migration';
import type { MigrateConfig } from './types';

// Capture all exec calls
type ExecCall = { cmd: string; args?: string[]; options?: any };

const execCalls: ExecCall[] = [];
// Allow test to flip migrations exist flag
let migrationsExist = true;

// Mock log functions
const infoMock = jest.fn();
const debugMock = jest.fn();
jest.mock('@actions/core', () => ({
  info: (args: any[]) => infoMock(args),
  debug: (args: any[]) => debugMock(args)
}));

// Mock exec to capture calls and simulate migrations.json presence
jest.mock('@actions/exec', () => ({
  exec: (cmd: string, args?: string[], options?: any) => {
    // Track all calls
    execCalls.push({ cmd, args, options });

    const fullCmd = args ? `${cmd} ${args.join(' ')}` : cmd;

    // Simulate migrations exists (0) or not (1)
    if (fullCmd === 'test -f migrations.json') {
      return Promise.resolve(migrationsExist ? 0 : 1);
    }

    // Should always be successful
    return Promise.resolve(0);
  }
}));

// Mock a predictable package manager command
const packageManager = 'pnpm' as const;
jest.mock('@nx/devkit', () => ({
  getPackageManagerCommand: () => ({
    exec: packageManager,
    install: `${packageManager} install`
  })
}));

// Mock replaceInFile
const replaceInFileMock = jest.fn();
jest.mock('replace-in-file', () => ({
  replaceInFile: (args: any[]) => replaceInFileMock(args)
}));

// Mock updateDependencies returning latest version for Nx devkit to prove it was called
const updateDependenciesMock = jest.fn((text: string, latest: string) => {
  if (text.includes('"@nx/devkit"')) {
    return text.replace(
      '"@nx/devkit": "^21.0.0"',
      `"@nx/devkit": "^${latest}"`
    );
  }
  return text;
});
jest.mock('./update-dependencies', () => ({
  updateDependencies: (text: string, latest: string) =>
    updateDependenciesMock(text, latest)
}));

describe('runMigration', () => {
  const config: MigrateConfig = {
    packagePatterns: ['**/package.json']
  } as MigrateConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    replaceInFileMock.mockReset();
    execCalls.length = 0;
    migrationsExist = true;
  });

  it('runs migration and updates package.json specs', async () => {
    // Make replaceInFile call the "to" transform with a fake package.json
    replaceInFileMock.mockImplementation(
      async (opts: ReplaceInFileConfig & { to: ReplaceInFileConfig['to'] }) => {
        // Ensure we were asked to process our patterns and whole file content
        expect(opts.files).toEqual(config.packagePatterns);
        expect(opts.from?.toString()).toContain('[\\s\\S]*');

        const packageJsonString = `
{
  "dependencies": {
    "@nx/devkit": "^21.0.0"
  }
}
`;
        // Invoke the "to" transform (type-safe)
        const result =
          typeof opts.to === 'function'
            ? opts.to(packageJsonString, 'package.json') // packagePattern only matches package.json files
            : 'expected "to" to be a function';

        // Ensure the transform updated the content as expected
        expect(result).toContain('"@nx/devkit": "^22.0.0"');

        return [
          { file: 'package.json', hasChanged: result !== packageJsonString }
        ];
      }
    );

    await runMigration(config, '22.0.0');

    // Command orchestration
    expect(execCalls.map((c) => [c.cmd, c.args])).toEqual([
      // nx migrate <latest>
      [packageManager, ['nx', 'migrate', '22.0.0']],
      // nx add create-nx-workspace@<latest>
      [packageManager, ['nx', 'add', 'create-nx-workspace@22.0.0']],
      // install
      [`${packageManager} install`, undefined],
      // check for migrations.json
      ['test', ['-f', 'migrations.json']],
      // run migrations
      [packageManager, ['nx', 'migrate', '--run-migrations']]
    ]);

    // Check replaceInFile
    expect(replaceInFileMock).toHaveBeenCalledTimes(1);
    expect(updateDependenciesMock).toHaveBeenCalledWith(
      expect.stringContaining('"@nx/devkit"'),
      '22.0.0'
    );

    // Check some important logs
    expect(infoMock).toHaveBeenCalledWith('Running migrations');
    expect(debugMock).toHaveBeenCalledWith(
      'package.json versions were updated'
    );
    expect(infoMock).toHaveBeenCalledWith('Migration completed');
  });

  it('skips running migrations when migrations.json is missing', async () => {
    migrationsExist = false;

    replaceInFileMock.mockResolvedValue([
      { file: 'package.json', hasChanged: false }
    ]);

    await runMigration(config, '22.0.0');

    // Ensure migrations file check was made but no run-migrations call
    expect(execCalls).toContainEqual({
      cmd: 'test',
      args: ['-f', 'migrations.json'],
      options: expect.any(Object)
    });

    expect(
      execCalls.some(({ args }) => args?.includes('--run-migrations'))
    ).toBe(false);

    // Check some important logs
    expect(infoMock).toHaveBeenCalledWith('No migrations found');
    expect(infoMock).toHaveBeenCalledWith('Migration completed');
  });
});
