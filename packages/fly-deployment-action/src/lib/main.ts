import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as core from '@actions/core';

import { flyDeployment } from './fly-deployment';
import {
  type ActionInputs,
  ActionInputsSchema
} from './schemas/action-inputs.schema';

/**
 * Main action function
 */
export async function run(): Promise<void> {
  try {
    const appDetailsInput = core.getInput('app-details');
    const appDetails = appDetailsInput ? JSON.parse(appDetailsInput) : {};

    // Prefer images-path over images to avoid GitHub Actions secret scanning
    // suppressing the images job output when it matches a registered secret pattern.
    const imagesPathInput = core.getInput('images-path');
    const imagesInput = core.getInput('images');
    let images: Record<string, string> | undefined;
    if (imagesPathInput) {
      images = JSON.parse(readFileSync(imagesPathInput, 'utf-8'));
    } else if (imagesInput) {
      images = JSON.parse(imagesInput);
    }

    const inputs = ActionInputsSchema.parse({
      apps: JSON.parse(core.getInput('apps') || '[]'),
      env: core.getMultilineInput('env'),
      environment: core.getInput('environment') as ActionInputs['environment'],
      flyApiToken: core.getInput('fly-api-token'),
      flyOrg: core.getInput('fly-org'),
      flyRegion: core.getInput('fly-region'),
      flyTraceCli: core.getBooleanInput('fly-trace-cli'),
      flyConsoleLogs: core.getBooleanInput('fly-console-logs'),
      images,
      optOutDepotBuilder: core.getBooleanInput('opt-out-depot-builder'),
      secrets: core.getMultilineInput('secrets'),
      appDetails,
      token: core.getInput('token', { required: true })
    } satisfies ActionInputs);

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    const { environment, projects } = await flyDeployment(inputs);

    core.info(
      `Set outputs from response\n${JSON.stringify(projects, null, 2)}`
    );

    core.setOutput('environment', environment);
    core.setOutput(
      'failed',
      projects.filter((p) => p.action === 'failed').map((p) => p.appOrProject)
    );
    core.setOutput(
      'deployed',
      projects
        .filter((p) => p.action === 'deploy')
        .reduce((acc, p) => ({ ...acc, [`${p.name}`]: p.url }), {})
    );
    core.setOutput('projects', JSON.stringify(projects));

    // Write projects to a file for artifact-based transfer — job outputs containing
    // Fly.io URLs can be suppressed by GitHub Actions secret scanning.
    const projectsPath = join(
      process.env['RUNNER_TEMP'] || tmpdir(),
      'fly-projects.json'
    );
    writeFileSync(projectsPath, JSON.stringify(projects));
    core.setOutput('projects-path', projectsPath);

    const failedProjects = projects.filter((p) => p.action === 'failed');
    if (failedProjects.length > 0) {
      const failedList = failedProjects
        .map(
          (p) =>
            `${p.appOrProject}: ${'error' in p ? p.error : 'Unknown error'}`
        )
        .join('\n');
      core.setFailed(
        `Deployment failed for ${failedProjects.length} project(s):\n${failedList}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
