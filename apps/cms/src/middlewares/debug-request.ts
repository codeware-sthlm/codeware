import env from '../env-resolver/resolved-env';

import type { ExpressMiddleware } from './types';

export const debugRequest: ExpressMiddleware = async (req, res, next) => {
  if (env.REQUEST_DEBUG === true) {
    console.log('[DEBUG] incoming method', req.method);
    console.log('[DEBUG] incoming headers', req.headers);
  }

  next();
};
