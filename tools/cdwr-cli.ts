#!/usr/bin/env tsx
/* eslint-disable @nx/enforce-module-boundaries */
import { cancel, intro, isCancel, select } from '@clack/prompts';

import { dropDatabase } from './db-tools/lib/drop-db.js';
import { showAppInfo } from './fly-tools/lib/app-info.js';
import { patchFlyConfig } from './fly-tools/lib/patch-config.js';
import { restartApp } from './fly-tools/lib/restart-app.js';
import { analysisMain } from './infisical/lib/analysis.js';
import { fetchAppTenantsMain } from './infisical/lib/fetch-app-tenants.js';
import { fetchDataMain } from './infisical/lib/fetch-data.js';

interface Tool {
  name: string;
  description: string;
  action: () => Promise<void>;
}

const tools: Tool[] = [
  {
    name: 'drop-db',
    description: 'Drop databases from Fly Postgres cluster',
    action: dropDatabase
  },
  {
    name: 'restart-app',
    description: 'Restart Fly app machines',
    action: restartApp
  },
  {
    name: 'app-info',
    description: 'View Fly app information and machine states',
    action: showAppInfo
  },
  {
    name: 'patch-config',
    description: 'Apply TOML patches to Fly apps',
    action: patchFlyConfig
  },
  {
    name: 'infisical-tenants',
    description: 'Fetch application tenants from Infisical',
    action: fetchAppTenantsMain
  },
  {
    name: 'infisical-data',
    description: 'Fetch tenant data from Infisical',
    action: fetchDataMain
  },
  {
    name: 'infisical-analysis',
    description: 'Analyze Infisical configuration and secrets',
    action: analysisMain
  }
];

async function main() {
  console.clear();
  intro('🛠️  Codeware CLI Tools');

  const selectedTool = await select({
    message: 'Select a tool to run:',
    options: tools.map((tool) => ({
      value: tool.name,
      label: tool.name,
      hint: tool.description
    }))
  });

  if (isCancel(selectedTool)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const tool = tools.find((t) => t.name === selectedTool);
  if (!tool) {
    cancel('Tool not found');
    process.exit(1);
  }

  console.log(''); // Add spacing
  await tool.action();
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
