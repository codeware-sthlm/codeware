import { isUser } from '@codeware/app-cms/util/misc';
import { verifySignature } from '@codeware/shared/util/signature';
import type { Access } from 'payload';

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
 * Collection access control to verify the API key of a tenant user.
 * Returns access filter for the tenant permissions, which will be merged
 * with the multi-tenant plugin's tenant access control.
 *
 * When the user isn't a tenant, the access control will pass.
 *
 * Use this read access control for all tenant enabled collections.
 *
 * @param options - The options for the access control.
 * @returns The access control function.
 */
export const verifyApiKeyAccess =
  ({
    disableSignatureVerification = false,
    secret,
    ttl = 300_000
  }: Options): Access =>
  ({ id, req: { headers, payload, user } }) => {
    if (!user) {
      payload.logger.debug(
        `[verifyApiKeyAccess] Permission denied, no user for id: ${id ?? 'undefined'}`
      );
      return false;
    }
    if (isUser(user)) {
      return true;
    }

    // Verify tenant api key if not disabled
    if (!disableSignatureVerification) {
      const { success, error } = verifySignature({
        headers,
        secret,
        ttl
      });

      if (!success) {
        payload.logger.info('Permission denied, invalid signature:');
        payload.logger.info(error);
        return false;
      }
    }

    // Restrict access to the tenant from api key
    return {
      tenant: { equals: user.id }
    };
  };
