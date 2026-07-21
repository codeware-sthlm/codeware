import { type Tree, readJson, updateJson, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { addPathAlias } from './add-path-alias';
import type { NormalizedSchema } from './normalize-options';

describe('addPathAlias', () => {
  let tree: Tree;

  const options = {
    directory: 'apps/app-default'
  } as NormalizedSchema;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    writeJson(tree, 'tsconfig.base.json', { compilerOptions: {} });
  });

  const setTypeScript = (spec: string | undefined): void => {
    updateJson(tree, 'package.json', (json) => {
      json.devDependencies ??= {};
      if (spec === undefined) {
        delete json.devDependencies.typescript;
      } else {
        json.devDependencies.typescript = spec;
      }
      return json;
    });
  };

  it('adds an unprefixed, baseUrl-relative alias on TypeScript 5', () => {
    setTypeScript('~5.9.0');

    addPathAlias(tree, options);

    const { compilerOptions } = readJson(tree, 'tsconfig.base.json');
    expect(compilerOptions.baseUrl).toBe('.');
    expect(compilerOptions.paths['@payload-config']).toEqual([
      'apps/app-default/src/payload.config.ts'
    ]);
  });

  it('adds a ./-prefixed alias without baseUrl on TypeScript 6', () => {
    setTypeScript('~6.0.3');

    addPathAlias(tree, options);

    const { compilerOptions } = readJson(tree, 'tsconfig.base.json');
    expect(compilerOptions.baseUrl).toBeUndefined();
    expect(compilerOptions.paths['@payload-config']).toEqual([
      './apps/app-default/src/payload.config.ts'
    ]);
  });

  it('defaults to the ./-prefixed alias when TypeScript is not declared', () => {
    setTypeScript(undefined);

    addPathAlias(tree, options);

    const { compilerOptions } = readJson(tree, 'tsconfig.base.json');
    expect(compilerOptions.baseUrl).toBeUndefined();
    expect(compilerOptions.paths['@payload-config']).toEqual([
      './apps/app-default/src/payload.config.ts'
    ]);
  });

  it('is a no-op when the alias already exists', () => {
    setTypeScript('~6.0.3');
    updateJson(tree, 'tsconfig.base.json', (json) => {
      json.compilerOptions.paths = {
        '@payload-config': ['existing/value.ts']
      };
      return json;
    });

    addPathAlias(tree, options);

    const { compilerOptions } = readJson(tree, 'tsconfig.base.json');
    expect(compilerOptions.paths['@payload-config']).toEqual([
      'existing/value.ts'
    ]);
  });
});
