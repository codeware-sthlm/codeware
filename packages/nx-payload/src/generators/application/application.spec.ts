import {
  type PluginConfiguration,
  type Tree,
  readJson,
  readNxJson,
  readProjectConfiguration,
  updateNxJson
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import type { PackageJson } from 'nx/src/utils/package-json';

import generator from './application';
import type { AppGeneratorSchema } from './schema';

describe('application generator', () => {
  let tree: Tree;
  const options: AppGeneratorSchema = {
    directory: 'apps/test-dir',
    name: 'test-app',
    skipFormat: true
  };

  console.log = jest.fn();
  console.warn = jest.fn();

  const setInferenceFlag = (useInferencePlugins?: boolean) => {
    const workspace = readNxJson(tree);
    if (useInferencePlugins === undefined) {
      delete workspace.useInferencePlugins;
    } else {
      workspace.useInferencePlugins = useInferencePlugins;
    }
    updateNxJson(tree, workspace);
  };

  const addInferencePlugin = (plugin: PluginConfiguration) => {
    const workspace = readNxJson(tree);
    workspace.plugins = workspace.plugins || [];
    workspace.plugins.push(plugin);
    updateNxJson(tree, workspace);
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should add payload dependency', async () => {
    await generator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['payload']).toBeDefined();
  });

  it('should add webpack bundler dependency', async () => {
    await generator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(
      packageJson.dependencies['@payloadcms/bundler-webpack']
    ).toBeDefined();
  });

  it('should add mongodb plugin dependency', async () => {
    await generator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['@payloadcms/db-mongodb']).toBeDefined();
  });

  it('should add postgres plugin dependency', async () => {
    await generator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['@payloadcms/db-postgres']).toBeDefined();
  });

  it('should add richtext slate editor plugin dependency', async () => {
    await generator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(
      packageJson.dependencies['@payloadcms/richtext-slate']
    ).toBeDefined();
  });

  it('should add dependencies for express', async () => {
    await generator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['express']).toBeDefined();
    expect(packageJson.dependencies['@nx/express']).toBeUndefined();
    expect(packageJson.devDependencies['@nx/express']).toBeDefined();
  });

  it('should not add dependencies for mongodb or postgres', async () => {
    await generator(tree, options);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['mongodb']).toBeUndefined();
    expect(packageJson.dependencies['pg']).toBeUndefined();

    expect(packageJson.devDependencies['mongodb']).toBeUndefined();
    expect(packageJson.devDependencies['pg']).toBeUndefined();
  });

  it('should add payload project files', async () => {
    await generator(tree, options);

    expect(
      tree.exists(`${options.directory}/src/payload.config.ts`)
    ).toBeTruthy();

    expect(tree.exists(`${options.directory}/eslint.config.js`)).toBeTruthy();

    expect(tree.exists(`${options.directory}/tsconfig.app.json`)).toBeTruthy();
    expect(tree.exists(`${options.directory}/tsconfig.json`)).toBeTruthy();
    expect(tree.exists(`${options.directory}/tsconfig.spec.json`)).toBeTruthy();

    expect(tree.exists(`${options.directory}/webpack.config.js`)).toBeTruthy();
  });

  it('should exclude folders with run-time generated files on build', async () => {
    await generator(tree, options);

    const content: {
      extends: string;
      compilerOptions: object;
      exclude: Array<string>;
      include: Array<string>;
    } = JSON.parse(
      tree.read(`${options.directory}/tsconfig.app.json`, 'utf-8')
    );

    expect(
      content.exclude.filter(
        (e) => e === 'src/generated/*.ts' || e === 'src/migrations/*.ts'
      ).length
    ).toBe(2);

    expect(content.extends).toBe('./tsconfig.json');
    expect(Object.keys(content.compilerOptions).length).toBeGreaterThan(0);
    expect(content.include.length).toBeGreaterThan(0);
  });

  it('should add express project files', async () => {
    await generator(tree, options);

    expect(tree.exists(`${options.directory}/webpack.config.js`)).toBeTruthy();
  });

  it('should create payload e2e application', async () => {
    await generator(tree, options);

    expect(tree.exists(`${options.directory}-e2e/project.json`)).toBeTruthy();
  });

  it('should skip payload e2e application', async () => {
    await generator(tree, { ...options, skipE2e: true });

    expect(tree.exists(`${options.directory}-e2e/project.json`)).toBeFalsy();
  });

  it('should add docker files', async () => {
    await generator(tree, options);

    expect(tree.exists(`${options.directory}/docker-compose.yml`)).toBeTruthy();
    expect(tree.exists(`${options.directory}/Dockerfile`)).toBeTruthy();
    expect(
      tree.exists(`${options.directory}/Dockerfile.dockerignore`)
    ).toBeTruthy();
  });

  it('should create Dockerfile for npm package manager', async () => {
    await generator(tree, options);

    const content = tree.read(`${options.directory}/Dockerfile`, 'utf-8');
    expect(content).toMatchSnapshot();
  });

  it('should add three dotenv files', async () => {
    await generator(tree, options);

    const envFiles = tree
      .children(options.directory)
      .filter((file) => file.match(/\.env/));

    expect(envFiles).toEqual(['.env.local', '.env.payload', '.env.serve']);
  });

  it('should add folders for auto generated files', async () => {
    await generator(tree, options);

    expect(
      tree.exists(`${options.directory}/src/generated/.gitkeep`)
    ).toBeTruthy();

    expect(
      tree.exists(`${options.directory}/src/migrations/.gitkeep`)
    ).toBeTruthy();
  });

  it('should setup mongodb in payload config by default', async () => {
    await generator(tree, { ...options, database: undefined });

    const content = tree.read(
      `${options.directory}/src/payload.config.ts`,
      'utf-8'
    );
    expect(content.match(/mongooseAdapter|MONGO_URL/g).length).toBe(3);
  });

  it('should setup mongodb in payload config', async () => {
    await generator(tree, { ...options, database: 'mongodb' });

    const content = tree.read(
      `${options.directory}/src/payload.config.ts`,
      'utf-8'
    );
    expect(content.match(/mongooseAdapter|MONGO_URL/g).length).toBe(3);
    expect(content.match(/postgresAdapter|POSTGRES_URL/g)).toBeNull();
  });

  it('should setup postgres in payload config', async () => {
    await generator(tree, { ...options, database: 'postgres' });

    const content = tree.read(
      `${options.directory}/src/payload.config.ts`,
      'utf-8'
    );
    expect(content.match(/mongooseAdapter|MONGO_URL/g)).toBeNull();
    expect(content.match(/postgresAdapter|POSTGRES_URL/g).length).toBe(3);
  });

  it('should have dependency to payload-build from build', async () => {
    setInferenceFlag(false);
    await generator(tree, options);

    const projectJson = readProjectConfiguration(tree, options.name);
    expect(projectJson.targets['build'].dependsOn).toEqual(['payload-build']);
  });

  it('should have production configuration to dist folder for payload-build', async () => {
    setInferenceFlag(false);
    await generator(tree, options);

    const projectJson = readProjectConfiguration(tree, options.name);
    expect(
      Object.keys(projectJson.targets['payload-build'].configurations)
    ).toEqual(['production']);
    expect(
      projectJson.targets['payload-build'].configurations['production']
    ).toEqual({ outputPath: 'dist/apps/test-dir' });
  });

  it("should setup plugin inference when 'useInferencePlugins' doesn't exist", async () => {
    setInferenceFlag();
    await generator(tree, options);

    const nxJson = readNxJson(tree);
    expect(nxJson.useInferencePlugins).toBeUndefined();
    expect(nxJson.plugins).toEqual(['@cdwr/nx-payload/plugin']);

    const projectJson = readProjectConfiguration(tree, options.name);
    expect(projectJson).toMatchSnapshot();
  });

  it("should setup plugin inference when 'useInferencePlugins' is 'true'", async () => {
    setInferenceFlag(true);
    await generator(tree, options);

    const nxJson = readNxJson(tree);
    expect(nxJson.useInferencePlugins).toBe(true);
    expect(nxJson.plugins).toEqual(['@cdwr/nx-payload/plugin']);

    const projectJson = readProjectConfiguration(tree, options.name);
    expect(projectJson).toMatchSnapshot();
  });

  it("should not setup plugin inference when 'useInferencePlugins' is 'false'", async () => {
    setInferenceFlag(false);
    await generator(tree, options);

    const nxJson = readNxJson(tree);
    expect(nxJson.useInferencePlugins).toBe(false);
    expect(nxJson.plugins).toBeUndefined();

    const projectJson = readProjectConfiguration(tree, options.name);
    expect(projectJson).toMatchSnapshot();
  });

  it('should skip setup plugin inference when plugin exists as string', async () => {
    addInferencePlugin('@cdwr/nx-payload/plugin');
    await generator(tree, options);

    const content = readNxJson(tree);
    expect(content.plugins).toEqual(['@cdwr/nx-payload/plugin']);
  });

  it('should skip setup plugin inference when plugin exists as object without options', async () => {
    addInferencePlugin({ plugin: '@cdwr/nx-payload/plugin' });
    await generator(tree, options);

    const content = readNxJson(tree);
    expect(content.plugins).toEqual([{ plugin: '@cdwr/nx-payload/plugin' }]);
  });

  it('should skip setup plugin inference when plugin exists as object with full options', async () => {
    addInferencePlugin({
      plugin: '@cdwr/nx-payload/plugin',
      options: {
        buildTargetName: 'my-build',
        dockerBuildTargetName: 'my-docker:build',
        dockerRunTargetName: 'my-docker:run',
        mongodbTargetName: 'my-mongodb',
        payloadBuildTargetName: 'my-payload-build',
        payloadCliTargetName: 'my-payload-cli',
        postgresTargetName: 'my-postgres',
        serveTargetName: 'my-serve',
        startTargetName: 'my-start',
        stopTargetName: 'my-stop'
      }
    });
    await generator(tree, options);

    const content = readNxJson(tree);
    expect(content.plugins).toEqual([
      {
        plugin: '@cdwr/nx-payload/plugin',
        options: {
          buildTargetName: 'my-build',
          dockerBuildTargetName: 'my-docker:build',
          dockerRunTargetName: 'my-docker:run',
          mongodbTargetName: 'my-mongodb',
          payloadBuildTargetName: 'my-payload-build',
          payloadCliTargetName: 'my-payload-cli',
          postgresTargetName: 'my-postgres',
          serveTargetName: 'my-serve',
          startTargetName: 'my-start',
          stopTargetName: 'my-stop'
        }
      }
    ]);
  });

  it('should skip setup plugin inference when plugin exists as object with partial options', async () => {
    addInferencePlugin({
      plugin: '@cdwr/nx-payload/plugin',
      options: {
        buildTargetName: 'my-build',
        startTargetName: 'my-start',
        stopTargetName: 'my-stop'
      }
    });
    await generator(tree, options);

    const content = readNxJson(tree);
    expect(content.plugins).toEqual([
      {
        plugin: '@cdwr/nx-payload/plugin',
        options: {
          buildTargetName: 'my-build',
          startTargetName: 'my-start',
          stopTargetName: 'my-stop'
        }
      }
    ]);
  });

  // @see https://github.com/nrwl/nx/blob/master/packages/remix/src/generators/application/application.impl.spec.ts
  it.todo('should test all options');
});
