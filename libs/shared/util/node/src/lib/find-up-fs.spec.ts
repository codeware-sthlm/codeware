import { constants } from 'fs';
import { access } from 'fs/promises';
import { join } from 'path/posix';
import { cwd } from 'process';

//import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findUpFs } from './find-up-fs';

// Mock the fs/promises module
vi.mock('fs/promises', () => ({
  access: vi.fn()
}));

// Mock process.cwd
vi.mock('process', () => ({
  cwd: vi.fn()
}));

describe('findUpFs', () => {
  const mockCwd = '/home/user/project';

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Set default cwd
    vi.mocked(cwd).mockReturnValue(mockCwd);

    // Default behavior: file not found
    vi.mocked(access).mockRejectedValue(new Error('File not found'));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should find file in current directory', async () => {
    const filename = 'package.json';
    const expectedPath = join(mockCwd, filename);

    vi.mocked(access).mockImplementation(async (path) => {
      if (path === expectedPath) {
        return undefined;
      }
      throw new Error('File not found');
    });

    const result = await findUpFs(filename);
    expect(result).toBe(expectedPath);
    expect(access).toHaveBeenCalledWith(expectedPath, constants.F_OK);
  });

  it('should find file in parent directory', async () => {
    const filename = 'package.json';
    const startPath = join(mockCwd, 'src/components');
    const expectedPath = join(mockCwd, filename);

    vi.mocked(access).mockImplementation(async (path) => {
      if (path === expectedPath) {
        return undefined;
      }
      throw new Error('File not found');
    });

    const result = await findUpFs(filename, { startPath });
    expect(result).toBe(expectedPath);
  });

  it('should return null when file not found up to root', async () => {
    const filename = 'nonexistent.file';
    const result = await findUpFs(filename);
    expect(result).toBeNull();
  });

  it('should stop searching at specified stopAtPath', async () => {
    const filename = 'package.json';
    const startPath = '/home/user/project/deep/nested/path';
    const stopAtPath = '/home/user/project';

    const result = await findUpFs(filename, { startPath, stopAtPath });
    expect(result).toBeNull();

    // Verify it didn't search beyond stopAtPath
    const parentPath = join(stopAtPath, '..', filename);
    expect(access).not.toHaveBeenCalledWith(parentPath, constants.F_OK);
  });

  it('should handle reaching root directory', async () => {
    const filename = 'system.config';
    const startPath = '/home/user';

    const result = await findUpFs(filename, { startPath });
    expect(result).toBeNull();
  });

  it('should use cwd when no startPath provided', async () => {
    const filename = 'config.json';
    const expectedPath = join(mockCwd, filename);

    vi.mocked(access).mockImplementation(async (path) => {
      if (path === expectedPath) {
        return undefined;
      }
      throw new Error('File not found');
    });

    await findUpFs(filename);
    expect(cwd).toHaveBeenCalled();
  });

  it('should handle custom startPath', async () => {
    const filename = 'special.config';
    const startPath = '/custom/start/path';
    const expectedPath = join(startPath, filename);

    vi.mocked(access).mockImplementation(async (path) => {
      if (path === expectedPath) {
        return undefined;
      }
      throw new Error('File not found');
    });

    const result = await findUpFs(filename, { startPath });
    expect(result).toBe(expectedPath);
  });

  it('should handle errors other than file not found', async () => {
    const filename = 'permission.denied';
    vi.mocked(access).mockRejectedValue(new Error('Permission denied'));

    const result = await findUpFs(filename);
    expect(result).toBeNull();
  });
});
