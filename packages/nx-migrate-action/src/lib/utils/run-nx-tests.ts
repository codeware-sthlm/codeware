import * as exec from '@actions/exec';
import { getPackageManagerCommand } from '@nx/devkit';

export async function runNxTests(): Promise<boolean> {
  const pmc = getPackageManagerCommand();

  try {
    await exec.exec(pmc.exec, [
      'nx',
      'run-many',
      '-t',
      'lint,test,build',
      '-c',
      'ci'
    ]);

    // TODO: Enable when release configuration is applied to nx.json
    // core.debug('Dry-run release');
    // await exec.exec(pmc.exec, ['nx', 'release', '-d']);

    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
}
