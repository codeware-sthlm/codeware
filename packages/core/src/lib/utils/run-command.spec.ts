import { exec } from 'child_process';
import { EventEmitter } from 'events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runCommand } from './run-command';

// Mock tmpProjPath so we don't depend on Nx internals in this test
vi.mock('@nx/plugin/testing', () => ({
  tmpProjPath: vi.fn(() => '/tmp/proj')
}));

// Optional: keep log output quiet in tests
vi.mock('./log-utils', () => ({
  logDebug: vi.fn(),
  logError: vi.fn()
}));

// Capture the last fake child process so tests can drive it
class FakeChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}

let lastChild: FakeChildProcess | null = null;

// Mock child_process.exec to return a controllable FakeChildProcess
vi.mock('child_process', () => ({
  exec: vi.fn(() => {
    lastChild = new FakeChildProcess();
    return lastChild;
  })
}));

const mockedExec = vi.mocked(exec);

describe('runCommand', () => {
  beforeEach(() => {
    lastChild = null;
    mockedExec.mockClear();
  });

  it('resolves when doneFn matches cumulative output even if split across chunks', async () => {
    const promise = runCommand('nx serve app-default', {
      doneFn: (log) => /Ready in \d+(\.\d+)?s/.test(log),
      verbose: false
    });

    // Ensure exec was called and we have a fake process
    expect(mockedExec).toHaveBeenCalledTimes(1);
    expect(lastChild).toBeTruthy();

    // Simulate chunked logs: "Ready in " and "2.5s" in separate chunks
    lastChild?.stdout.emit('data', 'Some logs...\n  ✓ Ready in ');
    lastChild?.stdout.emit('data', '2.5s\n');

    // Simulate normal exit (code 0) after ready
    lastChild?.emit('exit', 0);

    const output = await promise;
    expect(output).toContain('Ready in 2.5s');
  });

  it('rejects when errorDetector matches stderr output', async () => {
    const promise = runCommand('nx serve app-default', {
      errorDetector: /Error:/
    });

    lastChild?.stderr.emit('data', 'Error: something went wrong\n');

    // Exit with non-zero just to complete the lifecycle
    lastChild?.emit('exit', 1);

    await expect(promise).rejects.toMatch(/Error: something went wrong/);
  });

  it('rejects when process exits with non-zero code and no doneFn', async () => {
    const promise = runCommand('nx build app-default');

    lastChild?.stdout.emit('data', 'Building...');
    lastChild?.emit('exit', 1);

    await expect(promise).rejects.toMatch(/Exited with 1/);
  });

  it('rejects when process exits before doneFn is satisfied', async () => {
    const promise = runCommand('nx serve app-default', {
      doneFn: () => false // never satisfied
    });

    lastChild?.stdout.emit('data', 'Some output but not ready yet\n');
    lastChild?.emit('exit', 0);

    await expect(promise).rejects.toMatch(/Exited with 0/);
  });

  it('resolves with full output when process exits successfully and no doneFn', async () => {
    const promise = runCommand('echo "hello"');

    lastChild?.stdout.emit('data', 'hello\n');
    lastChild?.emit('exit', 0);

    const output = await promise;
    expect(output).toContain('hello');
  });
});
