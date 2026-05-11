jest.mock('../../utils/find-up-fs');
jest.mock('../../utils/is-graphql-disabled');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  readJsonFile: jest.fn()
}));
jest.mock('@nx/devkit/src/utils/calculate-hash-for-create-nodes', () => ({
  calculateHashForCreateNodes: jest.fn().mockResolvedValue('hash-abc')
}));
jest.mock('@nx/js', () => ({
  getLockFileName: jest.fn().mockReturnValue('package-lock.json')
}));

import type { CreateNodesContextV2 } from '@nx/devkit';
import { readJsonFile } from '@nx/devkit';

import { findUpFs } from '../../utils/find-up-fs';
import { isGraphQLDisabled } from '../../utils/is-graphql-disabled';

import { createPayloadNodes } from './create-payload-nodes';

const mockFindUpFs = findUpFs as jest.MockedFunction<typeof findUpFs>;
const mockIsGraphQLDisabled = isGraphQLDisabled as jest.MockedFunction<
  typeof isGraphQLDisabled
>;
const mockReadJsonFile = readJsonFile as jest.MockedFunction<
  typeof readJsonFile
>;

const context: CreateNodesContextV2 = {
  workspaceRoot: '/workspace',
  nxJsonConfiguration: {}
};

describe('createPayloadNodes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsGraphQLDisabled.mockResolvedValue(true);
    mockReadJsonFile.mockReturnValue({ name: 'my-app' });
  });

  it('should return empty result when no project.json is found', async () => {
    mockFindUpFs.mockResolvedValue(null);

    const result = await createPayloadNodes(
      'apps/my-app/src/payload.config.ts',
      context,
      undefined,
      {}
    );

    expect(result).toEqual({});
  });

  it('should return a project entry when project.json is found', async () => {
    mockFindUpFs.mockResolvedValue('/workspace/apps/my-app/project.json');

    const result = await createPayloadNodes(
      'apps/my-app/src/payload.config.ts',
      context,
      undefined,
      {}
    );

    expect(result).toMatchObject({
      projects: {
        'apps/my-app': {
          root: 'apps/my-app'
        }
      }
    });
  });

  it('should include inferred targets in the project entry', async () => {
    mockFindUpFs.mockResolvedValue('/workspace/apps/my-app/project.json');

    const result = await createPayloadNodes(
      'apps/my-app/src/payload.config.ts',
      context,
      undefined,
      {}
    );

    const targets = (
      result as {
        projects: Record<string, { targets: Record<string, unknown> }>;
      }
    ).projects['apps/my-app'].targets;
    expect(targets).toHaveProperty('gen');
    expect(targets).toHaveProperty('payload');
    expect(targets).toHaveProperty('dx:mongodb');
  });

  it('should derive configFile relative to the project root', async () => {
    mockFindUpFs.mockResolvedValue('/workspace/apps/my-app/project.json');

    const result = await createPayloadNodes(
      'apps/my-app/src/payload.config.ts',
      context,
      undefined,
      {}
    );

    const { gen } = (
      result as {
        projects: Record<
          string,
          { targets: Record<string, { options: Record<string, unknown> }> }
        >;
      }
    ).projects['apps/my-app'].targets;
    expect(gen.options['env']['PAYLOAD_CONFIG_PATH']).toBe(
      'src/payload.config.ts'
    );
  });

  it('should use cached targets on repeated calls with the same hash', async () => {
    mockFindUpFs.mockResolvedValue('/workspace/apps/my-app/project.json');

    const cache: Record<string, Record<string, unknown>> = {};
    await createPayloadNodes(
      'apps/my-app/src/payload.config.ts',
      context,
      undefined,
      cache
    );
    await createPayloadNodes(
      'apps/my-app/src/payload.config.ts',
      context,
      undefined,
      cache
    );

    // isGraphQLDisabled is called to compute the hash input, but createPayloadTargets
    // should only run once — the second call hits the cache
    expect(mockIsGraphQLDisabled).toHaveBeenCalledTimes(2);
    expect(cache['hash-abc']).toBeDefined();
  });

  it('should pass graphQL disabled state to target creation', async () => {
    mockFindUpFs.mockResolvedValue('/workspace/apps/my-app/project.json');
    mockIsGraphQLDisabled.mockResolvedValue(false);

    const result = await createPayloadNodes(
      'apps/my-app/src/payload.config.ts',
      context,
      undefined,
      {}
    );

    const { gen } = (
      result as {
        projects: Record<
          string,
          { targets: Record<string, { options: Record<string, unknown> }> }
        >;
      }
    ).projects['apps/my-app'].targets;
    expect(gen.options['commands']).toContain(
      'npx payload-graphql generate:schema'
    );
  });
});
