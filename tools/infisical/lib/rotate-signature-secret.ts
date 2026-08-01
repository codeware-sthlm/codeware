import { randomBytes, randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  cancel,
  confirm,
  intro,
  isCancel,
  note,
  outro,
  select,
  spinner
} from '@clack/prompts';
import {
  type Environment,
  EnvironmentSchema,
  deleteInfisicalSecret,
  setInfisicalSecret,
  withInfisical
} from '@codeware/shared/feature/infisical';
import * as dotenv from 'dotenv';

import { configAppName, fly, restartApp } from './fly-apps';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env.infisical') });

const Environments = EnvironmentSchema.options;

/** Folder holding the shared signature secret, imported by web */
const SECRET_PATH = '/apps/cms/signature';
const ACTIVE = 'SIGNATURE_SECRET';
const PREVIOUS = 'SIGNATURE_SECRET_PREVIOUS';

/**
 * Where the rollover stands, derived from what exists in Infisical.
 *
 * There is no stored progress marker - the two secrets are the state:
 * - no previous            -> nothing started
 * - previous === active    -> previous is staged, active not yet replaced
 * - previous !== active    -> active is new, clients are rolling over
 */
type Stage = 'not-started' | 'previous-staged' | 'rolling-over';

type State = {
  stage: Stage;
  active: string;
  previous: string | null;
};

async function readState(environment: Environment): Promise<State> {
  const secrets = await withInfisical({
    environment,
    filter: { path: SECRET_PATH }
  });

  const value = (key: string) =>
    secrets?.find(({ secretKey }) => secretKey === key)?.secretValue ?? null;

  const active = value(ACTIVE);
  const previous = value(PREVIOUS);

  if (!active) {
    throw new Error(`${ACTIVE} not found in ${SECRET_PATH}`);
  }

  return {
    active,
    previous,
    stage: !previous
      ? 'not-started'
      : previous === active
        ? 'previous-staged'
        : 'rolling-over'
  };
}

/** Generate a new HMAC signing secret */
const generateSecret = () => randomBytes(32).toString('hex');

/**
 * Prove Infisical will accept an edit before any secret is replaced.
 *
 * Same reasoning as the tenant key rotation: credentials that cannot write get
 * partway through and leave cms and web disagreeing about the secret.
 */
async function assertInfisicalWritable(
  environment: Environment
): Promise<void> {
  const key = 'ROTATION_WRITE_CHECK';
  const write = (value: string) =>
    setInfisicalSecret({ environment, path: SECRET_PATH, key, value });

  try {
    await write(`probe-${randomUUID()}`);

    const expected = `probe-${randomUUID()}`;
    await write(expected);

    const stored = (
      await withInfisical({ environment, filter: { path: SECRET_PATH } })
    )?.find(({ secretKey }) => secretKey === key)?.secretValue;

    if (stored !== expected) {
      throw new Error('the edit did not take effect');
    }
  } catch (error) {
    throw new Error(
      `Infisical will not accept writes at ${SECRET_PATH}: ` +
        `${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await deleteInfisicalSecret({ environment, path: SECRET_PATH, key });
  }
}

type AffectedApps = {
  /** Apps that verify signatures, and must accept a secret before web signs with it */
  verifiers: Array<string>;
  /** Apps that sign requests */
  signers: Array<string>;
};

/**
 * Find every deployed app that reads the signature secret.
 *
 * cms host verifies, web signs. Tenant-scoped cms deployments are skipped -
 * they run in tenant mode, where the secret is not part of `APP_MODE`.
 */
async function fetchAffectedApps(
  environment: Environment
): Promise<AffectedApps> {
  const names = (await fly.apps.list()).map(({ name }) => name);
  const cms = configAppName('cms');
  const web = configAppName('web');

  // Preview apps carry a `-pr-<number>` segment, production apps never do
  const belongsToEnvironment = (name: string) =>
    (environment === 'preview') === /-pr-\d+(-|$)/.test(name);

  return {
    // The host deployment is the base name, with no tenant suffix
    verifiers: names
      .filter(
        (name) =>
          belongsToEnvironment(name) &&
          new RegExp(`^${cms}(-pr-\\d+)?$`).test(name)
      )
      .sort(),
    signers: names
      .filter(
        (name) => belongsToEnvironment(name) && name.startsWith(`${web}-`)
      )
      .sort()
  };
}

/**
 * Main interactive rollover script
 */
async function main() {
  console.clear();
  intro('🔏  Rotate signature secret');

  const environment = await select<Environment>({
    message: 'Select environment:',
    options: Environments.map((env) => ({ value: env, label: env }))
  });

  if (isCancel(environment)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const s = spinner();
  s.start(`Reading ${SECRET_PATH} for ${environment}...`);

  let state: State;
  try {
    state = await readState(environment);
    s.stop(
      state.stage === 'not-started'
        ? 'Current state resolved'
        : `Resuming a rollover already at '${state.stage}'`
    );
  } catch (error) {
    s.stop('Failed to read secrets');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  s.start('Finding apps that use the signature secret...');

  let apps: AffectedApps;
  try {
    apps = await fetchAffectedApps(environment);
    s.stop(
      `${apps.verifiers.length} verifier(s), ${apps.signers.length} signer(s)`
    );
  } catch (error) {
    s.stop('Failed to list apps');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (!apps.verifiers.length || !apps.signers.length) {
    cancel(
      `Expected both cms and web apps in ${environment}, found ` +
        `verifiers=[${apps.verifiers.join(', ')}] signers=[${apps.signers.join(', ')}]`
    );
    process.exit(1);
  }

  note(
    [
      `The whole rollover runs in one go, restarting apps between steps:`,
      '',
      `  1. keep the current secret as ${PREVIOUS}, restart cms`,
      `  2. generate a new ${ACTIVE}, restart cms then web`,
      `  3. drop ${PREVIOUS}, restart cms`,
      '',
      `cms accepts both secrets throughout, so nothing is rejected while web`,
      `is catching up. The secret is read from Infisical at boot, so restarting`,
      `is all it takes - no redeploy.`,
      '',
      `verifiers: ${apps.verifiers.join(', ')}`,
      `signers:   ${apps.signers.join(', ')}`
    ].join('\n'),
    `Rollover plan for ${environment}`
  );

  const proceed = await confirm({
    message: `Roll over the signature secret in ${environment}?`,
    initialValue: false
  });

  if (isCancel(proceed) || !proceed) {
    cancel('Operation cancelled - nothing was written');
    process.exit(0);
  }

  s.start('Checking Infisical accepts writes...');

  try {
    await assertInfisicalWritable(environment);
    s.stop('Infisical writes verified');
  } catch (error) {
    s.stop('Infisical is not writable');
    note(
      [
        error instanceof Error ? error.message : String(error),
        '',
        `Nothing was changed. Rotation needs credentials that can create and`,
        `edit secrets under ${SECRET_PATH}.`
      ].join('\n'),
      '⚠️  Cannot roll over'
    );
    process.exit(1);
  }

  const restartAll = async (names: Array<string>) => {
    for (const app of names) {
      s.message(`Restarting ${app}...`);
      await restartApp(app);
    }
  };

  try {
    // Step 1 - cms starts accepting the current secret as the previous one, so
    // it keeps working once the active one changes underneath it
    if (state.stage === 'not-started') {
      s.start(`Staging ${PREVIOUS}...`);
      await setInfisicalSecret({
        environment,
        path: SECRET_PATH,
        key: PREVIOUS,
        value: state.active
      });
      await restartAll(apps.verifiers);
      s.stop(`${PREVIOUS} staged, cms restarted`);
      state = await readState(environment);
    }

    // Step 2 - the new secret. cms has to know it before web signs with it,
    // hence verifiers first
    if (state.stage === 'previous-staged') {
      s.start(`Generating a new ${ACTIVE}...`);
      await setInfisicalSecret({
        environment,
        path: SECRET_PATH,
        key: ACTIVE,
        value: generateSecret()
      });
      await restartAll(apps.verifiers);
      await restartAll(apps.signers);
      s.stop(`${ACTIVE} replaced, cms and web restarted`);
      state = await readState(environment);
    }

    // Step 3 - only the new secret is accepted from here
    if (state.stage === 'rolling-over') {
      s.start(`Retiring ${PREVIOUS}...`);
      await deleteInfisicalSecret({
        environment,
        path: SECRET_PATH,
        key: PREVIOUS
      });
      await restartAll(apps.verifiers);
      s.stop(`${PREVIOUS} retired, cms restarted`);
    }
  } catch (error) {
    s.stop('Rollover interrupted');
    note(
      [
        error instanceof Error ? error.message : String(error),
        '',
        `The rollover stopped partway. Its progress is held in the secrets`,
        `themselves, so running this again picks up where it left off.`,
        '',
        `Until it completes cms may still accept the previous secret, which is`,
        `the safe direction to be interrupted in.`
      ].join('\n'),
      '⚠️  Not finished'
    );
    process.exit(1);
  }

  outro(`✅  Signature secret rolled over in ${environment}`);
}

// Export for use as a library
export { main as rotateSignatureSecretMain };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
