import {
  ExpandedPluginConfiguration,
  type Tree,
  readJson,
  readNxJson,
  readProjectConfiguration,
  updateNxJson
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import type { PackageJson } from 'nx/src/utils/package-json';

import { PayloadPluginOptions } from '../../plugins/utils/types';

import generator from './application';
import type { AppGeneratorSchema } from './schema';

describe('application generator', () => {
  let tree: Tree;
  const requiredOptions: AppGeneratorSchema = {
    directory: 'apps/test-dir',
    name: 'test-app',
    skipFormat: true
  };

  console.log = jest.fn();
  console.warn = jest.fn();

  jest.setTimeout(10_000);

  const setInferenceFlag = (useInferencePlugins?: boolean) => {
    const workspace = readNxJson(tree);
    if (useInferencePlugins === undefined) {
      delete workspace.useInferencePlugins;
    } else {
      workspace.useInferencePlugins = useInferencePlugins;
    }
    updateNxJson(tree, workspace);
  };

  const addInferencePlugin = (
    plugin: string | ExpandedPluginConfiguration<PayloadPluginOptions>
  ) => {
    const workspace = readNxJson(tree);
    workspace.plugins = workspace.plugins || [];
    workspace.plugins.push(plugin);
    updateNxJson(tree, workspace);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should add payload dependency', async () => {
    await generator(tree, requiredOptions);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['payload']).toBeDefined();
  });

  it('should add webpack bundler dependency', async () => {
    await generator(tree, requiredOptions);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(
      packageJson.dependencies['@payloadcms/bundler-webpack']
    ).toBeDefined();
  });

  it('should add mongodb plugin dependency', async () => {
    await generator(tree, requiredOptions);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['@payloadcms/db-mongodb']).toBeDefined();
  });

  it('should add postgres plugin dependency', async () => {
    await generator(tree, requiredOptions);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['@payloadcms/db-postgres']).toBeDefined();
  });

  it('should add richtext slate editor plugin dependency', async () => {
    await generator(tree, requiredOptions);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(
      packageJson.dependencies['@payloadcms/richtext-slate']
    ).toBeDefined();
  });

  it('should add dependencies for node', async () => {
    await generator(tree, requiredOptions);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['@nx/node']).toBeUndefined();
    expect(packageJson.devDependencies['@nx/node']).toBeDefined();
  });

  it('should not add dependencies for mongodb or postgres', async () => {
    await generator(tree, requiredOptions);
    const packageJson = readJson<PackageJson>(tree, 'package.json');

    expect(packageJson.dependencies['mongodb']).toBeUndefined();
    expect(packageJson.dependencies['pg']).toBeUndefined();

    expect(packageJson.devDependencies['mongodb']).toBeUndefined();
    expect(packageJson.devDependencies['pg']).toBeUndefined();
  });

  it('should add payload project files', async () => {
    await generator(tree, requiredOptions);

    expect(
      tree.exists(`${requiredOptions.directory}/src/payload.config.ts`)
    ).toBeTruthy();

    expect(
      tree.exists(`${requiredOptions.directory}/eslint.config.mjs`)
    ).toBeTruthy();

    expect(
      tree.exists(`${requiredOptions.directory}/tsconfig.app.json`)
    ).toBeTruthy();
    expect(
      tree.exists(`${requiredOptions.directory}/tsconfig.json`)
    ).toBeTruthy();
    expect(
      tree.exists(`${requiredOptions.directory}/tsconfig.spec.json`)
    ).toBeTruthy();
  });

  it('should exclude folders with run-time generated files on build', async () => {
    await generator(tree, requiredOptions);

    const content: {
      extends: string;
      compilerOptions: object;
      exclude: Array<string>;
      include: Array<string>;
    } = JSON.parse(
      tree.read(`${requiredOptions.directory}/tsconfig.app.json`, 'utf-8')
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

  it('should add docker files', async () => {
    await generator(tree, requiredOptions);

    expect(
      tree.exists(`${requiredOptions.directory}/docker-compose.yml`)
    ).toBeTruthy();
    expect(tree.exists(`${requiredOptions.directory}/Dockerfile`)).toBeTruthy();
    expect(
      tree.exists(`${requiredOptions.directory}/Dockerfile.dockerignore`)
    ).toBeTruthy();
  });

  it('should create Dockerfile for npm package manager', async () => {
    await generator(tree, requiredOptions);

    const content = tree.read(
      `${requiredOptions.directory}/Dockerfile`,
      'utf-8'
    );
    expect(content).toMatchSnapshot();
  });

  it('should not generate e2e application by default', async () => {
    await generator(tree, requiredOptions);

    expect(
      tree.exists(`${requiredOptions.directory}-e2e/project.json`)
    ).toBeFalsy();
  });

  it('should generate e2e application', async () => {
    await generator(tree, { ...requiredOptions, e2eTestRunner: 'jest' });

    expect(
      tree.exists(`${requiredOptions.directory}-e2e/project.json`)
    ).toBeTruthy();
  });

  it('should add three dotenv files', async () => {
    await generator(tree, requiredOptions);

    const envFiles = tree
      .children(requiredOptions.directory)
      .filter((file) => file.match(/\.env/));

    expect(envFiles).toEqual(['.env.docker', '.env.local', '.env.serve']);
  });

  it('should add folders for auto generated files', async () => {
    await generator(tree, requiredOptions);

    expect(
      tree.exists(`${requiredOptions.directory}/src/generated/.gitkeep`)
    ).toBeTruthy();

    expect(
      tree.exists(`${requiredOptions.directory}/src/migrations/.gitkeep`)
    ).toBeTruthy();
  });

  it('should setup mongodb in payload config by default', async () => {
    await generator(tree, requiredOptions);

    const content = tree.read(
      `${requiredOptions.directory}/src/payload.config.ts`,
      'utf-8'
    );
    expect(content.match(/mongooseAdapter/g).length).toBe(2);
    expect(content.match(/DATABASE_URL/g).length).toBe(1);
  });

  it('should setup mongodb in payload config', async () => {
    await generator(tree, { ...requiredOptions, database: 'mongodb' });

    const content = tree.read(
      `${requiredOptions.directory}/src/payload.config.ts`,
      'utf-8'
    );
    expect(content.match(/mongooseAdapter/g).length).toBe(2);
    expect(content.match(/mongodb:\/\/localhost\/test-app/)).toBeDefined();
    expect(content.match(/postgresAdapter/)).toBeNull();
  });

  it('should setup postgres in payload config', async () => {
    await generator(tree, { ...requiredOptions, database: 'postgres' });

    const content = tree.read(
      `${requiredOptions.directory}/src/payload.config.ts`,
      'utf-8'
    );
    expect(content.match(/postgresAdapter/g).length).toBe(2);
    expect(
      content.match(/postgresql:\/\/postgres:postgres@postgres:5432\/test-app/)
    ).toBeDefined();
    expect(content.match(/mongooseAdapter/)).toBeNull();
  });

  it("should setup plugin inference when 'useInferencePlugins' doesn't exist", async () => {
    setInferenceFlag();
    await generator(tree, requiredOptions);

    const nxJson = readNxJson(tree);
    expect(nxJson.useInferencePlugins).toBeUndefined();
    expect(nxJson.plugins[0]).toMatchObject({
      plugin: '@cdwr/nx-payload/plugin'
    });

    const projectJson = readProjectConfiguration(tree, requiredOptions.name);
    expect(projectJson).toMatchSnapshot();
  });

  it("should setup plugin inference when 'useInferencePlugins' is 'true'", async () => {
    setInferenceFlag(true);
    await generator(tree, requiredOptions);

    const nxJson = readNxJson(tree);
    expect(nxJson.useInferencePlugins).toBe(true);
    expect(nxJson.plugins[0]).toMatchObject({
      plugin: '@cdwr/nx-payload/plugin'
    });

    const projectJson = readProjectConfiguration(tree, requiredOptions.name);
    expect(projectJson).toMatchSnapshot();
  });

  it("should not setup plugin inference when 'useInferencePlugins' is 'false'", async () => {
    setInferenceFlag(false);
    await generator(tree, requiredOptions);

    const nxJson = readNxJson(tree);
    expect(nxJson.useInferencePlugins).toBe(false);
    expect(nxJson.plugins).toBeUndefined();

    const projectJson = readProjectConfiguration(tree, requiredOptions.name);
    expect(projectJson).toMatchSnapshot();
  });

  it('should add plugin defined as object when needed', async () => {
    setInferenceFlag();
    await generator(tree, requiredOptions);

    const nxJson = readNxJson(tree);
    expect(nxJson.plugins).toEqual([
      {
        plugin: '@cdwr/nx-payload/plugin',
        options: {
          buildTargetName: 'build',
          dxDockerBuildTargetName: 'dx:docker-build',
          dxDockerRunTargetName: 'dx:docker-run',
          dxMongodbTargetName: 'dx:mongodb',
          dxPostgresTargetName: 'dx:postgres',
          dxStartTargetName: 'dx:start',
          dxStopTargetName: 'dx:stop',
          generateTargetName: 'gen',
          payloadTargetName: 'payload',
          serveTargetName: 'serve'
        }
      }
    ]);
  });

  it('should skip setup plugin inference when plugin exists as string', async () => {
    addInferencePlugin('@cdwr/nx-payload/plugin');
    await generator(tree, requiredOptions);

    const content = readNxJson(tree);
    expect(content.plugins).toEqual(['@cdwr/nx-payload/plugin']);
  });

  it('should skip setup plugin inference when plugin defined as object without options', async () => {
    addInferencePlugin({ plugin: '@cdwr/nx-payload/plugin' });
    await generator(tree, requiredOptions);

    const content = readNxJson(tree);
    expect(content.plugins).toEqual([{ plugin: '@cdwr/nx-payload/plugin' }]);
  });

  it('should skip setup plugin inference when plugin defined as object with options', async () => {
    addInferencePlugin({
      plugin: '@cdwr/nx-payload/plugin',
      options: {
        buildTargetName: 'my-build',
        generateTargetName: 'my-generate',
        payloadTargetName: 'my-payload',
        serveTargetName: 'my-serve',
        dxDockerBuildTargetName: 'my-docker-build',
        dxDockerRunTargetName: 'my-docker-run',
        dxMongodbTargetName: 'my-mongodb',
        dxPostgresTargetName: 'my-postgres',
        dxStartTargetName: 'my-start',
        dxStopTargetName: 'my-stop'
      }
    });
    await generator(tree, requiredOptions);

    const content = readNxJson(tree);
    expect(content.plugins).toEqual([
      {
        plugin: '@cdwr/nx-payload/plugin',
        options: {
          buildTargetName: 'my-build',
          generateTargetName: 'my-generate',
          payloadTargetName: 'my-payload',
          serveTargetName: 'my-serve',
          dxDockerBuildTargetName: 'my-docker-build',
          dxDockerRunTargetName: 'my-docker-run',
          dxMongodbTargetName: 'my-mongodb',
          dxPostgresTargetName: 'my-postgres',
          dxStartTargetName: 'my-start',
          dxStopTargetName: 'my-stop'
        }
      }
    ]);
  });

  it('should skip setup plugin inference when plugin defined as object with partial options', async () => {
    addInferencePlugin({
      plugin: '@cdwr/nx-payload/plugin',
      options: {
        buildTargetName: 'my-build',
        generateTargetName: 'my-generate',
        payloadTargetName: 'my-payload',
        serveTargetName: 'my-serve'
      }
    });
    await generator(tree, requiredOptions);

    const content = readNxJson(tree);
    expect(content.plugins).toEqual([
      {
        plugin: '@cdwr/nx-payload/plugin',
        options: {
          buildTargetName: 'my-build',
          generateTargetName: 'my-generate',
          payloadTargetName: 'my-payload',
          serveTargetName: 'my-serve'
        }
      }
    ]);
  });

  // @see https://github.com/nrwl/nx/blob/master/packages/remix/src/generators/application/application.impl.spec.ts
  it.todo('should test all options');
});
