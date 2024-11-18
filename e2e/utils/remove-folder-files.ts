import { rmSync } from 'fs';
import { join } from 'path';

import { logDebug } from '@codeware/core';
import { tmpProjPath } from '@nx/plugin/testing';

import { getFolderFiles } from './get-folder-files';

/**
 * Remove files in a folder within e2e ignoring `.gitignore` file
 * @param path Folder relative to e2e project path
 */
export const removeFolderFiles = (path: string) => {
  for (const file of getFolderFiles(path)) {
    const src = join(tmpProjPath(path), file);
    logDebug('Remove file', src);
    rmSync(src, { force: true });
  }
};
