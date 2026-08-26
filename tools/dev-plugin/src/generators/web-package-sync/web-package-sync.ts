import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { type Tree, createProjectGraphAsync } from '@nx/devkit';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { format, resolveConfig } from 'prettier';

const WEB_PROJECT_ROOT = 'apps/web';
const WEB_PACKAGE_JSON = `${WEB_PROJECT_ROOT}/package.json`;

/**
 * `apps/web` is NOT a pnpm workspace member — the root `pnpm-workspace.yaml`
 * carries no `packages:` field, so the root lockfile still has a single
 * importer. `apps/web` has its own `pnpm-workspace.yaml` (settings only, e.g.
 * `allowBuilds`) alongside its standalone lockfile. Its `package.json` is a
 * hand-curated runtime manifest consumed only by the Docker runtime stage
 * (`apps/web/Dockerfile`), which installs from it.
 *
 * That runtime install was lockfile-less, so it re-resolved dependency ranges
 * against the live registry at image-build time — versions could drift from
 * what the workspace actually built and tested (this is how an ESM-only
 * transitive slipped in and crash-looped the app at runtime).
 *
 * This sync generator makes the root workspace the single source of truth:
 *   1. Pin every dependency listed in `apps/web/package.json` to the exact
 *      version the workspace resolved, read from the Nx project graph's
 *      external nodes (Nx's own parse of the committed root lockfile — no
 *      dependency on an installed `node_modules`).
 *   2. Regenerate `apps/web/pnpm-lock.yaml` from the pinned manifest (post-flush
 *      callback) so the Docker `--frozen-lockfile` install is reproducible.
 *
 * Renovate is barred from `apps/web/package.json` (`ignorePaths` in
 * `.github/renovate.json`) so it only ever bumps the root; `nx sync` re-pins
 * and re-locks web.
 */
export async function webPackageSyncGenerator(
  tree: Tree
): Promise<SyncGeneratorResult | void> {
  const raw = tree.read(WEB_PACKAGE_JSON, 'utf-8');
  if (!raw) {
    throw new Error(`web-package-sync: '${WEB_PACKAGE_JSON}' not found.`);
  }

  const pkg = JSON.parse(raw) as {
    dependencies?: Record<string, string>;
  };
  const deps = pkg.dependencies ?? {};

  // Resolved versions come from Nx's project graph, which parses the committed
  // root lockfile — the same versions CI installs with --frozen-lockfile.
  const { externalNodes } = await createProjectGraphAsync({
    exitOnError: false
  });

  // Pin each dependency to the version resolved at the workspace root.
  const missing: string[] = [];
  for (const name of Object.keys(deps)) {
    const resolved = externalNodes?.[`npm:${name}`]?.data.version;
    if (!resolved) {
      missing.push(name);
      continue;
    }
    deps[name] = resolved;
  }

  if (missing.length > 0) {
    throw new Error(
      `web-package-sync: these 'apps/web' dependencies are not resolved at the workspace root — add them to the root 'package.json' first:\n  ${missing.join('\n  ')}`
    );
  }

  const prettierConfig = await resolveConfig(WEB_PACKAGE_JSON);
  const content = await format(JSON.stringify(pkg), {
    ...prettierConfig,
    filepath: WEB_PACKAGE_JSON
  });

  if (content === raw) {
    return;
  }

  tree.write(WEB_PACKAGE_JSON, content);

  return {
    outOfSyncMessage: `'${WEB_PACKAGE_JSON}' pinned to the versions resolved at the workspace root.`,
    // Runs only when changes are applied (not in `--check`): regenerate the
    // standalone lockfile the Docker runtime stage installs with --frozen-lockfile.
    callback: () => {
      execFileSync(
        'pnpm',
        ['install', '--lockfile-only', '--ignore-workspace'],
        { cwd: join(tree.root, WEB_PROJECT_ROOT), stdio: 'inherit' }
      );
    }
  };
}

export default webPackageSyncGenerator;
