import { promises } from 'fs';
import { basename, join } from 'path';
import { cwd } from 'process';

type Options = {
  /**
   * Starting directory to search from
   * @default cwd()
   */
  startDir?: string;
};

/**
 * Find a file by searching downwards from a starting directory.
 *
 * @param filename - The name of the file to find
 * @param options - Options for the search
 * @returns The absolute path to the found file or `null` if not found
 */
export const findDown = async (
  filename: string,
  { startDir = cwd() }: Options = {}
): Promise<string | null> => {
  // Get all files recursively, returns paths relative to startDir
  const files = await promises.readdir(startDir, { recursive: true });

  // Find first file matching the name we want
  const found = files.find((file) => basename(file.toString()) === filename);

  // Convert relative path to absolute if found
  return found ? join(startDir, found.toString()) : null;
};
