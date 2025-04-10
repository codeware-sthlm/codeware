import { constants } from 'fs';
import { access } from 'fs/promises';
import { dirname, join, parse, relative, resolve } from 'path/posix';
import { cwd } from 'process';

/**
 * This is a copy from @codeware/shared/util/node
 * since packages cannot resolve local packages properly.
 * It could possible be fixed transforming to typescript references.
 */

/**
 * Searches for a file by walking up parent directories.
 *
 * Similar to `find-up` but uses `fs` to check for the file.
 *
 * All paths are treated as POSIX paths for cross-platform compatibility.
 *
 * @param filename - Name of the file to find
 * @param options - Search options
 * @returns Path to the file or `null` if not found
 */
export async function findUpFs(
  filename: string,
  options: {
    /**
     * The path to start searching from.
     * Defaults to current working directory.
     */
    startPath?: string;
    /**
     * The path to stop searching for the file.
     * Defaults to file system root.
     */
    stopAtPath?: string;
  } = {}
): Promise<string | null> {
  let currentDir = resolve(options.startPath ?? cwd());
  const root = options.stopAtPath ? options.stopAtPath : parse(currentDir).root;

  while (true) {
    const filePath = join(currentDir, filename);

    try {
      // Check if file exists and is accessible
      await access(filePath, constants.F_OK);
      return filePath;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // If we've reached the root directory and haven't found the file
      if (relative(root, currentDir) === '') {
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
