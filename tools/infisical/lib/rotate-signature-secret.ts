import { randomBytes } from 'crypto';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env.infisical') });

const Environments = EnvironmentSchema.options;

/** Folder holding the shared signature secret, imported by web */
const SECRET_PATH = '/apps/cms/signature';
const ACTIVE = 'SIGNATURE_SECRET';
const PREVIOUS = 'SIGNATURE_SECRET_PREVIOUS';

/**
 * Where the rollover currently stands, derived from what exists in Infisical.
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

const redeployCms = (environment: Environment) =>
  [
    `  Actions → Fly Deployment → Run workflow`,
    `  App: cms  Tenant: <empty>  Environment: ${environment}`
  ].join('\n');

const redeployWeb = (environment: Environment) =>
  [
    `  Actions → Fly Deployment → Run workflow`,
    `  App: web  Tenant: <empty>  Environment: ${environment}`
  ].join('\n');

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
    s.stop('Current state resolved');
  } catch (error) {
    s.stop('Failed to read secrets');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const steps: Record<Stage, { label: string; description: string }> = {
    'not-started': {
      label: `Step 1 — stage the current secret as ${PREVIOUS}`,
      description: [
        `Copies the active secret to ${PREVIOUS} so cms keeps accepting`,
        `signatures made with it once the active one changes.`,
        '',
        `Nothing breaks yet. Redeploy cms afterwards:`,
        redeployCms(environment)
      ].join('\n')
    },
    'previous-staged': {
      label: 'Step 2 — replace the active secret with a new one',
      description: [
        `Generates a new ${ACTIVE}. cms accepts both from here on, so web`,
        `deployments still signing with the old secret keep working.`,
        '',
        `Redeploy cms first, then every web tenant:`,
        redeployCms(environment),
        redeployWeb(environment)
      ].join('\n')
    },
    'rolling-over': {
      label: `Step 3 — retire ${PREVIOUS}`,
      description: [
        `Removes the old secret so only the new one is accepted.`,
        '',
        `Only do this once every web tenant has been redeployed - any`,
        `deployment still on the old secret starts failing immediately.`,
        '',
        `Redeploy cms afterwards:`,
        redeployCms(environment)
      ].join('\n')
    }
  };

  const step = steps[state.stage];

  note(
    [
      `${ACTIVE}:   set`,
      `${PREVIOUS}: ${state.previous ? (state.stage === 'previous-staged' ? 'staged (same as active)' : 'set (differs from active)') : 'not set'}`,
      '',
      `Next: ${step.label}`,
      '',
      step.description
    ].join('\n'),
    `Rollover state in ${environment}`
  );

  const proceed = await confirm({
    message: `Apply this step to ${environment}?`,
    initialValue: false
  });

  if (isCancel(proceed) || !proceed) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  s.start('Updating Infisical...');

  try {
    switch (state.stage) {
      case 'not-started':
        await setInfisicalSecret({
          environment,
          path: SECRET_PATH,
          key: PREVIOUS,
          value: state.active
        });
        s.stop(`${PREVIOUS} staged`);
        break;

      case 'previous-staged':
        await setInfisicalSecret({
          environment,
          path: SECRET_PATH,
          key: ACTIVE,
          value: generateSecret()
        });
        s.stop(`${ACTIVE} replaced`);
        break;

      case 'rolling-over':
        await deleteInfisicalSecret({
          environment,
          path: SECRET_PATH,
          key: PREVIOUS
        });
        s.stop(`${PREVIOUS} retired`);
        break;
    }
  } catch (error) {
    s.stop('Update failed');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  note(step.description, 'Redeploy required');

  outro(
    state.stage === 'rolling-over'
      ? `✅  Rollover complete in ${environment}`
      : `✅  Run again after redeploying to continue`
  );
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
