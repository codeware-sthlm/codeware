import { logDebug, logWarning } from '@codeware/shared/util/misc';
import { runCommand } from '@codeware/shared/util/testing';
import type { PackageManager } from '@nx/devkit';
import { tmpProjPath } from '@nx/plugin/testing';

/**
 * Ensure pending pnpm build scripts are approved, then reinstall to relink.
 *
 * pnpm 10+ blocks build scripts for any dependency not explicitly allowed
 * (`allowBuilds` in `pnpm-workspace.yaml`), and a freshly created e2e
 * workspace has no such allowlist. `create-nx-workspace`, `nx add
 * @cdwr/nx-payload` and generating a Payload app each install packages with
 * postinstall scripts (`esbuild`, `sharp`, ...) - without approval that's a
 * hard install failure (`ERR_PNPM_IGNORED_BUILDS`), not just a warning.
 *
 * `pnpm approve-builds --all` accepts every pending script and records it in
 * `pnpm-workspace.yaml` for next time, but running it alone isn't enough: a
 * package whose build script replaces its own entry file - `esbuild` does
 * this, swapping its JS wrapper for the platform binary - leaves pnpm's
 * `.bin` shim pointing at the pre-build file. Verified directly: after
 * `approve-builds` alone, `node_modules/.bin/esbuild` crashed trying to
 * `require()` the now-native binary; a follow-up plain `pnpm install`
 * relinked it correctly.
 *
 * **Only applies to `pnpm`.** No-op for other package managers, which don't
 * gate build scripts this way.
 *
 * Call after any step that may have introduced dependencies with
 * postinstall scripts: after `create-nx-workspace`, after `nx add
 * @cdwr/nx-payload`, and after generating a Payload app. The return value
 * says whether anything was actually pending: a preceding `nx add`/`nx g`
 * that hit `ERR_PNPM_IGNORED_BUILDS` doesn't just warn, it **aborts before
 * running its own init/registration generator** - so the caller must retry
 * that same command when this returns `true`, or its effects (e.g. `nx.json`
 * plugin registration) never happen at all. Verified directly: without a
 * retry, `nx add @cdwr/nx-payload` recovers the blocked `esbuild` build but
 * leaves `nx.json` exactly as before, since `nx add` gave up before reaching
 * its init step.
 */
export const ensurePnpmApproveBuilds = async (
  packageManager: PackageManager
): Promise<boolean> => {
  if (packageManager !== 'pnpm') {
    return false;
  }

  const cwd = tmpProjPath();

  const approveOutput = await runCommand('pnpm approve-builds --all', {
    cwd
  });
  logDebug('pnpm approve-builds --all', approveOutput);

  if (approveOutput.includes('no packages awaiting approval')) {
    return false;
  }

  logWarning(
    'Approved pending pnpm build scripts, reinstalling to relink binaries',
    cwd
  );
  await runCommand('pnpm install', { cwd });

  return true;
};
