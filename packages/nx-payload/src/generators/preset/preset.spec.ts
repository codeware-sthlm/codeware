import { type Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { payloadTargets } from '../../utils/definitions';

import { presetGenerator } from './preset';
import type { PresetGeneratorSchema } from './schema';

describe.skip('preset generator', () => {
  let tree: Tree;

  const options: PresetGeneratorSchema = {
    name: 'test',
    payloadAppName: 'test-app',
    payloadAppDirectory: 'app-dir/test-app',
    addPlugin: true,
    skipFormat: true
  };

  console.log = jest.fn();
  console.warn = jest.fn();

  jest.setTimeout(10_000);

  let nxDaemon: string;
  beforeAll(() => {
    nxDaemon = process.env['NX_DAEMON'];
    process.env['NX_DAEMON'] = 'false';
  });

  afterAll(() => {
    process.env['NX_DAEMON'] = nxDaemon;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should generate project config without payload targets', async () => {
    await presetGenerator(tree, options);

    const { targets, ...config } = readProjectConfiguration(tree, 'test-app');

    for (const target of payloadTargets) {
      expect(targets[target]).toBeUndefined();
    }

    expect(config).toMatchSnapshot();
  });

  it('should use workspace `name` when `appName` is not provided', async () => {
    await presetGenerator(tree, {
      ...options,
      name: 'workspace-name',
      payloadAppName: '',
      payloadAppDirectory: ''
    });

    const { name } = readProjectConfiguration(tree, 'workspace-name');
    expect(name).toBe('workspace-name');
  });

  it('should set "apps" as the default app base path', async () => {
    await presetGenerator(tree, {
      ...options,
      name: 'test',
      payloadAppName: 'test-app',
      payloadAppDirectory: ''
    });

    const { name, sourceRoot } = readProjectConfiguration(tree, 'test-app');
    expect(name).toBe('test-app');
    expect(sourceRoot).toBe('apps/test-app');
  });

  it('should delete "libs" folder', async () => {
    await presetGenerator(tree, options);

    expect(tree.children('').includes('apps')).toBeTruthy();
    expect(tree.children('').includes('libs')).toBeFalsy();
  });
});
