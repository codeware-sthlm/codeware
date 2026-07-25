import { existsSync } from 'fs';

import { logWarning } from '@codeware/shared/util/misc';
import { readDependencyVersion } from '@codeware/shared/util/node';
import { tmpProjPath, updateFile } from '@nx/plugin/testing';

/**
 * Ensure the generated workspace type checks under TypeScript 6.
 *
 * `create-nx-workspace` still emits the deprecated `baseUrl` option in
 * `tsconfig.base.json`. From TypeScript 6.0 that deprecation is a hard error
 * unless `ignoreDeprecations: "6.0"` is set, which breaks `next build`.
 *
 * This is an **e2e-only** accommodation so the suite can run against whatever
 * TypeScript `create-nx-workspace` installs. It is intentionally **not** part
 * of the `@cdwr/nx-payload` generators - pinning/relaxing TypeScript in a
 * consumer workspace is not the plugin's responsibility.
 *
 * Call this **after** the payload app has been generated - the app generator is
 * what installs TypeScript, so calling it earlier (e.g. right after an empty
 * `apps`-preset workspace is created) reads a `package.json` without a
 * `typescript` pin and no-ops. With the `@cdwr/nx-payload` preset the app is
 * generated during workspace creation, so the pin is already present there.
 *
 * No-op when TypeScript is older than 6 (where `ignoreDeprecations: "6.0"` is
 * itself invalid), when the `typescript` pin is missing, or when `baseUrl` is
 * absent.
 *
 * **Remove when `create-nx-workspace` no longer emits `baseUrl`.**
 */
export const ensureTs6TsconfigCompat = (): void => {
  // The `typescript` pin is the workspace's declared spec (e.g. `~5.9.0`,
  // `^6.0.0`), so the leading number is the major it installs.
  const typescript = readDependencyVersion('typescript', {
    cwd: tmpProjPath()
  });
  if (typescript?.major === undefined || typescript.major < 6) {
    return;
  }

  const tsconfigBase = `${tmpProjPath()}/tsconfig.base.json`;
  if (!existsSync(tsconfigBase)) {
    return;
  }

  let applied = false;
  updateFile('tsconfig.base.json', (content) => {
    const tsconfig = JSON.parse(content);
    const compilerOptions = tsconfig?.compilerOptions ?? {};

    if (!compilerOptions?.baseUrl || compilerOptions?.ignoreDeprecations) {
      return content;
    }

    compilerOptions.ignoreDeprecations = '6.0';
    tsconfig.compilerOptions = compilerOptions;
    applied = true;
    return JSON.stringify(tsconfig, null, 2);
  });

  if (applied) {
    logWarning(
      `Set tsconfig.base.json ignoreDeprecations for TypeScript ${typescript.version}`,
      'Remove when create-nx-workspace drops baseUrl'
    );
  }
};
