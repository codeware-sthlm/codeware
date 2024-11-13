import {
  type Tree,
  addProjectConfiguration,
  readNxJson,
  updateNxJson
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import removeServeTarget from './remove-serve-target';

function addProject(
  tree: Tree,
  name: string,
  type: 'payload-app' | 'normal-app'
) {
  if (type === 'payload-app') {
    tree.write(`apps/${name}/src/payload.config.ts`, '');
  }
  addProjectConfiguration(tree, name, {
    name,
    root: `apps/${name}`,
    sourceRoot: `apps/${name}/src`,
    projectType: 'application',
    targets: {
      build: {
        executor: '@nx/js:tsc',
        options: {}
      },
      serve: {
        executor: '@nx/js:node',
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

describe('remove-serve-target migration', () => {
  let tree: Tree;

  console.log = jest.fn();
  console.warn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should remove serve target from payload projects', async () => {
    addProject(tree, 'test-payload', 'payload-app');
    addProject(tree, 'test-normal', 'normal-app');
    addPayloadPlugin(tree);

    await removeServeTarget(tree);

    expect(
      tree.read('apps/test-payload/project.json', 'utf-8')
    ).toMatchSnapshot('payload project');

    expect(tree.read('apps/test-normal/project.json', 'utf-8')).toMatchSnapshot(
      'normal project'
    );
  });

  it('should not remove serve targets when payload plugin is not installed', async () => {
    addProject(tree, 'test-payload', 'payload-app');
    addProject(tree, 'test-normal', 'normal-app');

    await removeServeTarget(tree);

    expect(
      tree.read('apps/test-payload/project.json', 'utf-8')
    ).toMatchSnapshot('payload project');

    expect(tree.read('apps/test-normal/project.json', 'utf-8')).toMatchSnapshot(
      'normal project'
    );
  });
});
