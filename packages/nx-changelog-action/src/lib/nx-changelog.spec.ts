import { generateAppChangelogs } from '@codeware/shared/util/nx-deploy';

import { nxChangelog } from './nx-changelog';
import type { ActionInputs } from './schemas/action-inputs.schema';

vi.mock('@actions/core');
vi.mock('@codeware/shared/util/nx-deploy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@codeware/shared/util/nx-deploy')>()),
  generateAppChangelogs: vi.fn()
}));

describe('nxChangelog', () => {
  const mockGenerate = vi.mocked(generateAppChangelogs);

  const app = (
    name: string,
    version = '1.1.0',
    previousVersion = '1.0.0'
  ): ActionInputs['apps'][number] => ({
    name,
    flyConfigFile: `apps/${name}/fly.toml`,
    githubConfig: {},
    version,
    previousVersion
  });

  const inputs = (overrides: Partial<ActionInputs> = {}): ActionInputs => ({
    apps: [app('cms'), app('web')],
    released: ['cms', 'web'],
    createRelease: false,
    token: 'token',
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerate.mockResolvedValue(new Map());
  });

  it('should render a changelog for every released app', async () => {
    mockGenerate.mockResolvedValue(
      new Map([
        ['cms', '### Fixes\n- a'],
        ['web', '### Features\n- b']
      ])
    );

    const result = await nxChangelog(inputs());

    expect(result).toEqual({ cms: '### Fixes\n- a', web: '### Features\n- b' });
    expect(mockGenerate).toHaveBeenCalledWith({
      createRelease: false,
      releases: new Map([
        ['cms', { version: '1.1.0', previousVersion: '1.0.0' }],
        ['web', { version: '1.1.0', previousVersion: '1.0.0' }]
      ])
    });
  });

  it('should skip apps that did not deploy', async () => {
    await nxChangelog(inputs({ released: ['cms'] }));

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        releases: new Map([
          ['cms', { version: '1.1.0', previousVersion: '1.0.0' }]
        ])
      })
    );
  });

  it('should skip a forced redeploy that shipped nothing new', async () => {
    // Manual dispatch of an unbumped app: version === previousVersion
    const result = await nxChangelog(
      inputs({ apps: [app('cms', '1.0.0', '1.0.0')], released: ['cms'] })
    );

    expect(result).toEqual({});
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('should create GitHub releases when asked', async () => {
    await nxChangelog(inputs({ createRelease: true }));

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ createRelease: true })
    );
  });

  it('should return empty when nothing deployed', async () => {
    const result = await nxChangelog(inputs({ released: [] }));

    expect(result).toEqual({});
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
