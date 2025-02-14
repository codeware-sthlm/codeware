import type { PackageManager } from '@nx/devkit';
import { updateFile } from '@nx/plugin/testing';

/**
 * Ensure the lock file is detected during e2e tests,
 * since it might be ignored by the workspace `.gitignore` file.
 *
 * Otherwise Nx will not find packages defined as `externalDependencies`
 * which will break the project graph when a target is executed.
 *
 * ---
 *
 * Example from `.nx/workspace-data/d/daemon.log`:
 *
 * ```log
 * /Users/hakans/Work/Codeware/gh-repos/codeware/tmp/nx-e2e/proj/node_modules/nx/src/hasher/native-task-hasher-impl.js:32
 *       const plans = this.planner.getPlansReference(tasks.map((t) => t.id), taskGraph);
 *
 * Error: The externalDependency 'eslint' for 'app-default:lint' could not be found
 *     at NativeTaskHasherImpl.hashTasks (/Users/hakans/Work/Codeware/gh-repos/codeware/tmp/nx-e2e/proj/node_modules/nx/src/hasher/native-task-hasher-impl.js:32:36)
 *     at InProcessTaskHasher.hashTasks (/Users/hakans/Work/Codeware/gh-repos/codeware/tmp/nx-e2e/proj/node_modules/nx/src/hasher/task-hasher.js:41:46)
 *     at handleHashTasks (/Users/hakans/Work/Codeware/gh-repos/codeware/tmp/nx-e2e/proj/node_modules/nx/src/daemon/server/handle-hash-tasks.js:30:56)
 *     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
 *     at async handleResult (/Users/hakans/Work/Codeware/gh-repos/codeware/tmp/nx-e2e/proj/node_modules/nx/src/daemon/server/server.js:180:16)
 *     at async handleMessage (/Users/hakans/Work/Codeware/gh-repos/codeware/tmp/nx-e2e/proj/node_modules/nx/src/daemon/server/server.js:112:9)
 *     at async /Users/hakans/Work/Codeware/gh-repos/codeware/tmp/nx-e2e/proj/node_modules/nx/src/daemon/server/server.js:74:9 {
 *   code: 'GenericFailure'
 * }
 * ```
 */
export const ensureLockFileIsDetected = (packageManager: PackageManager) => {
  let lockFile: string;

  switch (packageManager) {
    case 'bun':
      lockFile = 'bun.lockb';
      break;
    case 'npm':
      lockFile = 'package-lock.json';
      break;
    case 'pnpm':
      lockFile = 'pnpm-lock.yaml';
      break;
    case 'yarn':
      lockFile = 'yarn.lock';
      break;
  }

  updateFile(
    '.gitignore',
    (content) => `${content}
# Ensure lock file is detected by Nx to calculate the project graph properly
!${lockFile}
  `
  );
};
