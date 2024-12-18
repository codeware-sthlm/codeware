import express from 'express';
import payload from 'payload';

import { getEnv } from './env-resolver/server.resolve';
import { setupTenants } from './seed/setup-tenants';

const startServer = async () => {
  try {
    console.log('Starting server');

    // Resolve environment variables
    const env = await getEnv();

    // Create an Express server
    const app = express();
    const port = env.PORT;

    // Redirect root to Admin panel
    app.get('/', (_, res) => res.redirect('/admin'));

    // Initialize Payload
    await payload.init({
      secret: env.PAYLOAD_SECRET_KEY,
      express: app,
      loggerOptions: {
        level: env.LOG_LEVEL
      },
      onInit: async () => {
        payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
        payload.logger.info(`Using DB adapter: ${payload.db.name}`);
      }
    });

    // Run migrations in production when needed or on-demand
    switch (env.MIGRATE_FORCE_ACTION) {
      case 'migrate':
        payload.logger.info('Running migrations on-demand');
        await payload.db.migrate();
        break;
      case 'recreate':
        payload.logger.info('Recreating database on-demand');
        await payload.db.migrateFresh({ forceAcceptWarning: true });
        break;
      case 'default':
      default:
        if (env.NODE_ENV === 'production') {
          payload.logger.info('Running migrations in production');
          await payload.db.migrate();
        }
    }

    // Setup tenants and API keys
    await setupTenants(payload, env);

    // Start listening for requests
    app
      .listen(port, () =>
        console.log(`[ started ] on port ${port} (${env.NODE_ENV})`)
      )
      .on('error', (error) => console.error(`[ error ] ${error.message}`))
      .on('close', () => console.log('[ closed ]'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
