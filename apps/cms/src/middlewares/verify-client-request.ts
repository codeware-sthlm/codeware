import { verifySignature } from '@codeware/shared/util/payload';

import env from '../env-resolver/resolved-env';
import type { ExpressMiddleware } from '../utils/custom-types';

/**
 * Verify client request signature to ensure the request is from a valid client
 * and the tenant api key isn't spoofed.
 *
 * TODO: Include the client host/domain in the signature to verify it's allowed for the tenant
 */
export const verifyClientRequest: ExpressMiddleware = async (
  req,
  res,
  next
) => {
  try {
    const { headers, payload, user } = req;

    // We only need to verify the signature for a client with a valid tenant key,
    // hence Payload has verified the user and Authorization is in the headers.
    if (!user || !headers.authorization) {
      return next();
    }

    const { success, error } = verifySignature({
      headers: headers as Record<string, string>,
      secret: env.SIGNATURE_SECRET
    });

    if (!success) {
      payload.logger.error('Could not verify client signature', error);
      return res
        .status(403)
        .json('Client not authorized to access this resource');
    }

    payload.logger.debug('Client signature verified successfully');

    next();
  } catch (error) {
    console.error('Something broke, proceeding the request', error);
    next();
  }
};
