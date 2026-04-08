import { exec } from 'child_process';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

import {
  cancel,
  intro,
  isCancel,
  outro,
  select,
  spinner
} from '@clack/prompts';
import {
  type Environment,
  EnvironmentSchema,
  withInfisical
} from '@codeware/shared/feature/infisical';
import * as dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../infisical/.env.infisical') });

const Environments = EnvironmentSchema.options;
type SyncEnv = Environment;

interface S3Config {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
}

/**
 * Fetch S3 credentials for the CMS from Infisical
 */
async function fetchS3Config(environment: SyncEnv): Promise<S3Config> {
  const secrets = await withInfisical({
    environment,
    filter: { path: '/apps/cms' }
  });

  if (!secrets) {
    throw new Error(
      `Could not connect to Infisical for environment: ${environment}`
    );
  }

  const get = (key: string) =>
    secrets.find((s) => s.secretKey === key)?.secretValue ?? '';

  const config: S3Config = {
    bucket: get('S3_BUCKET'),
    accessKeyId: get('S3_ACCESS_KEY_ID'),
    secretAccessKey: get('S3_SECRET_ACCESS_KEY'),
    endpoint: get('S3_ENDPOINT'),
    region: get('S3_REGION') || 'eu-central-1'
  };

  const missing = Object.entries(config)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `Missing S3 secrets in Infisical /apps/cms for environment "${environment}": ${missing.join(', ')}`
    );
  }

  return config;
}

/**
 * Check that the AWS CLI is available on PATH
 */
async function checkAwsCli(): Promise<void> {
  try {
    await execAsync('aws --version');
  } catch {
    throw new Error(
      'AWS CLI is not available. Install it from https://aws.amazon.com/cli/ and ensure it is on your PATH.'
    );
  }
}

/**
 * Sync the S3 bucket to a local directory using the AWS CLI.
 * Returns the number of files downloaded.
 */
async function syncBucket(config: S3Config, localDir: string): Promise<number> {
  const { stdout } = await execAsync(
    [
      'aws s3 sync',
      `s3://${config.bucket}`,
      `"${localDir}"`,
      `--endpoint-url "${config.endpoint}"`,
      `--region ${config.region}`,
      '--no-progress'
    ].join(' '),
    {
      env: {
        ...process.env,
        AWS_ACCESS_KEY_ID: config.accessKeyId,
        AWS_SECRET_ACCESS_KEY: config.secretAccessKey
      }
    }
  );

  // Each synced file produces one "download: ..." line
  return stdout
    .trim()
    .split('\n')
    .filter((line) => line.startsWith('download:') || line.startsWith('copy:'))
    .length;
}

/**
 * Main interactive storage sync script
 */
async function main() {
  console.clear();
  intro('🗂️   CMS Storage Sync');

  // Select environment
  const environment = await select<SyncEnv>({
    message: 'Select environment to sync from:',
    options: Environments.map((env) => ({ value: env, label: env }))
  });

  if (isCancel(environment)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const env = environment as SyncEnv;
  const s = spinner();

  // Verify AWS CLI is installed
  s.start('Checking for AWS CLI...');
  try {
    await checkAwsCli();
    s.stop('AWS CLI found');
  } catch (error) {
    s.stop('AWS CLI not found');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Fetch S3 config from Infisical
  s.start(`Fetching S3 credentials for ${env} from Infisical...`);

  let s3Config: S3Config;
  try {
    s3Config = await fetchS3Config(env);
    s.stop(`S3 credentials fetched (bucket: ${s3Config.bucket})`);
  } catch (error) {
    s.stop('Failed to fetch S3 credentials');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Sync destination: backups/storage-{env}-{timestamp}/
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .slice(0, 19); // e.g. 2026-04-04_12-30-00

  const dirName = `storage-${env}-${timestamp}`;
  const localDir = path.resolve(__dirname, '../../../backups', dirName);
  mkdirSync(localDir, { recursive: true });

  s.start(`Syncing s3://${s3Config.bucket} → backups/${dirName}/...`);

  let fileCount: number;
  try {
    fileCount = await syncBucket(s3Config, localDir);
    s.stop(
      fileCount > 0 ? `${fileCount} file(s) downloaded` : 'Nothing to sync'
    );
  } catch (error) {
    s.stop('Sync failed');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  outro(`✅  Storage synced to: backups/${dirName}/`);
}

// Export for use as a library
export { main as syncCmsStorage };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
