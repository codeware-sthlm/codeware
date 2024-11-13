import {
  type Tree,
  addProjectConfiguration,
  readNxJson,
  updateNxJson
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import deleteEnvPayload from './delete-env-payload';

function addProject(
  tree: Tree,
  name: string,
  type: 'payload-app' | 'normal-app'
) {
  if (type === 'payload-app') {
    tree.write(`apps/${name}/src/payload.config.ts`, '');
  }
  tree.write(`apps/${name}/.env.payload`, '');
  addProjectConfiguration(tree, name, {
    name,
    root: `apps/${name}`,
    sourceRoot: `apps/${name}/src`,
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

describe('delete-env-payload migration', () => {
  let tree: Tree;

  console.log = jest.fn();
  console.warn = jest.fn();

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should remove .env.payload file from payload projects', async () => {
    addProject(tree, 'test-payload-1', 'payload-app');
    addProject(tree, 'test-payload-2', 'payload-app');
    addProject(tree, 'test-normal', 'normal-app');
    addPayloadPlugin(tree);

    await deleteEnvPayload(tree);

    expect(tree.exists('apps/test-payload-1/.env.payload')).toBeFalsy();
    expect(tree.exists('apps/test-payload-2/.env.payload')).toBeFalsy();
    expect(tree.exists('apps/test-normal/.env.payload')).toBeTruthy();
  });

  it('should not remove .env.payload file when payload plugin is not installed', async () => {
    addProject(tree, 'test-payload-1', 'payload-app');
    addProject(tree, 'test-payload-2', 'payload-app');
    addProject(tree, 'test-normal', 'normal-app');

    await deleteEnvPayload(tree);

    expect(tree.exists('apps/test-payload-1/.env.payload')).toBeTruthy();
    expect(tree.exists('apps/test-payload-2/.env.payload')).toBeTruthy();
    expect(tree.exists('apps/test-normal/.env.payload')).toBeTruthy();
  });
});
