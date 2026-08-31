import type { ProjectGraph, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it } from 'vitest';

import { syncWebPackage } from './web-package-sync';

const WEB_PACKAGE_JSON = 'apps/web/package.json';
const WEB_LOCK_FILE = 'apps/web/pnpm-lock.yaml';

const RESOLVED: Record<string, string> = {
  '@remix-run/react': '2.17.3',
  clsx: '2.1.1',
  zod: '3.25.76'
};

/**
 * Only `externalNodes` matters here — the generator reads resolved versions and
 * nothing else off the graph.
 */
function graphFixture(): ProjectGraph {
  return {
    nodes: {},
    dependencies: {},
    externalNodes: Object.fromEntries(
      Object.entries(RESOLVED).map(([packageName, version]) => [
        `npm:${packageName}`,
        {
          type: 'npm',
          name: `npm:${packageName}`,
          data: { version, packageName, hash: '' }
        }
      ])
    )
  } as unknown as ProjectGraph;
}

/**
 * Mirrors the real lockfile: quoted and unquoted entry names, an `overrides`
 * block above `importers`, and `packages` / `snapshots` below it.
 */
function lockFixture(names: Array<string>): string {
  const entries = [...names].sort().map((name) => {
    const key = name.startsWith('@') ? `'${name}'` : name;
    return `      ${key}:\n        specifier: ${RESOLVED[name]}\n        version: ${RESOLVED[name]}`;
  });

  return [
    "lockfileVersion: '9.0'",
    '',
    'settings:',
    '  autoInstallPeers: true',
    '  excludeLinksFromLockfile: false',
    '',
    'overrides:',
    "  fast-xml-parser: '>=5.7.0'",
    '',
    'importers:',
    '',
    '  .:',
    '    dependencies:',
    ...entries,
    '',
    'packages:',
    '',
    '  clsx@2.1.1:',
    '    resolution: {integrity: sha512-fake}',
    '',
    'snapshots:',
    '',
    '  clsx@2.1.1: {}',
    ''
  ].join('\n');
}

function writeWeb(
  tree: Tree,
  deps: Record<string, string>,
  lockNames: Array<string>
) {
  tree.write(
    WEB_PACKAGE_JSON,
    JSON.stringify({ name: 'web', private: true, dependencies: deps })
  );
  tree.write(WEB_LOCK_FILE, lockFixture(lockNames));
}

/**
 * The generator's own output for a manifest that is already in sync — lets the
 * removal case start from a manifest that needs no re-pinning, so the lockfile
 * is the only thing left that can report out of sync.
 */
async function canonicalManifest(
  deps: Record<string, string>
): Promise<string> {
  const tree = createTreeWithEmptyWorkspace();
  writeWeb(tree, deps, Object.keys(deps));
  await syncWebPackage(tree, graphFixture());

  return tree.read(WEB_PACKAGE_JSON, 'utf-8') as string;
}

function importerNames(tree: Tree): Array<string> {
  const lock = tree.read(WEB_LOCK_FILE, 'utf-8') as string;
  const block = lock.slice(
    lock.indexOf('    dependencies:'),
    lock.indexOf('packages:')
  );

  return [...block.matchAll(/^ {6}'?([^'\s:]+)'?:$/gm)].map(
    (match) => match[1]
  );
}

describe('web-package-sync generator', () => {
  it('pins a dependency to the version resolved at the workspace root', async () => {
    const tree = createTreeWithEmptyWorkspace();
    writeWeb(tree, { clsx: '^2.0.0' }, ['clsx']);

    const result = await syncWebPackage(tree, graphFixture());

    expect(result).toBeTruthy();
    const manifest = JSON.parse(tree.read(WEB_PACKAGE_JSON, 'utf-8') as string);
    expect(manifest.dependencies).toEqual({ clsx: '2.1.1' });
  });

  it('is a no-op when the manifest and the lockfile agree', async () => {
    const tree = createTreeWithEmptyWorkspace();
    tree.write(WEB_PACKAGE_JSON, await canonicalManifest({ clsx: '2.1.1' }));
    tree.write(WEB_LOCK_FILE, lockFixture(['clsx']));

    const result = await syncWebPackage(tree, graphFixture());

    expect(result).toBeUndefined();
  });

  it('reports out of sync when a dependency was removed from the manifest', async () => {
    const tree = createTreeWithEmptyWorkspace();
    // Manifest is already pinned, so pinning alone finds nothing to do — the
    // lockfile is the only remaining signal. This is the reported bug.
    tree.write(WEB_PACKAGE_JSON, await canonicalManifest({ clsx: '2.1.1' }));
    tree.write(WEB_LOCK_FILE, lockFixture(['clsx', 'zod']));

    const result = await syncWebPackage(tree, graphFixture());

    expect(result).toBeTruthy();
    expect(result?.outOfSyncMessage).toContain('zod');
    expect(importerNames(tree)).toEqual(['clsx']);
  });

  it('prunes every removed dependency and leaves the rest of the lockfile alone', async () => {
    const tree = createTreeWithEmptyWorkspace();
    tree.write(WEB_PACKAGE_JSON, await canonicalManifest({ clsx: '2.1.1' }));
    tree.write(WEB_LOCK_FILE, lockFixture(['@remix-run/react', 'clsx', 'zod']));

    await syncWebPackage(tree, graphFixture());

    // Scoped names are quoted in the lockfile — both forms must be pruned.
    expect(importerNames(tree)).toEqual(['clsx']);

    const lock = tree.read(WEB_LOCK_FILE, 'utf-8') as string;
    expect(lock).toContain("overrides:\n  fast-xml-parser: '>=5.7.0'");
    expect(lock).toContain('  clsx@2.1.1:\n    resolution:');
    expect(lock).toContain('snapshots:\n\n  clsx@2.1.1: {}');
  });

  it('returns the re-lock callback without running it', async () => {
    const tree = createTreeWithEmptyWorkspace();
    tree.write(WEB_PACKAGE_JSON, await canonicalManifest({ clsx: '2.1.1' }));
    tree.write(WEB_LOCK_FILE, lockFixture(['clsx', 'zod']));

    const result = await syncWebPackage(tree, graphFixture());

    expect(result && 'callback' in result && result.callback).toBeTypeOf(
      'function'
    );
  });

  it('throws when a manifest dependency is missing from the lockfile', async () => {
    const tree = createTreeWithEmptyWorkspace();
    writeWeb(tree, { clsx: '2.1.1', zod: '3.25.76' }, ['clsx']);

    await expect(syncWebPackage(tree, graphFixture())).rejects.toThrow(
      /missing from 'apps\/web\/pnpm-lock\.yaml'/
    );
  });

  it('throws when a dependency is not resolved at the workspace root', async () => {
    const tree = createTreeWithEmptyWorkspace();
    writeWeb(tree, { 'date-fns': '4.1.0' }, ['clsx']);

    await expect(syncWebPackage(tree, graphFixture())).rejects.toThrow(
      /not resolved at the workspace root/
    );
  });

  it('throws when the lockfile is absent', async () => {
    const tree = createTreeWithEmptyWorkspace();
    tree.write(WEB_PACKAGE_JSON, JSON.stringify({ dependencies: {} }));

    await expect(syncWebPackage(tree, graphFixture())).rejects.toThrow(
      /'apps\/web\/pnpm-lock\.yaml' not found/
    );
  });
});
