import { constants } from 'fs';
import { access } from 'fs/promises';
import { dirname, join, parse, resolve } from 'path';
import { cwd } from 'process';

/**
 * Searches for a file by walking up parent directories.
 *
 * Similar to `find-up` but uses `fs` to check for the file.
 *
 * @param filename - Name of the file to find
 * @param startDir - Directory to start searching from (defaults to current working directory)
 * @returns Full path to the file or `null` if not found
 */
export async function findUpFs(
  filename: string,
  startDir: string = cwd()
): Promise<string | null> {
  let currentDir = resolve(startDir);
  const root = parse(currentDir).root;

  while (true) {
    const filePath = join(currentDir, filename);

    try {
      // Check if file exists and is accessible
      await access(filePath, constants.F_OK);
      return filePath;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // If we've reached the root directory and haven't found the file
      if (currentDir === root) {
        return null;
      }

      // Move up to parent directory
      const parentDir = dirname(currentDir);

      // If we can't go up any further
      if (parentDir === currentDir) {
        return null;
      }

      currentDir = parentDir;
    }
  }
}
