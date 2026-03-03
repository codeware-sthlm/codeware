#!/usr/bin/env tsx
import { cancel, intro, isCancel, select } from '@clack/prompts';

import { analysisMain } from './lib/analysis.js';
import { fetchAppTenantsMain } from './lib/fetch-app-tenants.js';
import { fetchDataMain } from './lib/fetch-data.js';

interface Tool {
  name: string;
  description: string;
  action: () => Promise<void>;
}

const tools: Tool[] = [
  {
    name: 'fetch-app-tenants',
    description: 'Fetch application tenants from Infisical',
    action: fetchAppTenantsMain
  },
  {
    name: 'fetch-data',
    description: 'Fetch tenant data from Infisical',
    action: fetchDataMain
  },
  {
    name: 'analysis',
    description: 'Analyze Infisical configuration and secrets',
    action: analysisMain
  }
];

async function main() {
  console.clear();
  intro('🔐 Infisical Tools');

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
  process.exit(1);
});
