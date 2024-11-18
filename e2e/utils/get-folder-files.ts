import { listFiles } from '@nx/plugin/testing';

/**
 * Get files in a folder within e2e ignoring `.gitignore` file
 * @param path Folder relative to e2e project path
 */
export const getFolderFiles = (path: string) =>
  listFiles(path).filter((f) => f !== '.gitkeep');
