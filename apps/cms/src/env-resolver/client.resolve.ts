/**
 * Must not contain any imports directly or indirectly to server side code!
 */

import { type Env, EnvSchema } from './env.schema';
import isBrowser from './is-browser';

let resolvedEnv: Env;

if (isBrowser) {
  resolvedEnv = {
    ALLOWED_URLS: '*',
    APP_NAME: '',
    CWD: '',
    DATABASE_URL: '',
    DEPLOY_ENV: 'development',
    LOG_LEVEL: 'info',
    MIGRATE_FORCE_ACTION: 'default',
    NODE_ENV: 'development',
    PAYLOAD_SECRET_KEY: 'secret',
    PORT: 3000,
    PR_NUMBER: ''
  };
}
// By design it should be safe to parse server side
else {
  resolvedEnv = EnvSchema.parse(process.env);
}

/**
 * Resolved environment variables with default values applied when missing.
 *
 * Safe to import both client and server side.
 */
export default resolvedEnv;
