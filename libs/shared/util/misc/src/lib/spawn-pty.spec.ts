import * as pty from '@homebridge/node-pty-prebuilt-multiarch';
import {
  Mock,
  MockInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import { spawnPty } from './spawn-pty';

// Create types for our mocked process
type MockProcess = {
  onData: MockInstance<[(data: string) => void], void>;
  onExit: MockInstance<[(result: { exitCode: number }) => void], void>;
  write: Mock;
};

// Mock node-pty
vi.mock('@homebridge/node-pty-prebuilt-multiarch', () => ({
  spawn: vi.fn().mockImplementation(() => {
    const mockProcess = {
      onData: vi.fn(),
      onExit: vi.fn(),
      write: vi.fn()
    };
    return mockProcess;
  })
}));

describe('spawnPty', () => {
  let mockProcess: MockProcess;
  const mockSpawnPty = vi.mocked(pty.spawn);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const invokeSpawnPty = (
    command: string,
    args: Array<string>,
    prompt?: (output: string) => string | undefined
  ) => {
    const spawnPromise = spawnPty(command, args, { prompt });

    // Get the mock process instance after each spawn call
    mockProcess = mockSpawnPty.mock.results[0]?.value;

    // Extract callbacks
    const [[dataCallback]] = mockProcess.onData.mock.calls;
    const [[exitCallback]] = mockProcess.onExit.mock.calls;

    return {
      promise: spawnPromise,
      callbacks: { dataCallback, exitCallback }
    };
  };

  it('should spawn a process and resolve with output on success', async () => {
    const {
      promise,
      callbacks: { dataCallback, exitCallback }
    } = invokeSpawnPty('test-command', ['arg1', 'arg2']);

    // Simulate process output
    dataCallback('output line 1\n');
    dataCallback('output line 2\n');

    // Simulate successful exit
    exitCallback({ exitCode: 0 });

    const result = await promise;

    expect(result).toBe('output line 1\noutput line 2\n');
    expect(pty.spawn).toHaveBeenCalledWith('test-command', ['arg1', 'arg2'], {
      cwd: process.cwd(),
      encoding: 'utf-8',
      env: process.env
    });
  });

  it('should reject when process exits with non-zero code', async () => {
    const {
      promise,
      callbacks: { dataCallback, exitCallback }
    } = invokeSpawnPty('test-command', []);

    // Simulate error output
    dataCallback('error output');

    // Simulate error exit
    exitCallback({ exitCode: 1 });

    await expect(promise).rejects.toThrow(
      'Process exited with code 1\nOutput: error output'
    );
  });

  it('should handle prompt interactions', async () => {
    const prompt = vi.fn((output: string) => {
      if (output.includes('Enter value:')) {
        return 'test-response';
      }
      return undefined;
    });

    const {
      callbacks: { dataCallback, exitCallback }
    } = invokeSpawnPty('test-command', [], prompt);

    // Simulate prompt
    dataCallback('Enter value:');

    // Verify prompt response was written
    expect(mockProcess.write).toHaveBeenCalledWith('test-response\n');

    // Simulate successful completion
    exitCallback({ exitCode: 0 });
  });

  it('should handle multiple prompt interactions', async () => {
    const prompt = vi.fn((output: string) => {
      if (output.includes('First prompt:')) return 'response1';
      if (output.includes('Second prompt:')) return 'response2';
      return undefined;
    });

    const {
      callbacks: { dataCallback, exitCallback }
    } = invokeSpawnPty('test-command', [], prompt);

    // Simulate multiple prompts
    dataCallback('First prompt:');
    dataCallback('Second prompt:');

    // Verify both responses were written
    expect(mockProcess.write).toHaveBeenCalledWith('response1\n');
    expect(mockProcess.write).toHaveBeenCalledWith('response2\n');

    // Simulate successful completion
    exitCallback({ exitCode: 0 });
  });

  it('should work without prompt function', async () => {
    const {
      callbacks: { dataCallback, exitCallback }
    } = invokeSpawnPty('test-command', []);

    // Simulate output that might normally prompt
    dataCallback('Enter value:');

    // Verify no write calls were made
    expect(mockProcess.write).not.toHaveBeenCalled();

    // Simulate successful completion
    exitCallback({ exitCode: 0 });
  });
});
