import { type ExpressMiddleware } from '@codeware/shared/util/payload';

import env from '../env-resolver/resolved-env';

export const debugRequest: ExpressMiddleware = async (req, res, next) => {
  if (env.REQUEST_DEBUG === true) {
    console.log('[DEBUG] incoming method', req.method);
    console.log('[DEBUG] incoming headers', req.headers);
  }

  next();
};
