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

const { data: env, error } = envSchema.safeParse(process.env);

if (error) {
  console.error('❌ Invalid env:');
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}
export default env as Env;
