import debugLog from './debug-log';
import { type Env, EnvSchema, clientSideEnv } from './env.schema';
import isBrowser from './is-browser';

let resolvedEnv: Env;

if (isBrowser) {
  resolvedEnv = clientSideEnv;
} else {
  // Try to resolve the current state
  const { success, data } = EnvSchema.safeParse(process.env);

  // Apply the default values to `process.env` when required
  if (success) {
    resolvedEnv = data;
  } else {
    for (const [key, value] of Object.entries(clientSideEnv)) {
      if (!process.env[key]) {
        debugLog('apply default value for', key);
        process.env[key] = value as string;
      }
    }
    // By design it should be safe to parse now
    resolvedEnv = EnvSchema.parse(process.env);
  }
}

/**
 * Resolved environment variables with default values applied when missing.
 *
 * Safe to import both client and server side.
 */
export default resolvedEnv;
