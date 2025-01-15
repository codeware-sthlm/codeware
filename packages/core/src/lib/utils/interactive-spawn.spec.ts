import { spawn as cpSpawn } from 'child_process';
import { EventEmitter } from 'events';
import { Writable } from 'stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SpawnOptions, spawn } from './interactive-spawn';

// Create types for our mocked process
type MockProcess = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: Writable;
};

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn().mockImplementation(() => {
    const mockProcess = new EventEmitter();

    // Create mock streams for stdin, stdout, and stderr
    const mockStdout = new EventEmitter();
    const mockStderr = new EventEmitter();
    const mockStdin = new Writable({
      write: (_chunk, _encoding, callback) => {
        callback();
      }
    });

    // Assign the mock streams to the mock process
    Object.assign(mockProcess, {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin
    });

    return mockProcess;
  })
}));

describe('spawn', () => {
  let mockProcess: MockProcess;
  const mockSpawn = vi.mocked(cpSpawn);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const invokeSpawn = (
    command: string,
    args: string[],
    options?: SpawnOptions
  ) => {
    const spawnPromise = spawn(command, args, options);

    // Get the mock process instance after each spawn call
    mockProcess = mockSpawn.mock.results[0]?.value;

    return spawnPromise;
  };

  it('should spawn a process and resolve with output on successful completion', async () => {
    const spawnPromise = invokeSpawn('test-command', ['arg1', 'arg2']);

    // Emit test data
    mockProcess.stdout.emit('data', Buffer.from('stdout data'));
    mockProcess.stderr.emit('data', Buffer.from('stderr data'));
    mockProcess.emit('close', 0);

    const result = await spawnPromise;

    expect(result).toEqual({
      stdout: 'stdout data',
      stderr: 'stderr data'
    });

    expect(cpSpawn).toHaveBeenCalledWith('test-command', ['arg1', 'arg2'], {
      stdio: 'pipe'
    });
  });

  it('should reject with error when process exits with non-zero code', async () => {
    const spawnPromise = invokeSpawn('test-command', ['arg1']);

    mockProcess.stderr.emit('data', Buffer.from('error message'));
    mockProcess.emit('close', 1);

    await expect(spawnPromise).rejects.toThrow(
      'Process exited with code 1\nError: error message'
    );
  });

  it('should reject when process emits an error', async () => {
    const spawnPromise = invokeSpawn('test-command', ['arg1']);

    const testError = new Error('spawn error');
    mockProcess.emit('error', testError);

    await expect(spawnPromise).rejects.toThrow(testError);
  });

  it('should handle prompt option and write user input', async () => {
    const prompt = (output: string) => {
      if (output.includes('Please enter input:')) {
        return 'user response';
      }
      return undefined;
    };

    const spawnPromise = invokeSpawn('test-command', ['arg1'], { prompt });

    const writeStub = vi.spyOn(mockProcess.stdin, 'write');
    mockProcess.stdout.emit('data', Buffer.from('Please enter input:'));
    mockProcess.emit('close', 0);

    await spawnPromise;

    expect(writeStub).toHaveBeenCalledWith('user response\n');
  });

  it('should handle multiple stdout/stderr chunks', async () => {
    const spawnPromise = invokeSpawn('test-command', ['arg1']);

    mockProcess.stdout.emit('data', Buffer.from('chunk1 '));
    mockProcess.stdout.emit('data', Buffer.from('chunk2'));
    mockProcess.stderr.emit('data', Buffer.from('error1 '));
    mockProcess.stderr.emit('data', Buffer.from('error2'));
    mockProcess.emit('close', 0);

    const result = await spawnPromise;

    expect(result).toEqual({
      stdout: 'chunk1 chunk2',
      stderr: 'error1 error2'
    });
  });

  it('should pass through additional spawn options', async () => {
    const spawnPromise = invokeSpawn('test-command', ['arg1'], {
      cwd: '/test/dir',
      env: { TEST_ENV: 'value' }
    });

    mockProcess.emit('close', 0);

    await spawnPromise;

    expect(cpSpawn).toHaveBeenCalledWith('test-command', ['arg1'], {
      cwd: '/test/dir',
      env: { TEST_ENV: 'value' },
      stdio: 'pipe'
    });
  });
});
