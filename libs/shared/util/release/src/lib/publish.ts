import { execSync } from 'child_process';

import { createProjectGraphAsync, getPackageManagerCommand } from '@nx/devkit';
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
    // Restrict to projects that actually have a "nx-release-publish" target.
    // Without this, nx matches every project in every release group - including
    // the "apps" group (cms, web), which are versioned/tagged but never published
    // to npm - and throws because they have no such target.
    const { nodes } = await createProjectGraphAsync();
    const projects = Object.values(nodes)
      .filter((node) => node.data.targets?.['nx-release-publish'])
      .map((node) => node.name);

    // "nx-release-publish" only pushes an existing dist/ to the registry, it
    // never builds - and `release` mode's own version-bump step (which does
    // build) may be skipped when re-running publish standalone. Rebuild here
    // so a stale dist/ never gets published. Streamed via stdio: 'inherit'
    // instead of captured, so a large build never blows exec's maxBuffer.
    const pm = getPackageManagerCommand();
    execSync(`${pm.exec} nx run-many -t build -p ${projects.join(',')}`, {
      stdio: 'inherit'
    });

    const result = await releasePublish({
      dryRun,
      verbose,
      otp,
      projects
    });

    const total = Object.values(result).length;
    const successful = Object.values(result).filter((r) => r.code === 0).length;

    return { successful, total };
  } catch (error) {
    console.error(`Publish packages: ${chalk.red((error as Error).message)}`);
    return null;
  }
};
