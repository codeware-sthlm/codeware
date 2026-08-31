import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import {
  type ProjectGraph,
  type Tree,
  createProjectGraphAsync
} from '@nx/devkit';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { format, resolveConfig } from 'prettier';

const WEB_PROJECT_ROOT = 'apps/web';
const WEB_PACKAGE_JSON = `${WEB_PROJECT_ROOT}/package.json`;
const WEB_LOCK_FILE = `${WEB_PROJECT_ROOT}/pnpm-lock.yaml`;
const RELOCK_COMMAND = `cd ${WEB_PROJECT_ROOT} && pnpm install --lockfile-only`;

type LockEntry = {
  name: string;
  /** First line of the entry, inclusive */
  start: number;
  /** Line after the entry, exclusive */
  end: number;
};

/**
 * Locate each dependency entry under `importers` → `.` → `dependencies`.
 *
 * Scanned line by line rather than parsed: `dev-plugin` carries no YAML
 * dependency, and a parse/serialise round trip would reformat all ~4k lines,
 * burying the real change in the `nx sync` diff.
 */
function readImporterDependencies(lines: string[]): Array<LockEntry> {
  const indentOf = (line: string) => line.length - line.trimStart().length;

  const importers = lines.findIndex((line) => line === 'importers:');
  if (importers === -1) {
    return [];
  }

  let cursor = importers + 1;
  const inImporters = () =>
    cursor < lines.length &&
    (lines[cursor].trim() === '' || indentOf(lines[cursor]) >= 2);

  // `importers` → `.`
  while (inImporters() && lines[cursor] !== '  .:') {
    cursor++;
  }
  if (!inImporters()) {
    return [];
  }
  cursor++;

  // `.` → `dependencies`
  const inRootImporter = () =>
    cursor < lines.length &&
    (lines[cursor].trim() === '' || indentOf(lines[cursor]) >= 4);

  while (inRootImporter() && lines[cursor] !== '    dependencies:') {
    cursor++;
  }
  if (!inRootImporter()) {
    return [];
  }
  cursor++;

  const entries: Array<LockEntry> = [];
  while (
    cursor < lines.length &&
    (lines[cursor].trim() === '' || indentOf(lines[cursor]) >= 6)
  ) {
    const match = /^ {6}(?:'([^']+)'|([^\s:]+)):$/.exec(lines[cursor]);
    if (!match) {
      cursor++;
      continue;
    }

    const start = cursor++;
    while (
      cursor < lines.length &&
      lines[cursor].trim() !== '' &&
      indentOf(lines[cursor]) >= 8
    ) {
      cursor++;
    }

    entries.push({ name: match[1] ?? match[2], start, end: cursor });
  }

  return entries;
}

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
 *   2. Reconcile the manifest's dependency names against the ones the
 *      standalone lockfile declares, so a *removed* dependency is caught too —
 *      pinning alone never visits a key that is already gone.
 *   3. Regenerate `apps/web/pnpm-lock.yaml` from the pinned manifest (post-flush
 *      callback) so the Docker `--frozen-lockfile` install is reproducible.
 *
 * `.github/renovate.json` keeps Renovate off both files — `ignorePaths` for the
 * manifest, a `lockFileMaintenance` rule for the lockfile — so it only ever
 * bumps the root; `nx sync` re-pins and re-locks web.
 */
export async function syncWebPackage(
  tree: Tree,
  graph: ProjectGraph
): Promise<SyncGeneratorResult | void> {
  const raw = tree.read(WEB_PACKAGE_JSON, 'utf-8');
  if (!raw) {
    throw new Error(`web-package-sync: '${WEB_PACKAGE_JSON}' not found.`);
  }

  const rawLock = tree.read(WEB_LOCK_FILE, 'utf-8');
  if (!rawLock) {
    throw new Error(
      `web-package-sync: '${WEB_LOCK_FILE}' not found — the Docker runtime stage installs from it. Re-lock with '${RELOCK_COMMAND}'.`
    );
  }

  const pkg = JSON.parse(raw) as {
    dependencies?: Record<string, string>;
  };
  const deps = pkg.dependencies ?? {};

  // Pin each dependency to the version resolved at the workspace root.
  const missing: string[] = [];
  for (const name of Object.keys(deps)) {
    const resolved = graph.externalNodes?.[`npm:${name}`]?.data.version;
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

  // Being in sync is a statement about the lockfile, not only about versions:
  // a dependency removed from the manifest leaves every remaining pin correct.
  const lockLines = rawLock.split('\n');
  const lockEntries = readImporterDependencies(lockLines);
  const declared = new Set(Object.keys(deps));
  const locked = new Set(lockEntries.map((entry) => entry.name));

  // No resolution can be synthesised without running pnpm, so this direction
  // throws rather than writing a guessed `version:` into the lockfile. Nx keeps
  // sync results that carry an error, so `nx sync --check` still fails.
  const unlocked = Object.keys(deps).filter((name) => !locked.has(name));
  if (unlocked.length > 0) {
    throw new Error(
      `web-package-sync: these 'apps/web' dependencies are missing from '${WEB_LOCK_FILE}' — re-lock with '${RELOCK_COMMAND}':\n  ${unlocked.join('\n  ')}`
    );
  }

  const orphaned = lockEntries.filter((entry) => !declared.has(entry.name));

  const prettierConfig = await resolveConfig(WEB_PACKAGE_JSON);
  const content = await format(JSON.stringify(pkg), {
    ...prettierConfig,
    filepath: WEB_PACKAGE_JSON
  });

  const pinned = content !== raw;
  if (!pinned && orphaned.length === 0) {
    return;
  }

  const messages: string[] = [];

  if (pinned) {
    tree.write(WEB_PACKAGE_JSON, content);
    messages.push(
      `'${WEB_PACKAGE_JSON}' pinned to the versions resolved at the workspace root.`
    );
  }

  if (orphaned.length > 0) {
    // Prune only the importer entries — the callback re-locks and drops the
    // orphaned `packages:` / `snapshots:` records with it. Never delete the
    // lockfile to force a change: regenerating from nothing re-resolves every
    // transitive against the live registry, which is the drift this generator
    // exists to prevent.
    const dropped = new Set(orphaned.flatMap(rangeOf));
    tree.write(
      WEB_LOCK_FILE,
      lockLines.filter((_, index) => !dropped.has(index)).join('\n')
    );
    messages.push(
      `'${WEB_LOCK_FILE}' still declared ${orphaned.length} dependenc${orphaned.length === 1 ? 'y' : 'ies'} removed from the manifest: ${orphaned.map((entry) => entry.name).join(', ')}.`
    );
  }

  return {
    outOfSyncMessage: messages.join(' '),
    // Runs only when changes are applied (not in `--check`): regenerate the
    // standalone lockfile the Docker runtime stage installs with --frozen-lockfile.
    callback: () => {
      // No `--ignore-workspace`: it would skip `apps/web/pnpm-workspace.yaml`
      // and drop its `overrides` from the regenerated lockfile. pnpm already
      // stops at that file rather than walking up to the root workspace.
      execFileSync('pnpm', ['install', '--lockfile-only'], {
        cwd: join(tree.root, WEB_PROJECT_ROOT),
        stdio: 'inherit'
      });
    }
  };
}

function rangeOf({ start, end }: LockEntry): Array<number> {
  return Array.from({ length: end - start }, (_, offset) => start + offset);
}

/**
 * Global sync generator entry point. Registered in `nx.json`
 * (`sync.globalGenerators`) and enforced in CI via `nx sync --check`.
 *
 * Resolved versions come from Nx's project graph, which parses the committed
 * root lockfile — the same versions CI installs with --frozen-lockfile.
 */
export async function webPackageSyncGenerator(
  tree: Tree
): Promise<SyncGeneratorResult | void> {
  const graph = await createProjectGraphAsync({ exitOnError: false });
  return syncWebPackage(tree, graph);
}

export default webPackageSyncGenerator;
