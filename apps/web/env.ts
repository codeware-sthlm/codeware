/* Type-safe environment configuration */

import { z } from 'zod';

const DEFAULT_NODE_ENV = 'development' as const;
const DEFAULT_PORT = 4200 as const;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default(DEFAULT_NODE_ENV),
  PORT: z.coerce.number().default(DEFAULT_PORT)
});

export type Env = z.infer<typeof envSchema>;

const { success, data: env, error } = envSchema.safeParse(process.env);

if (!success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export default env as Env;
