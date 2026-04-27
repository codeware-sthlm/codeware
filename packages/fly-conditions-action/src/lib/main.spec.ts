import * as core from '@actions/core';

import * as flyConditionsModule from './fly-conditions';
import * as main from './main';

vi.mock('@actions/core');
vi.mock('@actions/github', () => ({
  ...vi.importActual('@actions/github'),
  context: {
    eventName: 'push',
    ref: 'refs/heads/main',
    payload: {},
    repo: { owner: 'org', repo: 'repo' }
  },
  getOctokit: vi.fn()
}));
vi.mock('./fly-conditions');

describe('main', () => {
  const getInputMock = vi.spyOn(core, 'getInput');
  const setOutputMock = vi.spyOn(core, 'setOutput');
  const setFailedMock = vi.spyOn(core, 'setFailed');
  const runMock = vi.spyOn(main, 'run');
  const flyConditionsMock = vi.spyOn(flyConditionsModule, 'flyConditions');

  beforeEach(() => {
    vi.clearAllMocks();

    getInputMock.mockImplementation((name: string) => {
      if (name === 'preview-label') return 'preview-deploy';
      if (name === 'token') return 'gh-token';
      return '';
    });

    flyConditionsMock.mockResolvedValue({ skip: false });
  });

  it('should run without exceptions', async () => {
    await main.run();
    expect(runMock).toHaveReturned();
  });

  it('should call flyConditions with parsed inputs', async () => {
    await main.run();
    expect(flyConditionsMock).toHaveBeenCalledWith({
      previewLabel: 'preview-deploy',
      token: 'gh-token'
    });
  });

  it('should set skip output to "false" when conditions pass', async () => {
    flyConditionsMock.mockResolvedValue({ skip: false });
    await main.run();
    expect(setOutputMock).toHaveBeenCalledWith('skip', 'false');
  });

  it('should set skip output to "true" when conditions block', async () => {
    flyConditionsMock.mockResolvedValue({ skip: true });
    await main.run();
    expect(setOutputMock).toHaveBeenCalledWith('skip', 'true');
  });

  it('should fail when required inputs are missing', async () => {
    getInputMock.mockReturnValue('');
    await main.run();
    expect(setFailedMock).toHaveBeenCalled();
  });

  it('should handle errors from flyConditions', async () => {
    flyConditionsMock.mockRejectedValue(new Error('api error'));
    await main.run();
    expect(setFailedMock).toHaveBeenCalledWith('api error');
  });
});
