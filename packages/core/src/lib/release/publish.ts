import { exec } from 'child_process';
import { promisify } from 'util';

import { getPackageManagerCommand } from '@nx/devkit';
import chalk from 'chalk';
import { releasePublish } from 'nx/release';

/**
 * Publish packages with pending releases to registry
 *
 * @param options Publish options
 * @returns status of published packages or `null` when an error occured
 */
export const publish = async (options: {
  otp: number;
  dryRun?: boolean;
  verbose?: boolean;
}): Promise<{ successful: number; total: number } | null> => {
  const { otp, dryRun, verbose } = options;

  console.log(`${chalk.magenta.underline('Publish packages')}\n`);

  try {
    const pm = getPackageManagerCommand();
    const { stdout } = await promisify(exec)(`${pm.exec} nx run-many -t build`);
    console.log(stdout);

    const result = await releasePublish({
      dryRun,
      verbose,
      otp
    });

    const total = Object.values(result).length;
    const successful = Object.values(result).filter((r) => r.code === 0).length;

    return { successful, total };
  } catch (error) {
    console.error(`Publish packages: ${chalk.red((error as Error).message)}`);
    return null;
  }
};
