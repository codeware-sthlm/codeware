import {
  cancel,
  confirm,
  group,
  intro,
  outro,
  select,
  text
} from '@clack/prompts';
import { readJsonFile } from '@nx/devkit';
import chalk from 'chalk';
import { releaseVersion } from 'nx/release';
import type { PackageJson } from 'nx/src/utils/package-json';

import { whoami } from '../utils/whoami';

import { changelogs } from './changelogs';
import { publish } from './publish';
import { revertPackageJson } from './revert-package-json';

type Mode = 'publish' | 'release';

/** Finalizing message when there is a release to handle, but user selected dryRun mode */
const dryRunOutro = (): void =>
  outro(
    `👓 ${chalk.green('Done!')} Nothing gets changed when running in ${chalk.bgYellow(' preview ')} mode`
  );

(async () => {
  intro(`Let's release some Nx Plugin packages 📦`);

  const release = await group(
    {
      mode: () =>
        select({
          message: 'What parts of the release process do you want to run?',
          options: [
            {
              value: 'release',
              label: `Default release process 💫`,
              hint: 'analyze commits, create changelog and publish'
            },
            {
              value: 'publish',
              label: 'Publish a release 📦',
              hint: 'release must have been pre-generated earlier'
            }
          ],
          initialValue: 'release'
        }),
      postponePublish: ({ results: { mode } }) => {
        // If the user selected publish mode, the publish prompt is not needed
        if ((mode as Mode) === 'publish') {
          return Promise.resolve('false');
        }
        return select({
          message: 'Do you want GitHub Actions to publish the packages to NPM?',
          options: [
            {
              value: 'true',
              label: 'Yes, let GitHub Actions do it',
              hint: 'recommended'
            },
            {
              value: 'false',
              label: 'No, publish the packages directly'
            }
          ],
          initialValue: 'true'
        });
      },
      dryRun: () =>
        select({
          message: 'Do you want to see a preview before making any changes?',
          options: [
            {
              value: 'true',
              label: `Yes, just a preview 🤓`,
              hint: 'recommended before the actual run'
            },
            {
              value: 'false',
              label: 'No, run the selected process 🚀'
            }
          ],
          initialValue: 'true'
        }),
      otp: ({ results: { dryRun, mode, postponePublish } }) => {
        // Require OTP for publish mode or a complete release process
        const modeT = mode as Mode;
        if (
          dryRun === 'false' &&
          (modeT === 'publish' ||
            (modeT === 'release' && postponePublish === 'false'))
        ) {
          return text({
            message: 'Enter NPM OTP code from your 2FA app:',
            validate: (value) => {
              if (!value) {
                return 'OTP code is required';
              }
              if (!/^\d{6}$/.test(value)) {
                return 'OTP code must be a 6-digit number';
              }
              return undefined;
            }
          });
        }
        return;
      },
      verbose: () =>
        confirm({
          message: 'Do you want to enable verbose logging?',
          active: 'Verbose logging',
          inactive: 'Normal logging',
          initialValue: false
        }),
      confirmRelease: ({ results: { dryRun } }) => {
        // If the user selected dryRun, skip the confirmation prompt
        if (dryRun === 'true') {
          return;
        }
        return confirm({
          message: `✋ You will make changes! Are you sure?`,
          active: 'Yes, do it!',
          inactive: `No, I'm not ready yet`
        });
      }
    },
    {
      // On Cancel callback that wraps the group
      // So if the user cancels one of the prompts in the group this function will be called
      onCancel: () => {
        cancel('🚫 Release cancelled.');
        process.exit(0);
      }
    }
  );

  const { confirmRelease, verbose } = release;
  const mode = release.mode as Mode;
  const dryRun = release.dryRun === 'true';
  const otp = Number(release.otp);
  // Is `undefined` if the user selected dryRun
  const postponePublish = release.postponePublish !== 'false';

  if (confirmRelease === false) {
    cancel('🚫 Release cancelled.');
    process.exit(0);
  }

  console.log('');

  // Verify npm authentication before running publish
  if (otp) {
    const npmUser = await whoami();
    if (!npmUser) {
      console.log(
        `${chalk.red('🚫 Npm publish requires you to be logged in.\n')}`
      );
      console.log(
        `You need to authorize using ${chalk.yellow.bold('npm login')} and follow the instructions.`
      );
      console.log('After a successful login, try to publish again.');
      process.exit(0);
    }
  }

  switch (mode) {
    case 'publish':
      break;
    case 'release':
      {
        const originPackageFile = readJsonFile<PackageJson>('package.json');

        // Analyze changes
        console.log(`${chalk.magenta.underline('Analyze changes')}`);
        const versionStatus = await releaseVersion({
          dryRun,
          verbose
        });
        const projectsVersionData = versionStatus.projectsVersionData;

        // Workaround when Nx makes unwanted changes to package.json
        if (!dryRun) {
          revertPackageJson(originPackageFile, projectsVersionData);
        }

        // Generate changelogs and exit when it fails
        if (
          !(await changelogs({
            dryRun,
            verbose,
            versionData: projectsVersionData
          }))
        ) {
          process.exit(1);
        }

        // Check if there are any changes to publish
        const newVersionFound = Object.keys(projectsVersionData).some(
          (project) => projectsVersionData[project].newVersion
        );

        if (newVersionFound && postponePublish && !dryRun) {
          outro('🚀 The new release will be published by GitHub Actions!');
          process.exit(0);
        }

        // Skip publish if there are no changes
        if (!newVersionFound) {
          process.exit(0);
        }

        // Skip publish with info message if the user selected dryRun and postponed publish
        if (dryRun && postponePublish) {
          dryRunOutro();
          process.exit(0);
        }

        // Skip publish
        if (postponePublish) {
          process.exit(0);
        }
      }
      break;
  }

  const publishStats = await publish({ dryRun, otp, verbose });
  if (!publishStats) {
    process.exit(1);
  }
  const { successful, total } = publishStats;
  if (!total) {
    outro('No packages to publish');
    process.exit(0);
  }

  const term = mode === 'publish' ? 'Publish' : 'Release';
  const termed = mode === 'publish' ? 'Published' : 'Released';

  if (dryRun) {
    dryRunOutro();
  } else {
    outro(
      successful === total
        ? chalk.green(`🚀 ${termed} successfully!`)
        : successful > 0
          ? chalk.yellow(
              `🚀 ${termed} ${successful} successfully, while ${total - successful} failed`
            )
          : chalk.red(`🚫 ${term} failed`)
    );
  }

  process.exit(0);
})();
