import * as exec from '@actions/exec';
import { getPackageManagerCommand } from '@nx/devkit';

export async function runNxE2e(): Promise<boolean> {
  const pmc = getPackageManagerCommand();

  try {
    await exec.exec(pmc.exec, ['nx', 'run-many', '-t', 'e2e', '-c', 'ci']);

    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
}
