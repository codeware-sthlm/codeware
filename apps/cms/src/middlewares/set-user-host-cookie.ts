import {
  type ExpressMiddleware,
  isUser,
  parseCookies
} from '@codeware/shared/util/payload';

/**
 * Set a user cookie with the current tenant ID, derived from the request host
 * and the tenant domains.
 *
 * A cookie should only be set for admin UI users.
 * The cookie is used to track the user's current tenant scope
 * and hence the documents they can access.
 *
 * @deprecated Is tenant cookie needed anymore?
 * For Payload 3.0 cookie handling is built-in to NextJS.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 */
export const setUserHostCookie: ExpressMiddleware = async (req, res, next) => {
  try {
    const { payload, user } = req;

    const cookieName = `${payload.config.cookiePrefix}-tenant`;
    const existingCookie = parseCookies(req.headers)[cookieName];

    // Clear cookie when no user is authenticated
    if (!user) {
      if (existingCookie) {
        res.clearCookie(cookieName);
        payload.logger.info(`Cleared cookie ${cookieName}`);
      }
      return next();
    }

    // Cookie should only be set for admin UI users
    if (!isUser(user)) {
      return next();
    }

    // Find the tenant for the current host
    const host = req.get('host');
    const relatedOrg = await payload.find({
      collection: 'tenants',
      depth: 0,
      limit: 1,
      where: {
        'domains.domain': {
          in: [host]
        }
      }
    });

    // If a matching tenant is found, set the cookie
    if (relatedOrg.docs.length > 0) {
      const tenantId = relatedOrg.docs[0].id.toString();
      if (existingCookie !== tenantId) {
        payload.logger.info(
          `Set cookie '${cookieName}' for user '${user.id}' to '${tenantId}'`
        );
        const currTime = new Date();
        currTime.setSeconds(currTime.getSeconds() + 7200);
        res.cookie(cookieName, tenantId, {
          expires: currTime,
          httpOnly: true,
          path: '/'
        });
      }
    } else if (existingCookie) {
      res.clearCookie(cookieName);
      payload.logger.info(`Cleared cookie ${cookieName}`);
    }

    next();
  } catch (error) {
    console.error('Something broke, proceeding the request', error);
    next();
  }
};
