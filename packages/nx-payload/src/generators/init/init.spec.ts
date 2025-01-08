import { type Tree, addDependenciesToPackageJson, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import type { PackageJson } from 'nx/src/utils/package-json';

import { initGenerator } from './init';

describe('init', () => {
  let tree: Tree;

  console.log = jest.fn();
  console.warn = jest.fn();

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate correct dependencies in package.json', async () => {
    await initGenerator(tree, {});
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    // Versions number can be updated by pipelines or similar tools,
    // so we only match for semantic patterns.
    const dynamicVersion = /^[^|~]?\d+\.\d+\.\d+$/;
    expect(packageJson).toMatchSnapshot({
      dependencies: {
        '@payloadcms/bundler-webpack': expect.stringMatching(dynamicVersion),
        '@payloadcms/db-mongodb': expect.stringMatching(dynamicVersion),
        '@payloadcms/db-postgres': expect.stringMatching(dynamicVersion),
        '@payloadcms/richtext-slate': expect.stringMatching(dynamicVersion),
        payload: expect.stringMatching(dynamicVersion),
        zod: 'latest'
      },
      devDependencies: {
        '@nx/node': expect.stringMatching(/^\d+\.\d+\.\d+$/)
      }
    });
  });

  it('should keep existing dependencies', async () => {
    const existing = 'existing';
    const existingVersion = '1.0.0';
    const dependencies = {
      [existing]: existingVersion
    };
    const devDependencies = {
      [existing]: existingVersion
    };
    addDependenciesToPackageJson(tree, dependencies, devDependencies);

    await initGenerator(tree, {});
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies[existing]).toBeDefined();
    expect(packageJson.devDependencies[existing]).toBeDefined();
  });
});
