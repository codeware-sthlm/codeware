import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  outro,
  select,
  spinner,
  text
} from '@clack/prompts';
import { Fly } from '@codeware/fly-node';
import * as TOML from 'smol-toml';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to patches directory
const PATCHES_DIR = join(__dirname, '..', 'patches');

// Initialize Fly client
const fly = new Fly({
  logger: {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    info: () => {}, // Silent mode
    error: console.error,
    traceCLI: false,
    redactSecrets: true,
    verbose: false,
    debug: false,
    streamToConsole: false
  }
});

interface PatchOptions {
  patchFile?: string;
  appPrefix?: string;
}

interface PatchInfo {
  name: string;
  path: string;
  description: string;
}

/**
 * Discover available patch files in the patches directory
 */
function discoverPatches(): PatchInfo[] {
  try {
    const files = readdirSync(PATCHES_DIR);
    const patches: PatchInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.toml')) {
        const filePath = join(PATCHES_DIR, file);
        const content = readFileSync(filePath, 'utf-8');

        // Extract description from first comment line
        const firstLine = content.split('\n')[0];
        const description = firstLine.startsWith('#')
          ? firstLine.substring(1).trim()
          : '';

        patches.push({
          name: basename(file, '.toml'),
          path: filePath,
          description
        });
      }
    }

    return patches.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    // If patches directory doesn't exist or can't be read, return empty array
    return [];
  }
}

/**
 * List all Fly apps, optionally filtered by prefix
 */
async function listFlyApps(prefix?: string) {
  const apps = await fly.apps.list();

  if (prefix) {
    return apps.filter((app) => app.name.startsWith(prefix));
  }

  return apps;
}

/**
 * Get current configuration for an app
 */
async function getAppConfig(appName: string): Promise<string> {
  const tempFile = `tmp/.fly-config-${appName}-${Date.now()}.toml`;

  await fly.config.save({ app: appName, config: tempFile });

  if (!existsSync(tempFile)) {
    throw new Error(`Failed to fetch config for ${appName}`);
  }

  const config = readFileSync(tempFile, 'utf-8');

  if (!config || config.trim().length === 0) {
    throw new Error(`Empty config fetched for ${appName}`);
  }

  return config;
}

/**
 * Merge TOML configurations
 * The patch overwrites matching sections in the base config
 */
function mergeTOML(baseConfig: string, patchConfig: string): string {
  const base = TOML.parse(baseConfig);
  const patch = TOML.parse(patchConfig);

  // Deep merge objects
  const merged = deepMerge(base, patch);

  return TOML.stringify(merged);
}

/**
 * Deep merge two objects, with patch values taking precedence
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(base: any, patch: any): any {
  if (Array.isArray(patch)) {
    // For arrays, replace entirely with patch
    return patch;
  }

  if (typeof patch !== 'object' || patch === null) {
    return patch;
  }

  const result = { ...base };

  for (const key in patch) {
    if (Array.isArray(patch[key])) {
      // Replace arrays entirely
      result[key] = patch[key];
    } else if (typeof patch[key] === 'object' && patch[key] !== null) {
      // Recursively merge objects
      result[key] = deepMerge(result[key] || {}, patch[key]);
    } else {
      // Replace primitive values
      result[key] = patch[key];
    }
  }

  return result;
}

/**
 * Get current Docker image from a deployed app
 */
async function getCurrentImage(appName: string): Promise<string | null> {
  try {
    const status = await fly.status({ app: appName });

    if (!status) {
      return null;
    }

    // Get the first machine's image reference
    if (status.machines.length > 0) {
      const imageRef = status.machines[0].imageRef;
      // Return the full image reference
      return `${imageRef.registry}/${imageRef.repository}:${imageRef.tag}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Deploy updated configuration
 */
async function deployConfig(
  appName: string,
  configContent: string,
  image?: string | null
): Promise<void> {
  const tempFile = `tmp/.fly-deploy-${appName}-${Date.now()}.toml`;

  try {
    // Ensure we have valid content
    if (!configContent || configContent.trim().length === 0) {
      throw new Error('Config content is empty');
    }

    // Validate TOML before writing
    TOML.parse(configContent);

    // Write to temp file
    writeFileSync(tempFile, configContent, 'utf-8');

    // Verify file was created
    if (!existsSync(tempFile)) {
      throw new Error(`Failed to create temp config file: ${tempFile}`);
    }

    // Deploy
    await fly.deploy({
      app: appName,
      config: tempFile,
      ...(image && { image })
    });
  } catch (error) {
    throw new Error(
      `Deploy failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Normalize TOML formatting by parsing and re-stringifying
 */
function normalizeTOML(tomlString: string): string {
  try {
    const parsed = TOML.parse(tomlString);
    return TOML.stringify(parsed);
  } catch {
    return tomlString;
  }
}

/**
 * Generate diff lines for display in unified format with context
 */
function showConfigDiff(before: string, after: string): string[] {
  // Normalize both configs to ignore formatting differences
  const normalizedBefore = normalizeTOML(before);
  const normalizedAfter = normalizeTOML(after);

  const beforeLines = normalizedBefore.split('\n');
  const afterLines = normalizedAfter.split('\n');
  const diff: string[] = [];

  // Build a simple diff showing changes with context
  type DiffLine = {
    type: 'same' | 'removed' | 'added';
    content: string;
    beforeIdx?: number;
    afterIdx?: number;
  };
  const diffLines: DiffLine[] = [];

  let i = 0; // before index
  let j = 0; // after index

  while (i < beforeLines.length || j < afterLines.length) {
    const beforeLine = beforeLines[i] || '';
    const afterLine = afterLines[j] || '';

    if (
      i < beforeLines.length &&
      j < afterLines.length &&
      beforeLine === afterLine
    ) {
      // Same line
      diffLines.push({
        type: 'same',
        content: beforeLine,
        beforeIdx: i,
        afterIdx: j
      });
      i++;
      j++;
    } else if (
      i < beforeLines.length &&
      (j >= afterLines.length || !afterLines.slice(j).includes(beforeLine))
    ) {
      // Line removed
      diffLines.push({ type: 'removed', content: beforeLine, beforeIdx: i });
      i++;
    } else if (j < afterLines.length) {
      // Line added
      diffLines.push({ type: 'added', content: afterLine, afterIdx: j });
      j++;
    } else {
      i++;
    }
  }

  // Find hunks (groups of changes with context)
  const contextLines = 2;
  const hunks: { start: number; end: number }[] = [];
  let hunkStart = -1;

  for (let idx = 0; idx < diffLines.length; idx++) {
    if (diffLines[idx].type !== 'same') {
      if (hunkStart === -1) {
        hunkStart = Math.max(0, idx - contextLines);
      }
    } else if (hunkStart !== -1) {
      // Check if we should close this hunk
      let gapSize = 0;
      let nextChange = -1;
      for (
        let k = idx;
        k < diffLines.length && k < idx + contextLines * 2;
        k++
      ) {
        if (diffLines[k].type !== 'same') {
          nextChange = k;
          break;
        }
        gapSize++;
      }

      if (nextChange === -1 || gapSize >= contextLines * 2) {
        // Close hunk
        hunks.push({
          start: hunkStart,
          end: Math.min(diffLines.length, idx + contextLines)
        });
        hunkStart = -1;
      }
    }
  }

  // Close last hunk if still open
  if (hunkStart !== -1) {
    hunks.push({ start: hunkStart, end: diffLines.length });
  }

  // Generate diff output from hunks
  for (const hunk of hunks) {
    if (diff.length > 0) {
      diff.push(''); // Blank line between hunks
    }

    for (let idx = hunk.start; idx < hunk.end; idx++) {
      const line = diffLines[idx];

      switch (line.type) {
        case 'same':
          diff.push(`  ${line.content}`);
          break;
        case 'removed':
          diff.push(`- ${line.content}`);
          break;
        case 'added':
          diff.push(`+ ${line.content}`);
          break;
      }
    }
  }

  return diff;
}

/**
 * Analyze and summarize config changes
 */
function summarizeChanges(before: string, after: string): string[] {
  const beforeObj = TOML.parse(before);
  const afterObj = TOML.parse(after);
  const summary: string[] = [];

  // Track all keys from both configs
  const allKeys = new Set([
    ...Object.keys(beforeObj),
    ...Object.keys(afterObj)
  ]);

  for (const key of allKeys) {
    const beforeVal = JSON.stringify(beforeObj[key]);
    const afterVal = JSON.stringify(afterObj[key]);

    if (!(key in beforeObj)) {
      summary.push(`+[${key}]`);
    } else if (!(key in afterObj)) {
      summary.push(`-[${key}]`);
    } else if (beforeVal !== afterVal) {
      summary.push(`~[${key}]`);
    }
  }

  return summary;
}

/**
 * Main interactive script
 */
async function main(options: PatchOptions = {}) {
  console.clear();

  intro('🚀 Fly.io Configuration Patcher');

  // Get patch file
  let patchFile = options.patchFile;

  if (!patchFile) {
    // Discover available patches
    const availablePatches = discoverPatches();

    if (availablePatches.length > 0) {
      // Show select menu with available patches
      const patchSelection = await select({
        message: 'Select a patch to apply:',
        options: [
          ...availablePatches.map((patch) => ({
            value: patch.path,
            label: patch.name,
            hint: patch.description || 'No description'
          })),
          {
            value: '__custom__',
            label: 'Custom patch file...',
            hint: 'Provide a custom path'
          }
        ]
      });

      if (isCancel(patchSelection)) {
        cancel('Operation cancelled');
        process.exit(0);
      }

      if (patchSelection === '__custom__') {
        // Prompt for custom path
        const customPath = await text({
          message: 'Enter path to patch file (TOML):',
          placeholder: 'path/to/my-patch.toml',
          validate: (value) => {
            if (!value) return 'Patch file path is required';
            try {
              const content = readFileSync(value as string, 'utf-8');
              TOML.parse(content); // Validate TOML syntax
              return undefined;
            } catch (error) {
              return `Invalid TOML file: ${error instanceof Error ? error.message : String(error)}`;
            }
          }
        });

        if (isCancel(customPath)) {
          cancel('Operation cancelled');
          process.exit(0);
        }

        patchFile = customPath as string;
      } else {
        patchFile = patchSelection as string;
      }
    } else {
      // No patches found, fall back to text input
      const patchInput = await text({
        message: 'Enter path to patch file (TOML):',
        placeholder: 'path/to/my-patch.toml',
        validate: (value) => {
          if (!value) return 'Patch file path is required';
          try {
            const content = readFileSync(value as string, 'utf-8');
            TOML.parse(content); // Validate TOML syntax
            return undefined;
          } catch (error) {
            return `Invalid TOML file: ${error instanceof Error ? error.message : String(error)}`;
          }
        }
      });

      if (isCancel(patchInput)) {
        cancel('Operation cancelled');
        process.exit(0);
      }

      patchFile = patchInput as string;
    }
  }

  // Read and display patch
  const patchContent = readFileSync(patchFile, 'utf-8');
  log.info('Patch content:');
  log.message(patchContent);

  // Get app prefix filter
  let appPrefix = options.appPrefix;

  if (!appPrefix) {
    const prefixInput = await text({
      message: 'Filter apps by prefix (leave empty for all apps):',
      placeholder: 'cdwr-',
      defaultValue: ''
    });

    if (isCancel(prefixInput)) {
      cancel('Operation cancelled');
      process.exit(0);
    }

    appPrefix = (prefixInput as string) || undefined;
  }

  // List apps
  const s = spinner();
  s.start('Fetching Fly apps...');
  let apps: Awaited<ReturnType<typeof listFlyApps>>;
  try {
    apps = await listFlyApps(appPrefix);
    s.stop(
      `Found ${apps.length} app(s)${appPrefix ? ` starting with "${appPrefix}"` : ''}`
    );
  } catch (error) {
    s.stop('Failed to fetch apps');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (apps.length === 0) {
    outro('No apps found');
    process.exit(0);
  }

  // Select apps to patch
  const selectedApps = await multiselect({
    message: 'Select apps to patch (use space to select, enter to confirm):',
    options: apps.map((app) => ({
      value: app.name,
      label: app.name,
      hint: `${app.organization.name} | ${app.status}`
    })),
    required: true
  });

  if (isCancel(selectedApps)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const appNames = selectedApps as string[];

  if (appNames.length === 0) {
    outro('No apps selected');
    process.exit(0);
  }

  log.info(`Selected ${appNames.length} app(s): ${appNames.join(', ')}`);

  // Confirm before proceeding
  const confirmPatch = await confirm({
    message: `Ready to patch ${appNames.length} app(s). Continue?`,
    active: 'Yes, proceed',
    inactive: 'No, cancel',
    initialValue: true
  });

  if (isCancel(confirmPatch) || !confirmPatch) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  // Process each app
  let successCount = 0;
  const failedApps: string[] = [];
  const skippedApps: string[] = [];

  for (let i = 0; i < appNames.length; i++) {
    const appName = appNames[i];

    log.step(`Processing ${appName} (${i + 1}/${appNames.length})`);

    const appSpinner = spinner();

    try {
      // Fetch current config
      appSpinner.start('Fetching current configuration...');
      const currentConfig = await getAppConfig(appName);
      appSpinner.stop('Configuration fetched');

      // Merge with patch
      appSpinner.start('Applying patch...');
      const patchedConfig = mergeTOML(currentConfig, patchContent);

      // Validate the patched config
      try {
        TOML.parse(patchedConfig);
      } catch (error) {
        throw new Error(
          `Invalid TOML generated after merge: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      appSpinner.stop('Patch applied');

      // Show diff
      const diff = showConfigDiff(currentConfig, patchedConfig);

      if (diff.length === 0) {
        log.warn('No changes detected');
        skippedApps.push(appName);
        continue;
      }

      // Show summary of changes
      const summary = summarizeChanges(currentConfig, patchedConfig);
      const summaryText =
        summary.length > 0 ? `Summary: ${summary.join(', ')}\n` : '';

      // Build diff output
      const maxLinesToShow = 30;
      const diffToShow = diff.slice(0, maxLinesToShow);
      const moreLines =
        diff.length > maxLinesToShow
          ? `\n... and ${diff.length - maxLinesToShow} more line(s)`
          : '';

      // Output everything in a single message
      log.message(`\n${summaryText}\n${diffToShow.join('\n')}${moreLines}\n`);

      // Confirm deployment
      const confirmDeploy = await confirm({
        message: `Deploy changes to ${appName}?`,
        active: 'Yes, deploy',
        inactive: 'Skip',
        initialValue: true
      });

      if (isCancel(confirmDeploy) || !confirmDeploy) {
        log.info(`Skipped ${appName}`);
        skippedApps.push(appName);
        continue;
      }

      // Get current image to reuse
      appSpinner.start('Getting current image...');
      const currentImage = await getCurrentImage(appName);
      if (currentImage) {
        appSpinner.stop(
          `Using image: ${currentImage.substring(0, 60)}${currentImage.length > 60 ? '...' : ''}`
        );
      } else {
        appSpinner.stop('No image found, will rebuild');
      }

      // Deploy
      appSpinner.start('Deploying configuration...');
      await deployConfig(appName, patchedConfig, currentImage);
      appSpinner.stop(`✅ Successfully deployed to ${appName}`);

      successCount++;
    } catch (error) {
      appSpinner.stop(`❌ Failed to process ${appName}`, 1);
      log.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      failedApps.push(appName);
    }

    log.message(''); // Empty line for spacing
  }

  // Summary
  const summary = [
    `✅ Successfully patched: ${successCount}`,
    ...(skippedApps.length > 0
      ? [`⏭️  Skipped: ${skippedApps.length} (${skippedApps.join(', ')})`]
      : []),
    ...(failedApps.length > 0
      ? [`❌ Failed: ${failedApps.length} (${failedApps.join(', ')})`]
      : [])
  ];

  outro(summary.join('\n'));

  process.exit(failedApps.length > 0 ? 1 : 0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: PatchOptions = {};

if (args.length > 0) {
  options.patchFile = args[0];
}

if (args.length > 1) {
  options.appPrefix = args[1];
}

// Export for use as a library
export { main as patchFlyConfig, type PatchOptions };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main(options).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
