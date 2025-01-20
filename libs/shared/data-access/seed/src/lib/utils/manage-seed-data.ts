/**
 * Resolve JSON data via imports to make it available in the bundle.
 * Then it's easily accessible from different applications,
 * such as the web client.
 *
 * Important!
 * There must be no sensitive data in the JSON files,
 * and it's not recommended to use this for production data.
 */

import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { Payload } from 'payload';

import {
  type SeedData,
  type SeedEnvironment,
  seedDataSchema
} from '../seed-types';
//import developmentData from '../static-data/seed.development.json';
//import previewData from '../static-data/seed.preview.json';
import { seedData as developmentData } from '../static-data/seed.development';
import { seedData as previewData } from '../static-data/seed.preview';

/**
 * Manage static seed data.
 *
 * **Production environment is not supported.**
 */
export const manageSeedData = {
  /**
   * Import static seed data for a given environment.
   *
   * @param environment - The environment to import data for.
   * @returns The seed data or null if the data is not valid or the environment is not supported.
   */
  import: (args: { environment: SeedEnvironment; payload?: Payload }) =>
    importSeedData(args),

  /**
   * Save seed data to environment-specific file.
   *
   * Nothing will be saved in run-time!
   *
   * @param environment - The environment to save the data for.
   * @param payload - The Payload instance.
   * @param seedData - The seed data to save.
   */
  save: (args: {
    environment: SeedEnvironment;
    payload: Payload;
    seedData: SeedData;
  }) => saveSeedData(args)
};

// Import seed data
const importSeedData = (args: {
  environment: SeedEnvironment;
  payload?: Payload;
}): SeedData | null => {
  const { environment, payload } = args;
  const logger = payload?.logger ?? console;

  let seedData: unknown;

  switch (environment) {
    case 'development':
      seedData = developmentData;
      break;
    case 'preview':
      seedData = previewData;
      break;
    default:
      logger.warn(`Static seed data for ${environment} not supported`);
      return null;
  }

  const { success, data } = seedDataSchema.safeParse(seedData);

  if (!success) {
    return null;
  }
  return data;
};

// Save seed data
const saveSeedData = (args: {
  seedData: SeedData;
  environment: SeedEnvironment;
  payload: Payload;
}): void => {
  const { seedData, environment, payload } = args;

  if (environment === 'production') {
    payload.logger.warn(
      'Save seed data to file is not supported in production'
    );
    return;
  }

  // The path is always relative since we're using TS files which will be bundled.
  const seedFile = resolve(
    __dirname,
    '..',
    'static-data',
    `seed.${environment}.ts`
  );

  // Note! File is never found in the bundle since it's compiled to JS.
  // It's a restriction by design to prevent saving seed data in run-time.
  if (!existsSync(seedFile)) {
    payload.logger.info(`Seed data is not saved, file not found: ${seedFile}`);
    return;
  }

  try {
    // Create TypeScript export content
    const tsContent = `// This file is auto-generated. Do not edit directly.
export const seedData = ${JSON.stringify(seedData, null, 2)} as const;
`;

    writeFileSync(seedFile, tsContent);
    payload.logger.info(`Saved seed data to file: ${seedFile}`);
  } catch (error) {
    payload.logger.error((error as Error).message);
    payload.logger.error(`Failed to save seed data to file: ${seedFile}`);
  }
};
