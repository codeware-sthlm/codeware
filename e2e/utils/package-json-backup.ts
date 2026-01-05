import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync
} from 'fs';
import { join } from 'path';

const TMP_DIR = './tmp';

const getBackupFilePath = (tmpDir: string): string =>
  join(tmpDir, 'package-json-backup.json');

/**
 * Get all `package.json` paths in the root and `packages` folder.
 */
const getPackageJsonPaths = (): string[] => {
  const packageJsonPaths: string[] = [];

  if (existsSync('package.json')) {
    packageJsonPaths.push('package.json');
  }

  if (!existsSync('packages')) {
    return packageJsonPaths;
  }

  const packageDirs = readdirSync('packages', { withFileTypes: true });

  for (const dirent of packageDirs) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const packageJsonPath = join('packages', dirent.name, 'package.json');

    if (existsSync(packageJsonPath)) {
      packageJsonPaths.push(packageJsonPath);
    }
  }

  return packageJsonPaths;
};

/**
 * Backup `package.json` files for all packages in the monorepo to a temp file.
 * @param tmpDir Temporary directory to store the backup file (default: './tmp')
 */
export const backupPackageJsonFiles = (tmpDir: string = TMP_DIR): void => {
  const backupFile = getBackupFilePath(tmpDir);
  const packageJsonPaths = getPackageJsonPaths();

  if (packageJsonPaths.length === 0) {
    return;
  }

  const snapshot: Record<string, string> = {};

  for (const packageJsonPath of packageJsonPaths) {
    snapshot[packageJsonPath] = readFileSync(packageJsonPath, 'utf8');
  }

  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }

  writeFileSync(backupFile, JSON.stringify(snapshot), 'utf8');

  console.log(
    `Backed up ${packageJsonPaths.length} package.json files to ${backupFile}`
  );
};

/**
 * Restore `package.json` files for packages in the monorepo from the backup file.
 * @param tmpDir Temporary directory where the backup file is stored (default: './tmp')
 */
export const restorePackageJsonFiles = (tmpDir: string = TMP_DIR): void => {
  const backupFile = getBackupFilePath(tmpDir);

  if (!existsSync(backupFile)) {
    return;
  }

  try {
    const snapshot: Record<string, string> = JSON.parse(
      readFileSync(backupFile, 'utf8')
    );

    const fileEntries = Object.entries(snapshot);
    for (const [relativePath, content] of fileEntries) {
      writeFileSync(join(process.cwd(), relativePath), content, 'utf8');
    }

    unlinkSync(backupFile);
    console.log(
      `Restored ${fileEntries.length} package.json files from ${backupFile}`
    );
  } catch (error) {
    console.warn('Failed to restore package.json files from backup:', error);
  }
};
