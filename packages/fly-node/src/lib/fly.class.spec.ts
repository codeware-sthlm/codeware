import { existsSync } from 'fs';
import process from 'process';

import { exec } from '@codeware/core/utils';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { Fly } from './fly.class';
import {
  mockAppsListResponse,
  mockCreateAppResponse,
  mockDefs,
  mockListCertForAllResponse,
  mockListCertForAppResponse,
  mockListSecretForAllResponse,
  mockListSecretForAppResponse,
  mockShowConfigResponse,
  mockStatusResponse
} from './mocks';
import type { Config } from './types';

vi.mock('console');
vi.mock('fs', async () => ({
  // Only mock `existsSync` function
  ...(await vi.importActual('fs')),
  existsSync: vi.fn().mockReturnValue(true)
}));
vi.mock('os');
vi.mock('@codeware/core/utils', async () => ({
  // Only mock `exec` function
  ...(await vi.importActual('@codeware/core/utils')),
  exec: vi.fn()
}));

describe('Fly', () => {
  const mockConsoleInfo = vi.spyOn(console, 'log');
  const mockConsoleError = vi.spyOn(console, 'error');

  mockConsoleInfo.mockImplementation(() => vi.fn());
  mockConsoleError.mockImplementation(() => vi.fn());

  /**
   * Default fly configuration for the tests
   * - logger is mocked
   */
  const defaultFlyConfig: Config = {
    logger: {
      info: mockConsoleInfo as Mock,
      error: mockConsoleError as Mock,
      // Tip! Set to `true` to print `exec` mock details
      traceCLI: false
    }
  };

  const mockExec = vi.mocked(exec);
  const mockExistsSync = vi.mocked(existsSync);

  /**
   * Setup mock implementations for Fly commands via `exec`.
   *
   * **Must be in sync with `mockDefs` to work correctly**
   *
   * A set of base rules are always applied and can be complemented
   * with additional custom rules for each test.
   *
   * The rules should match a fly command and decide whether to resolve
   * or reject the promise with the appropriate output.
   *
   * For commands that doesn't match a rule will return valid JSON for empty
   * output when `--json` flag is used with or without `list`.
   *
   * @param rules - The rules to apply to the mock execution
   */
  const setupFlyMocks = (
    rules: Array<{
      /** The matched fly command to mock (exclude `fly/flyctl` prefix) */
      cmdMatch: RegExp;
      /** Whether to resolve or reject the promise */
      resolveOrReject: 'resolve' | 'reject';
      /** The stdout or error message to return */
      output: string;
      /**
       * The number of times the rule can be applied.
       * For example 1 mimics `mockExec.mockImplementationOnce`.
       */
      calls?: number;
    }> = []
  ) => {
    // Base rules that are always applied
    const baseRules: typeof rules = [
      {
        cmdMatch: /status( --app new-app)? --json/,
        resolveOrReject: 'reject',
        output: 'App not found',
        calls: 1
      },
      {
        cmdMatch: /status --app new-app/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockStatusResponse(mockDefs.newApp))
      },
      {
        cmdMatch: /status --app generated-name-app --json/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockStatusResponse(mockDefs.generatedAppName))
      },
      {
        cmdMatch: /status (--app test-app|--config test\/fly\.toml)/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockStatusResponse(mockDefs.testApp))
      },
      {
        cmdMatch: /apps create new-app/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockCreateAppResponse(mockDefs.newApp))
      },
      {
        cmdMatch: /apps create --generate-name/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockCreateAppResponse(mockDefs.generatedAppName))
      },
      {
        cmdMatch: /apps list/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockAppsListResponse)
      },
      {
        cmdMatch: /status --app unknown-app/,
        resolveOrReject: 'reject',
        output: 'App not found'
      },
      {
        cmdMatch: /certs list --app .*/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockListCertForAppResponse)
      },
      {
        cmdMatch: /config show (--app test-app|--config test\/fly\.toml)/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockShowConfigResponse(mockDefs.testApp))
      },
      {
        cmdMatch: /config show --config new\/fly\.toml/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockShowConfigResponse(mockDefs.newApp))
      },
      {
        cmdMatch: /config show --config unknown\/fly\.toml/,
        resolveOrReject: 'reject',
        output: 'Config not found'
      },

      {
        cmdMatch: /secrets list --app .*/,
        resolveOrReject: 'resolve',
        output: JSON.stringify(mockListSecretForAppResponse)
      },
      {
        cmdMatch: /version$/,
        resolveOrReject: 'resolve',
        output: 'flyctl version 1.0.0'
      }
    ];

    // Let user override base rules
    const allRules = [...rules, ...baseRules];

    // Mock exec function with the rules
    mockExec.mockImplementation((cmd) => {
      // Find the rules that match the command
      for (const rule of allRules.filter(
        (r) => r.calls !== 0 && cmd.match(r.cmdMatch)
      )) {
        if (defaultFlyConfig?.logger?.traceCLI) {
          console.debug('[ MOCK ]', rule);
        }
        // Decrement the number of calls for the rule
        if (Number.isInteger(rule.calls) && rule.calls) {
          rule.calls--;
        }
        // Return the rule result
        return (
          rule.resolveOrReject === 'resolve'
            ? Promise.resolve({ stdout: rule.output, stderr: '' })
            : Promise.reject(new Error(rule.output))
        ) as ReturnType<typeof exec>;
      }

      // Default JSON responses for empty results
      const response = {
        stdout: cmd.match(/.* list .* --json/)
          ? '[]'
          : cmd.match(/--json/)
            ? '{}'
            : '',
        stderr: ''
      };
      if (defaultFlyConfig?.logger?.traceCLI) {
        console.debug('[ MOCK ]', response);
      }
      return Promise.resolve(response) as ReturnType<typeof exec>;
    });
  };

  // Save original process.env before the tests
  const origProcessEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    delete process.env['FLY_API_TOKEN'];

    mockExistsSync.mockReturnValue(true);
    setupFlyMocks();
  });

  afterAll(() => {
    process.env = origProcessEnv;
  });

  describe('cli', () => {
    it('should check installed and return true when cli is installed', async () => {
      const fly = new Fly(defaultFlyConfig);
      expect(await fly.cli.isInstalled()).toBe(true);
    });

    it('should check installed and return false when cli is not installed', async () => {
      setupFlyMocks([
        {
          cmdMatch: /version$/,
          resolveOrReject: 'reject',
          output: 'not installed'
        }
      ]);
      const fly = new Fly(defaultFlyConfig);
      expect(await fly.cli.isInstalled()).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should throw error when running command and fly is not installed', async () => {
      setupFlyMocks([
        {
          cmdMatch: /version$/,
          resolveOrReject: 'reject',
          output: 'not installed',
          calls: 1
        }
      ]);

      const fly = new Fly(defaultFlyConfig);
      await expect(async () => await fly.apps.create()).rejects.toThrow(
        /Fly CLI must be installed to use this library/
      );
    });

    it('should log the error and return false without assert option when fly is not ready', async () => {
      setupFlyMocks([
        {
          cmdMatch: /auth whoami/,
          resolveOrReject: 'reject',
          output: 'Not logged in'
        },
        {
          cmdMatch: /auth token/,
          resolveOrReject: 'reject',
          output: 'Token is not valid'
        }
      ]);

      const fly = new Fly(defaultFlyConfig);

      expect(async () => await fly.isReady()).not.toThrow();

      const status = await fly.isReady();

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('Fly client is not ready')
      );
      expect(mockConsoleInfo).not.toHaveBeenCalledWith(
        expect.stringContaining('Fly client is ready')
      );
      expect(status).toBe(false);
    });

    it('should throw error when fly is not verified with assert option', async () => {
      setupFlyMocks([
        {
          cmdMatch: /auth whoami/,
          resolveOrReject: 'reject',
          output: 'Not logged in'
        }
      ]);

      const fly = new Fly(defaultFlyConfig);

      await expect(fly.isReady('assert')).rejects.toThrow(/Command failed:/);
      expect(mockConsoleInfo).not.toHaveBeenCalledWith(
        expect.stringContaining('Fly client is ready')
      );
      expect(mockConsoleInfo).not.toHaveBeenCalledWith(
        expect.stringContaining('Fly client is not ready')
      );
    });

    it('should try to authenticate with logged in user before using token', async () => {
      setupFlyMocks([
        {
          cmdMatch: /auth whoami/,
          resolveOrReject: 'resolve',
          output: 'user@example.com'
        }
      ]);

      const fly = new Fly(defaultFlyConfig);
      const status = await fly.isReady();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/auth whoami$/)
      );
      expect(mockExec).not.toHaveBeenCalledWith(
        expect.stringContaining(`auth token --access-token`)
      );
      expect(status).toBe(true);
    });

    it('should authenticate with token from config when no user is logged in', async () => {
      setupFlyMocks([
        {
          cmdMatch: /auth whoami$/,
          resolveOrReject: 'reject',
          output: 'Not logged in'
        },
        {
          cmdMatch: /auth whoami --access-token/,
          resolveOrReject: 'resolve',
          output: 'user@example.com'
        }
      ]);

      const fly = new Fly({ ...defaultFlyConfig, token: mockDefs.token });
      const status = await fly.isReady();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`auth whoami --access-token ${mockDefs.token}`)
      );
      expect(status).toBe(true);
    });

    it('should authenticate with token from environment when config token is not provided and no user is logged in', async () => {
      setupFlyMocks([
        {
          cmdMatch: /auth whoami$/,
          resolveOrReject: 'reject',
          output: 'Not logged in'
        },
        {
          cmdMatch: /auth whoami --access-token/,
          resolveOrReject: 'resolve',
          output: 'user@example.com'
        }
      ]);

      process.env['FLY_API_TOKEN'] = `${mockDefs.token}-env`;

      const fly = new Fly(defaultFlyConfig);
      const status = await fly.isReady();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `auth whoami --access-token ${mockDefs.token}-env`
        )
      );
      expect(status).toBe(true);
    });

    it('should fail to authenticate when no token is provided and no user is logged in', async () => {
      setupFlyMocks([
        {
          cmdMatch: /auth whoami/,
          resolveOrReject: 'reject',
          output: 'Not logged in'
        }
      ]);

      const fly = new Fly(defaultFlyConfig);
      const status = await fly.isReady();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`auth whoami`)
      );
      expect(status).toBe(false);
    });
  });

  // This test suite ensures that the type `AppOrConfig` is correctly handled
  // by the constructor and the functions that use it.
  // The type enforce usage of only one of `app` or `config` to be provided.
  // When used in the constructor all functions should infer `app` or `config`
  // from the constructor unless overridden by the function itself.
  describe('provide app or config to constructor or function', () => {
    const testMatrix: Array<{
      name: string;
      noOptionFn: (fly: typeof Fly.prototype) => Promise<unknown>;
      appOptionFn: (fly: typeof Fly.prototype) => Promise<unknown>;
      configOptionFn: (fly: typeof Fly.prototype) => Promise<unknown>;
      appAssert: RegExp;
      configAssert: RegExp;
    }> = [
      {
        name: 'certs.add',
        noOptionFn: async (fly) => fly.certs.add('test.com'),
        appOptionFn: async (fly) =>
          fly.certs.add('test.com', { app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.certs.add('test.com', { config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(
          `certs add test.com --app ${mockDefs.testApp}`
        ),
        configAssert: expect.stringContaining(
          `certs add test.com --config ${mockDefs.testConfig}`
        )
      },
      {
        name: 'certs.list',
        noOptionFn: async (fly) => fly.certs.list(),
        appOptionFn: async (fly) => fly.certs.list({ app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.certs.list({ config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(
          `certs list --app ${mockDefs.testApp}`
        ),
        configAssert: expect.stringContaining(
          `certs list --config ${mockDefs.testConfig}`
        )
      },
      {
        name: 'certs.remove',
        noOptionFn: async (fly) => fly.certs.remove('test.com'),
        appOptionFn: async (fly) =>
          fly.certs.remove('test.com', { app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.certs.remove('test.com', { config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(
          `certs remove test.com --app ${mockDefs.testApp}`
        ),
        configAssert: expect.stringContaining(
          `certs remove test.com --config ${mockDefs.testConfig}`
        )
      },
      {
        name: 'config.show',
        noOptionFn: async (fly) => fly.config.show(),
        appOptionFn: async (fly) => fly.config.show({ app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.config.show({ config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(
          `config show --app ${mockDefs.testApp}`
        ),
        configAssert: expect.stringContaining(
          `config show --config ${mockDefs.testConfig}`
        )
      },
      {
        name: 'secrets.set',
        noOptionFn: async (fly) => fly.secrets.set({ TEST_SECRET: 'value' }),
        appOptionFn: async (fly) =>
          fly.secrets.set({ TEST_SECRET: 'value' }, { app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.secrets.set(
            { TEST_SECRET: 'value' },
            { config: mockDefs.testConfig }
          ),
        appAssert: expect.stringContaining(
          `secrets set --app ${mockDefs.testApp} TEST_SECRET=value`
        ),
        configAssert: expect.stringContaining(
          `secrets set --config ${mockDefs.testConfig} TEST_SECRET=value`
        )
      },
      {
        name: 'secrets.list',
        noOptionFn: async (fly) => fly.secrets.list(),
        appOptionFn: async (fly) => fly.secrets.list({ app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.secrets.list({ config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(
          `secrets list --app ${mockDefs.testApp}`
        ),
        configAssert: expect.stringContaining(
          `secrets list --config ${mockDefs.testConfig}`
        )
      },
      {
        name: 'secrets.unset',
        noOptionFn: async (fly) => fly.secrets.unset('TEST_SECRET'),
        appOptionFn: async (fly) =>
          fly.secrets.unset('TEST_SECRET', { app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.secrets.unset('TEST_SECRET', { config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(
          `secrets unset --app ${mockDefs.testApp} TEST_SECRET`
        ),
        configAssert: expect.stringContaining(
          `secrets unset --config ${mockDefs.testConfig} TEST_SECRET`
        )
      },
      {
        name: 'status',
        noOptionFn: async (fly) => fly.status(),
        appOptionFn: async (fly) => fly.status({ app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.status({ config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(`status --app ${mockDefs.testApp}`),
        configAssert: expect.stringContaining(
          `status --config ${mockDefs.testConfig}`
        )
      },
      {
        name: 'statusExtended - certs',
        noOptionFn: async (fly) => fly.statusExtended(),
        appOptionFn: async (fly) =>
          fly.statusExtended({ app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.statusExtended({ config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(
          `certs list --app ${mockDefs.testApp}`
        ),
        configAssert: expect.stringContaining(
          `certs list --config ${mockDefs.testConfig}`
        )
      },
      {
        name: 'statusExtended - secrets',
        noOptionFn: async (fly) => fly.statusExtended(),
        appOptionFn: async (fly) =>
          fly.statusExtended({ app: mockDefs.testApp }),
        configOptionFn: async (fly) =>
          fly.statusExtended({ config: mockDefs.testConfig }),
        appAssert: expect.stringContaining(
          `secrets list --app ${mockDefs.testApp}`
        ),
        configAssert: expect.stringContaining(
          `secrets list --config ${mockDefs.testConfig}`
        )
      }
    ];

    for (const test of testMatrix) {
      describe(test.name, () => {
        it('should have --app flag when app is provided to constructor', async () => {
          const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
          await test.noOptionFn(fly);
          expect(mockExec).toHaveBeenCalledWith(test.appAssert);
        });

        it('should have --app flag when app is provided to function', async () => {
          const fly = new Fly(defaultFlyConfig);
          await test.appOptionFn(fly);
          expect(mockExec).toHaveBeenCalledWith(test.appAssert);
        });

        it('should have --config flag when config is provided to constructor', async () => {
          const fly = new Fly({
            ...defaultFlyConfig,
            config: mockDefs.testConfig
          });
          await test.noOptionFn(fly);
          expect(mockExec).toHaveBeenCalledWith(test.configAssert);
        });

        it('should have --config flag when config is provided to function', async () => {
          const fly = new Fly(defaultFlyConfig);
          await test.configOptionFn(fly);
          expect(mockExec).toHaveBeenCalledWith(test.configAssert);
        });
      });
    }
  });

  describe('apps', () => {
    it('should create application and get a generated name', async () => {
      const fly = new Fly(defaultFlyConfig);
      const name = await fly.apps.create();

      expect(name).toBe(mockDefs.generatedAppName);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`apps create --generate-name`)
      );
    });

    it('should create application on personal organization by default', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.apps.create();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`apps create --generate-name --org personal`)
      );
    });

    it('should create application with a provided name', async () => {
      const fly = new Fly(defaultFlyConfig);
      const name = await fly.apps.create({ app: mockDefs.newApp });

      expect(name).toBe(mockDefs.newApp);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`apps create ${mockDefs.newApp}`)
      );
    });

    it('should create application for a custom organization', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.apps.create({ org: mockDefs.org });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `apps create --generate-name --org ${mockDefs.org}`
        )
      );
    });

    it('should destroy application', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.apps.destroy(mockDefs.testApp);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`apps destroy ${mockDefs.testApp}`)
      );
    });

    it('should auto-confirm destruction', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.apps.destroy(mockDefs.testApp);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/apps destroy .* --yes/)
      );
    });

    it('should force destruction', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.apps.destroy(mockDefs.testApp, true);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/apps destroy .* --force/)
      );
    });

    it('should list applications', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.apps.list();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`apps list`)
      );
      expect(response).toEqual(mockAppsListResponse);
    });
  });

  describe('certs', () => {
    // Note! `certs list` is already tested in the extensive test matrix
    it('should add certificate', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      await fly.certs.add('test.com');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`certs add test.com --app ${mockDefs.testApp}`)
      );
    });

    it('should remove certificate', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      await fly.certs.remove('test.com');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `certs remove test.com --app ${mockDefs.testApp}`
        )
      );
    });

    it('should auto-confirm removal', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      await fly.certs.remove('test.com');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `certs remove test.com --app ${mockDefs.testApp} --yes`
        )
      );
    });

    it('should list certificates for instance app', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      const response = await fly.certs.list();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`certs list --app ${mockDefs.testApp}`)
      );
      expect(response).toEqual(mockListCertForAppResponse);
    });

    it('should list certificates for an app', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.certs.list({ app: mockDefs.testApp });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`certs list --app ${mockDefs.testApp}`)
      );
      expect(response).toEqual(mockListCertForAppResponse);
    });

    it('should list certificates for all apps', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.certs.list('all');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('apps list')
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `certs list --app ${mockListCertForAllResponse[0].app}`
        )
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `certs list --app ${mockListCertForAllResponse[1].app}`
        )
      );
      expect(response).toEqual(mockListCertForAllResponse);
    });
  });

  describe('config', () => {
    it('should show config for instance config', async () => {
      const fly = new Fly({ ...defaultFlyConfig, config: mockDefs.testConfig });
      const response = await fly.config.show();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(
          `config show --config ${mockDefs.testConfig}(--local){0}`
        )
      );
      expect(response).toEqual(mockShowConfigResponse(mockDefs.testApp));
    });

    it('should show config for an app', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.config.show({ config: mockDefs.testConfig });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(
          `config show --config ${mockDefs.testConfig}(--local){0}`
        )
      );
      expect(response).toEqual(mockShowConfigResponse(mockDefs.testApp));
    });

    it('should show config for local config file', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.config.show({
        config: mockDefs.testConfig,
        local: true
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `config show --config ${mockDefs.testConfig} --local`
        )
      );
      expect(response).toEqual(mockShowConfigResponse(mockDefs.testApp));
    });

    it('should throw error when command fails', async () => {
      const fly = new Fly(defaultFlyConfig);
      await expect(
        fly.config.show({ config: mockDefs.unknownConfig })
      ).rejects.toThrow();
    });

    it('should throw error when local config file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      const fly = new Fly(defaultFlyConfig);
      await expect(
        fly.config.show({ config: mockDefs.unknownConfig, local: true })
      ).rejects.toThrow(
        `Config file '${mockDefs.unknownConfig}' does not exist`
      );
    });
  });

  describe('deploy', () => {
    it('should require config', async () => {
      const fly = new Fly(defaultFlyConfig);
      await expect(fly.deploy({ app: mockDefs.newApp })).rejects.toThrow(
        'Fly config file must be provided to options or class instance, unable to deploy'
      );
    });

    it('should accept config from class instance', async () => {
      const fly = new Fly({ ...defaultFlyConfig, config: mockDefs.testConfig });
      await expect(fly.deploy({ app: mockDefs.newApp })).resolves.not.toThrow();
    });

    it('should accept config from options', async () => {
      const fly = new Fly(defaultFlyConfig);
      await expect(
        fly.deploy({ app: mockDefs.newApp, config: mockDefs.testConfig })
      ).resolves.not.toThrow();
    });

    it('should throw error when config does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      const fly = new Fly(defaultFlyConfig);
      await expect(
        fly.deploy({ app: mockDefs.newApp, config: mockDefs.testConfig })
      ).rejects.toThrow(`Config file '${mockDefs.testConfig}' does not exist`);
    });

    it('should create new app when it does not exist', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.deploy({
        app: mockDefs.newApp,
        config: mockDefs.testConfig,
        org: mockDefs.org
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `apps create ${mockDefs.newApp} --org ${mockDefs.org}`
        )
      );
      expect(response).toEqual({
        app: mockDefs.newApp,
        hostname: `${mockDefs.newApp}.fly.dev`,
        url: `https://${mockDefs.newApp}.fly.dev`
      });
    });

    it('should not get secrets when app does not exist', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.deploy({
        app: mockDefs.newApp,
        config: mockDefs.testConfig,
        org: mockDefs.org
      });

      expect(mockExec).not.toHaveBeenCalledWith(
        expect.stringContaining('secrets list')
      );
    });

    it('should get app secrets when app exists', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.deploy({
        app: mockDefs.testApp,
        config: mockDefs.testConfig
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`secrets list --app ${mockDefs.testApp}`)
      );
    });

    it('should not automatically deploy when secrets are set for the app', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.deploy({
        app: mockDefs.testApp,
        config: mockDefs.testConfig,
        secrets: { NEW_SECRET: 'value' }
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets set --app ${mockDefs.testApp} --stage NEW_SECRET=value`
        )
      );
    });

    it('should preserve existing secrets on second deployment', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.deploy({
        app: mockDefs.testApp,
        config: mockDefs.testConfig,
        secrets: {
          [mockDefs.testSecret]: 'new-value',
          NEW_SECRET: 'value'
        }
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets set --app ${mockDefs.testApp} --stage NEW_SECRET=value`
        )
      );
    });

    it('should create app with name from provided config file and deploy with the same config', async () => {
      // setupFlyMocks([
      //   {
      //     cmdMatch: /config show/,
      //     resolveOrReject: 'resolve',
      //     output: JSON.stringify(mockShowConfigResponse('config-app'))
      //   }
      // ]);
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.deploy({
        config: mockDefs.newConfig
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`apps create ${mockDefs.newApp} --org personal`)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `deploy --app ${mockDefs.newApp} --config ${mockDefs.newConfig} --yes`
        )
      );
      expect(response).toEqual({
        app: mockDefs.newApp,
        hostname: `${mockDefs.newApp}.fly.dev`,
        url: `https://${mockDefs.newApp}.fly.dev`
      });
    });

    it('should create app with provided name and deploy with existing config', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.deploy({
        app: mockDefs.newApp,
        config: mockDefs.testConfig
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`apps create ${mockDefs.newApp} --org personal`)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `deploy --app ${mockDefs.newApp} --config ${mockDefs.testConfig} --yes`
        )
      );
      expect(response).toEqual({
        app: mockDefs.newApp,
        hostname: `${mockDefs.newApp}.fly.dev`,
        url: `https://${mockDefs.newApp}.fly.dev`
      });
    });

    it('should deploy to custom region', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.deploy({
        app: mockDefs.testApp,
        config: mockDefs.testConfig,
        region: 'eu'
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/deploy .* --region eu/)
      );
    });

    it('should set DEPLOY_ENV to environment', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.deploy({
        app: mockDefs.testApp,
        config: mockDefs.testConfig,
        environment: 'production'
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/deploy .* DEPLOY_ENV=production/)
      );
    });

    it('should auto-confirm deployment', async () => {
      const fly = new Fly(defaultFlyConfig);
      await fly.deploy({
        app: mockDefs.testApp,
        config: mockDefs.testConfig
      });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/deploy .* --yes/)
      );
    });
  });

  describe('secrets', () => {
    // Note! `secrets list` is already tested in the extensive test matrix
    it('should set secret and auto-deploy', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      await fly.secrets.set({ TEST_SECRET: 'value' });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets set --app ${mockDefs.testApp} TEST_SECRET=value`
        )
      );
    });

    it('should set secret and skip deployment', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      await fly.secrets.set({ TEST_SECRET: 'value' }, { stage: true });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets set --app ${mockDefs.testApp} --stage TEST_SECRET=value`
        )
      );
    });

    it('should set secret with spaces in value', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      await fly.secrets.set({ TEST_SECRET: 'value with space' });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets set --app ${mockDefs.testApp} TEST_SECRET=value\\ with\\ space`
        )
      );
    });

    it('should unset secret and auto-deploy', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      await fly.secrets.unset('TEST_SECRET');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets unset --app ${mockDefs.testApp} TEST_SECRET`
        )
      );
    });

    it('should unset secret and skip deployment', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      await fly.secrets.unset('TEST_SECRET', { stage: true });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets unset --app ${mockDefs.testApp} --stage TEST_SECRET`
        )
      );
    });

    it('should list secrets for instance app', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      const response = await fly.secrets.list();

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`secrets list --app ${mockDefs.testApp}`)
      );
      expect(response).toEqual(mockListSecretForAppResponse);
    });

    it('should list secrets for an app', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.secrets.list({ app: mockDefs.testApp });

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`secrets list --app ${mockDefs.testApp}`)
      );
      expect(response).toEqual(mockListSecretForAppResponse);
    });

    it('should list secrets for all apps', async () => {
      const fly = new Fly(defaultFlyConfig);
      const response = await fly.secrets.list('all');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('apps list')
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets list --app ${mockListSecretForAllResponse[0].app}`
        )
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `secrets list --app ${mockListSecretForAllResponse[1].app}`
        )
      );
      expect(response).toEqual(mockListSecretForAllResponse);
    });
  });

  describe('status', () => {
    it('should return status object', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      const status = await fly.status();

      expect(status).toEqual(mockStatusResponse(mockDefs.testApp));
    });

    it('should return status null when app does not exist', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.unknownApp });
      const status = await fly.status();

      expect(status).toBeNull();
    });
  });

  describe('statusExtended', () => {
    it('should return status object with domains and secrets', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.testApp });
      const status = await fly.statusExtended();

      expect(status).toEqual({
        ...mockStatusResponse(mockDefs.testApp),
        domains: expect.any(Array),
        secrets: expect.any(Array)
      });
    });

    it('should return null when app does not exist', async () => {
      const fly = new Fly({ ...defaultFlyConfig, app: mockDefs.unknownApp });
      const status = await fly.statusExtended();

      expect(status).toBeNull();
    });
  });
});
