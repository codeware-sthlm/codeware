import env from '../env-resolver/resolved-env';
import type { ExpressMiddleware } from '../utils/custom-types';

export const debugRequest: ExpressMiddleware = async (req, res, next) => {
  if (env.LOG_LEVEL === 'debug') {
    console.log('[DEBUG] incoming method', req.method);
    console.log('[DEBUG] incoming headers', req.headers);
  }

  next();
};
