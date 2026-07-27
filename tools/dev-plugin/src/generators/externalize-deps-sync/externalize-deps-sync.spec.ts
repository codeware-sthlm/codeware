import type { ProjectGraph, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it } from 'vitest';

import { syncExternalizedDeps } from './externalize-deps-sync';

const MISC_ROOT = 'libs/shared/util/misc';
const MISC_MANIFEST = `${MISC_ROOT}/package.json`;
const PURE_ROOT = 'libs/shared/util/pure';
const PURE_MANIFEST = `${PURE_ROOT}/package.json`;
const RELEASE_ROOT = 'libs/shared/util/release';
const RELEASE_MANIFEST = `${RELEASE_ROOT}/package.json`;

/**
 * Minimal project graph fixture:
 * - `action` is an esbuild-bundled consumer that depends on `misc`
 * - `misc` imports a native `.node` addon (un-bundleable) + a bundleable dep,
 *   and is reached by the bundling consumer → needs a manifest
 * - `pure` imports only bundleable deps → no manifest
 * - `release` imports an un-bundleable dep but has no bundling consumer
 *   (tsx-only, like the real `release-cli`) → no manifest
 */
function graphFixture(): ProjectGraph {
  return {
    nodes: {
      action: {
        name: 'action',
        type: 'app',
        data: {
          root: 'packages/action',
          targets: { build: { executor: '@nx/esbuild:esbuild' } }
        }
      },
      'shared-util-misc': {
        name: 'shared-util-misc',
        type: 'lib',
        data: { root: MISC_ROOT }
      },
      'shared-util-pure': {
        name: 'shared-util-pure',
        type: 'lib',
        data: { root: PURE_ROOT }
      },
      'shared-util-release': {
        name: 'shared-util-release',
        type: 'lib',
        data: { root: RELEASE_ROOT }
      }
    },
    dependencies: {
      action: [
        { source: 'action', target: 'shared-util-misc', type: 'static' }
      ],
      'shared-util-misc': [
        {
          source: 'shared-util-misc',
          target: 'npm:@homebridge/node-pty-prebuilt-multiarch',
          type: 'static'
        },
        { source: 'shared-util-misc', target: 'npm:chalk', type: 'static' }
      ],
      'shared-util-pure': [
        {
          source: 'shared-util-pure',
          target: 'npm:tiny-invariant',
          type: 'static'
        }
      ],
      'shared-util-release': [
        {
          source: 'shared-util-release',
          target: 'npm:@nx/devkit',
          type: 'static'
        }
      ]
    },
    externalNodes: {
      'npm:@homebridge/node-pty-prebuilt-multiarch': {
        type: 'npm',
        name: 'npm:@homebridge/node-pty-prebuilt-multiarch',
        data: {
          version: '0.13.1',
          packageName: '@homebridge/node-pty-prebuilt-multiarch',
          hash: ''
        }
      },
      'npm:chalk': {
        type: 'npm',
        name: 'npm:chalk',
        data: { version: '4.1.2', packageName: 'chalk', hash: '' }
      },
      'npm:@nx/devkit': {
        type: 'npm',
        name: 'npm:@nx/devkit',
        data: { version: '23.1.0', packageName: '@nx/devkit', hash: '' }
      }
    }
  } as unknown as ProjectGraph;
}

function readManifest(tree: Tree, path: string) {
  const raw = tree.read(path, 'utf-8');
  return raw ? JSON.parse(raw) : undefined;
}

describe('externalize-deps-sync generator', () => {
  it('creates a private manifest for a lib importing an un-bundleable dep', async () => {
    const tree = createTreeWithEmptyWorkspace();

    const result = await syncExternalizedDeps(tree, graphFixture());

    expect(result).toBeTruthy();
    const manifest = readManifest(tree, MISC_MANIFEST);
    expect(manifest).toEqual({
      name: '@codeware/shared-util-misc',
      version: '0.0.1',
      type: 'module',
      private: true,
      dependencies: {
        '@homebridge/node-pty-prebuilt-multiarch': '0.13.1'
      }
    });
  });

  it('does not create a manifest for a lib importing only bundleable deps', async () => {
    const tree = createTreeWithEmptyWorkspace();

    await syncExternalizedDeps(tree, graphFixture());

    expect(tree.exists(PURE_MANIFEST)).toBe(false);
  });

  it('does not create a manifest for a tsx-only lib with no bundling consumer', async () => {
    const tree = createTreeWithEmptyWorkspace();

    // `release` imports an un-bundleable dep but is never bundled — it must be
    // left alone (the false positive the bundling discriminator guards against).
    await syncExternalizedDeps(tree, graphFixture());

    expect(tree.exists(RELEASE_MANIFEST)).toBe(false);
  });

  it('is a no-op when the manifest is already in sync', async () => {
    const tree = createTreeWithEmptyWorkspace();

    // First pass creates the manifest.
    await syncExternalizedDeps(tree, graphFixture());
    // Second pass over the same state must report nothing out of sync.
    const result = await syncExternalizedDeps(tree, graphFixture());

    expect(result).toBeUndefined();
  });

  it('re-adds an un-bundleable dep removed from the manifest', async () => {
    const tree = createTreeWithEmptyWorkspace();
    // Manifest exists but the native dep was dropped — the classic regression.
    tree.write(
      MISC_MANIFEST,
      JSON.stringify(
        {
          name: '@codeware/shared-util-misc',
          version: '0.0.1',
          type: 'module',
          private: true,
          dependencies: { chalk: '4.1.2' }
        },
        null,
        2
      )
    );

    const result = await syncExternalizedDeps(tree, graphFixture());

    expect(result).toBeTruthy();
    const manifest = readManifest(tree, MISC_MANIFEST);
    expect(manifest.dependencies).toMatchObject({
      '@homebridge/node-pty-prebuilt-multiarch': '0.13.1'
    });
    // Pre-existing bundleable deps are preserved.
    expect(manifest.dependencies.chalk).toBe('4.1.2');
  });

  it('re-adds "type": "module" when it was removed', async () => {
    const tree = createTreeWithEmptyWorkspace();
    // A manifest without `type: module` makes node treat the lib as CommonJS.
    tree.write(
      MISC_MANIFEST,
      JSON.stringify(
        {
          name: '@codeware/shared-util-misc',
          version: '0.0.1',
          private: true,
          dependencies: {
            '@homebridge/node-pty-prebuilt-multiarch': '0.13.1'
          }
        },
        null,
        2
      )
    );

    const result = await syncExternalizedDeps(tree, graphFixture());

    expect(result).toBeTruthy();
    expect(readManifest(tree, MISC_MANIFEST).type).toBe('module');
  });

  it('throws an actionable error when the dep is not resolved at the root', async () => {
    const tree = createTreeWithEmptyWorkspace();
    const graph = graphFixture();
    if (graph.externalNodes) {
      delete graph.externalNodes['npm:@homebridge/node-pty-prebuilt-multiarch'];
    }

    await expect(syncExternalizedDeps(tree, graph)).rejects.toThrow(
      /not resolved at the workspace root/
    );
  });
});
