import { loadEnv } from '@codeware/app-cms/feature/env-loader';

export async function register() {
  const runtime = process.env.NEXT_RUNTIME;
  console.log(`[REGISTER] Load environment variables in ${runtime}`);

  const env = await loadEnv();

  if (env) {
    console.log(
      '[REGISTER] Successfully loaded environment variables',
      env.DEPLOY_ENV !== 'production' && env.LOG_LEVEL === 'debug'
        ? env
        : Object.keys(env)
    );
  }
}
