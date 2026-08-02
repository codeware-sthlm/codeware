import {
  addPullRequestComment,
  upsertPullRequestComment
} from '@codeware/shared/util/github';

import { flyPrComment } from './fly-pr-comment';
import type { ActionInputs } from './schemas/action-inputs.schema';

vi.mock('@actions/core');
vi.mock('@codeware/shared/util/github', () => ({
  addPullRequestComment: vi.fn(),
  upsertPullRequestComment: vi.fn()
}));

describe('flyPrComment', () => {
  const mockAdd = vi.mocked(addPullRequestComment);
  const mockUpsert = vi.mocked(upsertPullRequestComment);

  const inputs = (overrides: Partial<ActionInputs> = {}): ActionInputs => ({
    pullRequest: 467,
    environment: 'preview',
    token: 'token',
    projects: [
      {
        action: 'deploy',
        app: 'cdwr-web-pr-467-demo',
        name: 'web (demo)',
        url: 'https://cdwr-web-pr-467-demo.fly.dev'
      }
    ],
    ...overrides
  });

  const body = () => mockAdd.mock.calls[0][2];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a new comment for every deploy', async () => {
    // Deliberate: each deploy's changelog is a delta, so upserting would
    // discard what earlier pushes shipped and move the reader's scroll
    await flyPrComment(inputs());

    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      'token',
      467,
      expect.stringContaining('web (demo)')
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('should render the changelog as a collapsed section', async () => {
    await flyPrComment(
      inputs({ changelogs: { web: '## 1.1.5\n\n- **web:** a change' } })
    );

    expect(body()).toContain('<details>');
    expect(body()).toContain('<b>web</b> — changes in this deploy');
    expect(body()).toContain('- **web:** a change');
  });

  it('should not let a commit message escape the details block', async () => {
    await flyPrComment(
      inputs({
        changelogs: {
          web: '- **web:** close it </details><img src=x onerror=alert(1)>'
        }
      })
    );

    // Exactly one closing tag: ours. The commit text is inert
    expect(body().match(/<\/details>/g)).toHaveLength(1);
    expect(body()).toContain('&lt;/details>');
    expect(body()).toContain('&lt;img src=x');
  });

  it('should leave markdown links and blockquotes intact', async () => {
    await flyPrComment(
      inputs({
        changelogs: {
          web: '- **web:** a ([abc](https://x.test/c?a=1&b=2))\n\n> note'
        }
      })
    );

    expect(body()).toContain('([abc](https://x.test/c?a=1&b=2))');
    expect(body()).toContain('> note');
  });

  it('should omit the changelog section when there is nothing to show', async () => {
    await flyPrComment(inputs({ changelogs: {} }));

    expect(body()).not.toContain('<details>');
    expect(body()).toContain('web (demo)');
  });

  it('should report failed projects', async () => {
    await flyPrComment(
      inputs({
        projects: [
          { action: 'failed', appOrProject: 'cms (demo)', error: 'boom' }
        ]
      })
    );

    expect(body()).toContain('❌ Failed');
    expect(body()).toContain('cms (demo)');
  });
});
