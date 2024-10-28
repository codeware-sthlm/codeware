import * as main from './lib/main';

// Mock the action's entrypoint
const runMock = jest.spyOn(main, 'run').mockImplementation();

describe('index action', () => {
  it('should call run when imported', () => {
    require('./action');
    expect(runMock).toHaveBeenCalled();
  });
});
