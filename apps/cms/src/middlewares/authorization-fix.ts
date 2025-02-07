import type { ExpressMiddleware } from './types';

/**
 * Middleware to handle a missing Authorization header
 * when we expect it to be present for API requests.
 *
 * The client will always send a copy of the Authorization header
 * in the X-Tenant-Auth header. Use the copy as a workaround
 * until we know why the Authorization header is missing.
 */
export const authorizationFix: ExpressMiddleware = async (req, res, next) => {
  const { headers, payload } = req;

  if (headers.authorization) {
    return next();
  }

  if (headers['x-tenant-auth']) {
    payload.logger.info('Authorization header workaround, use X-Tenant-Auth');
    headers.authorization = headers['x-tenant-auth'].toString();
  }

  next();
};
