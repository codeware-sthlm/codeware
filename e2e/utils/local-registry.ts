import { execSync, fork } from 'child_process';

type Options = {
  localRegistryTarget: string;
  storage: string;
  verbose?: boolean;
  clearStorage?: boolean;
};

/**
 * A local copy of `startLocalRegistry` from `@nx/js/plugins/jest/local-registry`,
 * which is limited to listen to `localhost` only.
 * That will make `listenAddress` option in `@nx/js:verdaccio` useless.
 *
 * This function implements a fix that will make any host possible to use.
 */
export function localRegistry({
  localRegistryTarget,
  storage,
  verbose,
  clearStorage
}: Options) {
  if (!localRegistryTarget) {
    throw new Error(`localRegistryTarget is required`);
  }
  return new Promise((resolve, reject) => {
    const childProcess = fork(
      require.resolve('nx'),
      [
        ...`run ${localRegistryTarget} --location none --clear ${clearStorage ?? true}`.split(
          ' '
        ),
        ...(storage ? [`--storage`, storage] : [])
      ],
      { stdio: 'pipe' }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (data: any) => {
      if (verbose) {
        process.stdout.write(data);
      }
      const dataStr = String(data);

      // Fixed support for custom host
      const match = dataStr.match(/http:\/\/(?<host>[^:/]+)(:(?<port>\d+))?/);

      if (match) {
        const host = match.groups?.host;
        const port = match.groups?.port;
        console.log(`Local registry started on host '${host}' port '${port}'`);
        const registry = `http://${host}:${port}`;
        process.env.npm_config_registry = registry;

        execSync(
          `npm config set //${host}:${port}/:_authToken "secretVerdaccioToken"`,
          {
            windowsHide: true
          }
        );

        // yarnv1
        process.env.YARN_REGISTRY = registry;

        // yarnv2
        process.env.YARN_NPM_REGISTRY_SERVER = registry;
        process.env.YARN_UNSAFE_HTTP_WHITELIST = host;
        console.log('Set npm and yarn config registry to ' + registry);

        resolve(() => {
          childProcess.kill();
          execSync(`npm config delete //${host}:${port}/:_authToken`, {
            windowsHide: true
          });
        });
        childProcess?.stdout?.off('data', listener);
      }
    };

    childProcess?.stdout?.on('data', listener);

    childProcess?.stderr?.on('data', (data) => {
      process.stderr.write(data);
    });

    childProcess.on('error', (err) => {
      console.log('local registry error', err);
      reject(err);
    });

    childProcess.on('exit', (code) => {
      console.log('local registry exit', code);
      if (code !== 0) {
        reject(code);
      } else {
        resolve(() => {
          // noop
        });
      }
    });
  });
}
