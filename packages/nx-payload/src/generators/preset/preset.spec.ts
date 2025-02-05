import { type Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { presetGenerator } from './preset';
import type { PresetGeneratorSchema } from './schema';

describe('preset generator', () => {
  let tree: Tree;

  const options: PresetGeneratorSchema = {
    name: 'test',
    payloadAppName: 'test-app',
    payloadAppDirectory: 'app-dir/test-app',
    skipFormat: true
  };

  console.log = jest.fn();
  console.warn = jest.fn();

  jest.setTimeout(10_000);

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should generate app with all options provided', async () => {
    await presetGenerator(tree, options);

    const config = readProjectConfiguration(tree, 'test-app');
    expect(config.name).toBe('test-app');
    expect(config.sourceRoot).toBe('app-dir/test-app/src');
    expect(config.tags).toEqual([]);
  });

  it('should use workspace `name` when `appName` is not provided', async () => {
    await presetGenerator(tree, {
      ...options,
      name: 'workspace-name',
      payloadAppName: '',
      payloadAppDirectory: ''
    });

    const config = readProjectConfiguration(tree, 'workspace-name');
    expect(config.name).toBe('workspace-name');
  });

  it('should set "apps" as the default app base path', async () => {
    await presetGenerator(tree, {
      ...options,
      name: 'test',
      payloadAppName: 'test-app',
      payloadAppDirectory: ''
    });

    const config = readProjectConfiguration(tree, 'test-app');
    expect(config.name).toBe('test-app');
    expect(config.sourceRoot).toBe('apps/test-app/src');
  });

  it('should delete "libs" folder', async () => {
    await presetGenerator(tree, options);

    expect(tree.children('').includes('apps')).toBeTruthy();
    expect(tree.children('').includes('libs')).toBeFalsy();
  });
});
