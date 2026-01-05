import { type Tree, addDependenciesToPackageJson, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import type { PackageJson } from 'nx/src/utils/package-json';

import {
  graphqlVersion,
  next15Version,
  payloadCommonJSVersion,
  payloadESMVersion
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

  it('should use Payload version for CommonJS workspace', async () => {
    await initGenerator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson).toMatchObject({
      dependencies: {
        '@payloadcms/db-mongodb': payloadCommonJSVersion,
        '@payloadcms/db-postgres': payloadCommonJSVersion,
        '@payloadcms/next': payloadCommonJSVersion,
        '@payloadcms/richtext-lexical': payloadCommonJSVersion,
        payload: payloadCommonJSVersion
      },
      devDependencies: {
        '@payloadcms/graphql': payloadCommonJSVersion
      }
    });
  });

  it('should use Payload version for ESM workspaces', async () => {
    const packageJsonESM = readJson<PackageJson>(tree, 'package.json');
    packageJsonESM.type = 'module';
    tree.write('package.json', JSON.stringify(packageJsonESM, null, 2));

    await initGenerator(tree, options);

    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson).toMatchObject({
      dependencies: {
        '@payloadcms/db-mongodb': payloadESMVersion,
        '@payloadcms/db-postgres': payloadESMVersion,
        '@payloadcms/next': payloadESMVersion,
        '@payloadcms/richtext-lexical': payloadESMVersion,
        payload: payloadESMVersion
      },
      devDependencies: {
        '@payloadcms/graphql': payloadESMVersion
      }
    });
  });

  it('should add external dependencies', async () => {
    await initGenerator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson).toMatchObject({
      dependencies: {
        graphql: graphqlVersion,
        next: next15Version
      }
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
