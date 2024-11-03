import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { getPackageManagerCommand } from '@nx/devkit';

export async function runNxE2e(): Promise<boolean> {
  const pmc = getPackageManagerCommand();

  try {
    core.info('Run e2e');

    await exec.exec(pmc.exec, ['nx', 'e2e', 'nx-payload-e2e']);

    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
}
