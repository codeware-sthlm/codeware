/**
 * Environment configuration for Payload CMS backend.
 *
 * IMPORTANT: This file exists primarily to enforce type-safety of
 * environment variables on the server side. However, due to Payload
 * CMS's design decisions, we need to handle client-side concerns
 * as well.
 *
 * The problem:
 * - This file is imported in `payload.config.ts`
 * - Payload bundles the entire config file (and its imports) for
 *   the admin panel
 * - This means our server-side environment validation code ends up
 *   in the client bundle where it will cause runtime errors
 *   (no process.env, no process.exit, etc.)
 *
 * Current solution:
 * - Detect if we're in a browser environment
 * - If on server: Validate environment variables properly
 * - If on client: Return dummy values to prevent runtime errors
 */

import { z } from 'zod';

const DEFAULT_LOG_LEVEL = 'info' as const;
const DEFAULT_NODE_ENV = 'development' as const;
const DEFAULT_PORT = 3000 as const;

export const envSchema = z.object({
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default(DEFAULT_LOG_LEVEL),
  NODE_ENV: z.string().default(DEFAULT_NODE_ENV),
  PAYLOAD_SECRET_KEY: z.string(),
  PORT: z.coerce.number().default(DEFAULT_PORT),
  POSTGRES_URL: z.string()
});

export type Env = z.infer<typeof envSchema>;

const validateEnv = (): Env => {
  const { success, data, error } = envSchema.safeParse(process.env);

  if (!success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
    process.exit(1);
  }

  return data;
};

const defaultEnv: Env = {
  LOG_LEVEL: DEFAULT_LOG_LEVEL,
  NODE_ENV: DEFAULT_NODE_ENV,
  PAYLOAD_SECRET_KEY: '',
  PORT: DEFAULT_PORT,
  POSTGRES_URL: ''
} as const;

export const env: Env =
  typeof window === 'undefined' ? validateEnv() : defaultEnv;

export const cwd = typeof window === 'undefined' ? process.cwd() : undefined;

export default env;
