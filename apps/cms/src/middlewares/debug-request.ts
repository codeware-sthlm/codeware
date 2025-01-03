import env from '../env-resolver/resolved-env';
import type { ExpressMiddleware } from '../utils/custom-types';

export const debugRequest: ExpressMiddleware = async (req, res, next) => {
  if (env.LOG_LEVEL === 'debug') {
    console.log('[DEBUG] incomming headers', req.headers);
  }

  return next();
};
