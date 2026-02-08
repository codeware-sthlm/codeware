import { isTenant } from '@codeware/app-cms/util/misc';
import {
  apiKeyPrefix,
  authorizationHeader
} from '@codeware/shared/util/payload-api';
import { verifySignature } from '@codeware/shared/util/signature';
import { type AuthStrategy } from 'payload';

import { generateTenantCookie } from './generate-cookie';

type Options = {
  /**
   * Disable the request signature verification layer.
   *
   * Without this, the strategy adds nothing compared to the native API key strategy.
   *
   * **Use it only when required, like temporary issues waiting to get fixed.**
   *
   * @default false
   */
  disableSignatureVerification?: boolean;

  /** Secret key to verify the signature in the header */
  secret: string;

  /**
   * TTL of the signature in milliseconds
   *
   * @default 300_000
   */
  ttl?: number;
};

/**
 * ******************************************************
 * @deprecated Proof of concept!
 *
 * This strategy is not used in production.
 * It is a proof of concept to show how to implement a multi-tenant authentication strategy.
 * There are unsolved issues with setting cross-site cookies
 * and maybe the idea brings to much complexity and overhead.
 *
 * **The core concept is instead provided by `tenantApiKeyAccess`.**
 *
 * Delete when it's getting too old and we still see no gain using it.
 * ******************************************************
 *
 * @description
 *
 * Multi-tenant authentication strategy to compliment the `useAPIKey` strategy on the tenants collection.
 *
 * Adds an extra layer of security to the API key by verifying the signature of the request,
 * thus preventing CSRF attacks.
 * @see https://payloadcms.com/docs/authentication/cookies#csrf-attacks
 *
 * This strategy will also set a cookie to scope the multi-tenant filters to the tenant,
 * just like multi-tenant plugin does. In case signature verification fails the cookie
 * is generated with a non-existing tenant value to return empty responses.
 *
 * @param options - The options for the multi-tenant authentication strategy
 * @returns The multi-tenant authentication strategy
 */
export const multiTenantAuthStrategy = ({
  disableSignatureVerification = false,
  secret,
  ttl = 300_000
}: Options): AuthStrategy => {
  return {
    name: 'multi-tenant',
    authenticate: async ({
      headers,
      payload,
      payload: {
        authStrategies,
        config: { cookiePrefix },
        logger
      }
    }) => {
      // Check if we have an API key in the headers
      const isApiKeyRequest = headers
        .get(authorizationHeader)
        ?.match(apiKeyPrefix);
      if (!isApiKeyRequest) {
        // Skip further processing
        return { user: null };
      }

      // Find the native Payload API key strategy
      const apiKeyStrategy = authStrategies.find((a) =>
        a.name.match(/api-key/i)
      );
      if (!apiKeyStrategy) {
        logger.warn('Could not find native API key strategy to resolve user');
        return { user: null };
      }

      // Invoke to authenticate the tenant
      const { user } = await apiKeyStrategy.authenticate({
        headers,
        payload
      });
      if (!user) {
        return { user: null };
      }
      if (!isTenant(user)) {
        return { user: null };
      }

      // Skip signature verification if disabled
      if (disableSignatureVerification) {
        return { user };
      }

      // TODO: Not a solid solution when no cookie means return everyting at them moment
      const tenantDomain = user.domains?.at(0)?.domain;

      // Here follows the extra security layer of signature verification.
      // This is to ensure that the API key is not compromised,
      // since it is signed with the same secret key in client and server.
      const { success, error } = verifySignature({
        headers,
        secret,
        ttl
      });
      if (!success) {
        logger.info('Permission denied, invalid signature:');
        logger.info(error);
        headers.forEach((value, key) => {
          logger.info(`HEADER ${key}:${value}`);
        });
        // Set cookie to scope multi-tenant filters to a non-existing tenant
        return {
          user: null,
          responseHeaders: new Headers({
            'Set-Cookie': generateTenantCookie({
              cookiePrefix,
              domain: tenantDomain,
              tenantId: -1
            })
          })
        };
      }

      logger.info(`INCOMING Cookie: ${headers.get('Cookie')}`);

      // Set cookie to scope multi-tenant filters to the tenant
      const cookie = generateTenantCookie({
        cookiePrefix,
        domain: tenantDomain,
        tenantId: user.id
      });

      logger.info(`OUTGOING Cookie: ${cookie}`);

      return {
        user,
        responseHeaders: new Headers({
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
          'Access-Control-Allow-Credentials': 'true',
          'Set-Cookie': cookie
        })
      };
    }
  };
};
