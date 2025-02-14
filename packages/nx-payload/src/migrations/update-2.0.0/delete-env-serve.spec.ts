import {
  type Tree,
  addProjectConfiguration,
  readNxJson,
  updateNxJson
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import deleteEnvServe from './delete-env-serve';

function addProject(
  tree: Tree,
  name: string,
  type: 'payload-app' | 'normal-app'
) {
  if (type === 'payload-app') {
    tree.write(`apps/${name}/src/payload.config.ts`, '');
  }
  tree.write(`apps/${name}/.env.serve`, '');
  addProjectConfiguration(tree, name, {
    name,
    root: `apps/${name}`,
    sourceRoot: `apps/${name}`,
    projectType: 'application',
    targets: {}
  });
}

function addPayloadPlugin(tree: Tree) {
  const nxJson = readNxJson(tree);
  nxJson.plugins ??= [];
  nxJson.plugins.push('@cdwr/nx-payload/plugin');
  updateNxJson(tree, nxJson);
}

describe('delete-env-serve migration', () => {
  let tree: Tree;

  console.log = jest.fn();
  console.warn = jest.fn();

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should remove .env.serve file from payload projects', async () => {
    addProject(tree, 'test-payload-1', 'payload-app');
    addProject(tree, 'test-payload-2', 'payload-app');
    addProject(tree, 'test-normal', 'normal-app');
    addPayloadPlugin(tree);

    await deleteEnvServe(tree);

    expect(tree.exists('apps/test-payload-1/.env.serve')).toBeFalsy();
    expect(tree.exists('apps/test-payload-2/.env.serve')).toBeFalsy();
    expect(tree.exists('apps/test-normal/.env.serve')).toBeTruthy();
  });

  it('should not remove .env.serve file when payload plugin is not installed', async () => {
    addProject(tree, 'test-payload-1', 'payload-app');
    addProject(tree, 'test-payload-2', 'payload-app');
    addProject(tree, 'test-normal', 'normal-app');

    await deleteEnvServe(tree);

    expect(tree.exists('apps/test-payload-1/.env.serve')).toBeTruthy();
    expect(tree.exists('apps/test-payload-2/.env.serve')).toBeTruthy();
    expect(tree.exists('apps/test-normal/.env.serve')).toBeTruthy();
  });
});
