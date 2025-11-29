import { type Tree, addDependenciesToPackageJson, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import type { PackageJson } from 'nx/src/utils/package-json';

import {
  graphqlVersion,
  next15Version,
  payloadVersion,
  testingLibraryDomVersion,
  testingLibraryJestDomVersion,
  testingLibraryReactVersion
} from '../../utils/versions';

import { initGenerator } from './init';
import type { InitSchema } from './schema';

describe('init', () => {
  let tree: Tree;
  const options: InitSchema = {
    skipFormat: true
  };

  console.log = jest.fn();
  console.warn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate correct dependencies in package.json', async () => {
    await initGenerator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson).toEqual({
      dependencies: {
        '@payloadcms/db-mongodb': payloadVersion,
        '@payloadcms/db-postgres': payloadVersion,
        '@payloadcms/next': payloadVersion,
        '@payloadcms/richtext-lexical': payloadVersion,
        graphql: graphqlVersion,
        next: next15Version,
        payload: payloadVersion
      },
      devDependencies: {
        '@payloadcms/graphql': payloadVersion,
        '@testing-library/dom': testingLibraryDomVersion,
        '@testing-library/jest-dom': testingLibraryJestDomVersion,
        '@testing-library/react': testingLibraryReactVersion
      },
      name: expect.any(String)
    });
  });

  it('should not add Next.js dependency when already present', async () => {
    const existingNextVersion = '16.0.0';
    addDependenciesToPackageJson(tree, { next: existingNextVersion }, {});

    await initGenerator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['next']).toBe(existingNextVersion);
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

    await initGenerator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies[existing]).toBeDefined();
    expect(packageJson.devDependencies[existing]).toBeDefined();
  });
});
