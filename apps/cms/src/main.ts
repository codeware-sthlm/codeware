import express from 'express';
import payload from 'payload';

import { resolveEnv } from './env-resolver/server.resolve';
import { seed } from './seed/seed';

const startServer = async () => {
  try {
    console.log('Starting server');

    // Resolve environment variables
    const env = await resolveEnv();

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
      onInit: async (p) => {
        p.logger.info(`Payload Admin URL: ${p.getAdminURL()}`);
        p.logger.info(`Using DB adapter: ${p.db.name}`);
        p.logger.info(
          `Using CORS: ${Array.isArray(p.config.cors) ? p.config.cors.join(', ') : payload.config.cors}`
        );
        p.logger.info(`Using CSRF: ${p.config.csrf.join(', ')}`);
      }
    });

    // Run migrations in production when needed or on-demand
    switch (env.MIGRATE_ACTION) {
      case 'fresh':
        // Never recreate database in production!!
        if (env.DEPLOY_ENV !== 'production') {
          payload.logger.info('Recreating database on-demand');
          await payload.db.migrateFresh({ forceAcceptWarning: true });
        }
        break;
      case 'migrate':
        payload.logger.info('Running migrations on-demand');
        await payload.db.migrate();
        break;
      case 'default':
      default:
        if (env.DEPLOY_ENV === 'preview' || env.DEPLOY_ENV === 'production') {
          payload.logger.info(`Running auto-migrate in ${env.DEPLOY_ENV}`);
          await payload.db.migrate();
        }
    }

    // Setup data
    await seed({ payload, env });

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
