import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import removeInferredTargets from './remove-inferred-targets';

const { addProjectConfiguration, readNxJson, updateNxJson } = devkit;
type Tree = devkit.Tree;

function addProject(
  tree: Tree,
  name: string,
  type: 'payload-app' | 'normal-app' | 'migrated-app'
) {
  if (type !== 'normal-app') {
    tree.write(`apps/${name}/src/payload.config.ts`, '');
  }
  addProjectConfiguration(tree, name, {
    name,
    root: `apps/${name}`,
    sourceRoot: `apps/${name}/src`,
    projectType: 'application',
    targets:
      type === 'migrated-app'
        ? {
            lint: {
              executor: '@nx/linter:eslint',
              options: {}
            }
          }
        : {
            build: {
              executor: '@nx/js:tsc',
              options: {}
            },
            serve: {
              executor: '@nx/js:node',
              options: {}
            },
            lint: {
              executor: '@nx/linter:eslint',
              options: {}
            }
          }
  });
}

function addPayloadPlugin(tree: Tree) {
  const nxJson = readNxJson(tree);
  nxJson.plugins ??= [];
  nxJson.plugins.push('@cdwr/nx-payload/plugin');
  updateNxJson(tree, nxJson);
}

describe('remove-inferred-targets migration', () => {
  let tree: Tree;

  const formatFilesMock = jest.spyOn(devkit, 'formatFiles');

  console.log = jest.fn();
  console.warn = jest.fn();

  formatFilesMock.mockResolvedValue();

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should remove inferred targets from payload projects', async () => {
    addProject(tree, 'test-payload', 'payload-app');
    addProject(tree, 'test-normal', 'normal-app');
    addPayloadPlugin(tree);

    await removeInferredTargets(tree);

    expect(
      tree.read('apps/test-payload/project.json', 'utf-8')
    ).toMatchSnapshot('payload project');

    expect(tree.read('apps/test-normal/project.json', 'utf-8')).toMatchSnapshot(
      'normal project'
    );
  });

  it('should not remove inferred targets when payload plugin is not installed', async () => {
    addProject(tree, 'test-payload', 'payload-app');
    addProject(tree, 'test-normal', 'normal-app');

    await removeInferredTargets(tree);

    expect(
      tree.read('apps/test-payload/project.json', 'utf-8')
    ).toMatchSnapshot('payload project');

    expect(tree.read('apps/test-normal/project.json', 'utf-8')).toMatchSnapshot(
      'normal project'
    );
  });

  it('should only log when app is already migrated', async () => {
    addProject(tree, 'test-migrated', 'migrated-app');
    addPayloadPlugin(tree);

    await removeInferredTargets(tree);

    expect(
      tree.read('apps/test-migrated/project.json', 'utf-8')
    ).toMatchSnapshot('migrated project');

    expect(console.log).toHaveBeenCalledWith(
      `No inferred targets to remove from project 'test-migrated'`
    );
  });
});
