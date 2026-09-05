import { join } from 'path';
import { cwd } from 'process';

import { logDebug, logWarning } from '@codeware/shared/util/misc';
import { runCommand } from '@codeware/shared/util/testing';
import { type PackageManager, readJsonFile } from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import type { PackageJson } from 'nx/src/utils/package-json';

/**
 * Pin the plugin's `@nx/*` peers to the workspace's own nx version.
 *
 * `nx add @cdwr/nx-payload` leaves its peers to the package manager, which
 * resolves an open range like `^23.0.0` to whatever is newest on the registry.
 * The workspace itself is created by `create-nx-workspace` at a pinned version,
 * so the day Nx publishes a patch the two drift apart and a generator dies on
 * an internal helper the older core does not export.
 *
 * Installing them explicitly first leaves nothing for that resolution to
 * decide, which also keeps the run reproducible: a green build stays green
 * regardless of what was published since.
 *
 * @param packageManager Package manager used for the test workspace
 */
export const ensureAlignedNxPeers = async (
  packageManager: PackageManager
): Promise<void> => {
  // The workspace is the authority, not the version we asked for - the fallback
  // path resolves `latest`, and only the install knows what that turned out to be
  const workspaceJson = readJson<PackageJson>('package.json');
  const nxVersion =
    workspaceJson.devDependencies?.['nx'] ?? workspaceJson.dependencies?.['nx'];

  if (!nxVersion) {
    logWarning('Could not resolve the workspace nx version, peers left open');
    return;
  }

  const pluginJson = readJsonFile<PackageJson>(
    join(cwd(), 'packages/nx-payload/package.json')
  );
  const peers = Object.keys(pluginJson.peerDependencies ?? {}).filter((name) =>
    name.startsWith('@nx/')
  );

  if (!peers.length) {
    return;
  }

  const pinned = peers.map((name) => `${name}@${nxVersion}`);
  logDebug('Pin plugin peers to the workspace nx version', pinned.join(', '));

  const install = packageManager === 'npm' ? 'install' : 'add';
  await runCommand(`${packageManager} ${install} -D ${pinned.join(' ')}`);
};
