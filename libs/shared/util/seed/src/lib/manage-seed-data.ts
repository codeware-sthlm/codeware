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

import { withEnvVars } from '@codeware/shared/util/zod';

import { SeedDataSchema } from './schema';
import { seedData as developmentData } from './static-data/seed.development';
import { seedData as previewData } from './static-data/seed.preview';

type Logger = {
  log: typeof console.log;
  warn: typeof console.warn;
  error: typeof console.error;
};

/** Available seed data environments */
type SeedEnvironment = 'development' | 'preview';

/**
 * Apply environment variable lookup to the schema to resolve the actual values
 */
const EnvSeedDataSchema = withEnvVars(SeedDataSchema);

/**
 * Manage static seed data.
 *
 * **Production environment is not supported.**
 */
export const manageSeedData = {
  /**
   * Load static seed data for a given environment.
   *
   * @param environment - The environment to load the seed data for.
   * @param logger - The logger to use for the load operation (defaults to `console`)
   * @returns The seed data or null if the data is not valid or the environment is not supported.
   */
  load: <TData extends object>(environment: SeedEnvironment, logger?: Logger) =>
    loadSeedData<TData>(environment, logger),

  /**
   * Save seed data to environment-specific file.
   *
   * Nothing will be saved in run-time!
   *
   * @param environment - The environment to save the data for.
   * @param data - The seed data to save.
   * @param logger - The logger to use for the save operation (defaults to `console`)
   */
  save: <TData extends object>(
    environment: SeedEnvironment,
    data: TData,
    logger?: Logger
  ) => saveSeedData<TData>(environment, data, logger)
};

// Load seed data
const loadSeedData = <TData>(
  environment: SeedEnvironment,
  logger = { log: console.log, warn: console.warn, error: console.error }
) => {
  let seedData: TData;

  switch (environment) {
    case 'development':
      seedData = developmentData as TData;
      break;
    case 'preview':
      seedData = previewData as TData;
      break;
    default:
      logger.warn(`Static seed data for ${environment} not supported`);
      return null;
  }

  const { success, data, error } = EnvSeedDataSchema.safeParse(seedData);

  if (!success) {
    logger.warn(
      `Invalid seed data found in '${environment}' environment:\n${JSON.stringify(
        error.errors,
        null,
        2
      )}`
    );
    logger.warn('Verify the seed file has not been modified by mistake!');
    return null;
  }

  return data;
};

// Save seed data
const saveSeedData = <TData>(
  environment: SeedEnvironment,
  data: TData,
  logger = { log: console.log, warn: console.warn, error: console.error }
): void => {
  if (environment !== 'development' && environment !== 'preview') {
    logger.warn(`Save seed data to file is not supported in ${environment}`);
    return;
  }

  // The path is always relative since we're using TS files which will be bundled.
  const seedFile = resolve(__dirname, 'static-data', `seed.${environment}.ts`);

  // Note! File is never found in the bundle since it's compiled to JS.
  // It's a restriction by design to prevent saving seed data in run-time.
  if (!existsSync(seedFile)) {
    logger.log(`Seed data is not saved, file not found: ${seedFile}`);
    return;
  }

  try {
    // Create TypeScript export content
    const tsContent = `// This file is auto-generated. Do not edit directly.
export const seedData = ${JSON.stringify(data, null, 2)} as const;
`;

    writeFileSync(seedFile, tsContent);
    logger.log(`Saved seed data to file: ${seedFile}`);
  } catch (error) {
    logger.error((error as Error).message);
    logger.error(`Failed to save seed data to file: ${seedFile}`);
  }
};
