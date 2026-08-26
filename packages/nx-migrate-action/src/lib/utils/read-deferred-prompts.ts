import { existsSync, readFileSync } from 'node:fs';

import * as core from '@actions/core';

import type { DeferredPrompt } from './types';

/**
 * Read the prompt migrations from the migrations file.
 *
 * Nx defers these to an interactive AI agent, which CI never provides,
 * so they are always left for a developer to apply.
 *
 * @param migrationsFile Path to the migrations file
 * @returns Deferred prompt migrations, empty when there are none
 */
export const readDeferredPrompts = (
  migrationsFile = 'migrations.json'
): Array<DeferredPrompt> => {
  if (!existsSync(migrationsFile)) {
    return [];
  }

  try {
    const { migrations } = JSON.parse(readFileSync(migrationsFile, 'utf-8'));

    return (Array.isArray(migrations) ? migrations : [])
      .filter(
        (migration): migration is DeferredPrompt =>
          typeof migration?.name === 'string' &&
          typeof migration?.prompt === 'string' &&
          migration.prompt.length > 0
      )
      .map(({ name, prompt }) => ({ name, prompt }));
  } catch {
    core.warning(`Could not read prompt migrations from '${migrationsFile}'`);
    return [];
  }
};
