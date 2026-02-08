import { isUser } from '@codeware/app-cms/util/misc';
import { verifySignature } from '@codeware/shared/util/signature';
import type { Access } from 'payload';

type Options = {
  /**
   * TTL of the signature in milliseconds
   *
   * @default 300_000
   */
  ttl?: number;
};

/**
 * @depracated Remove before commiting!
 *
 * Collection access control to a tenant via API key with signature verification.
 *
 * Ensures that the request is signed with a valid signature using the provided secret.
 *
 * **Requires an authenticated tenant user.**
 *
 * **Note:**  This access control restricts access to the tenant scope.
 * It's therefore recommended to be used together with user-based access control
 * when applied to tenant enabled collections.
 *
 * **Guard:** The provided secret is validated before verifying the signature.
 *
 * @param secret - The secret used to verify the signature.
 * @param options - The options for signature verification.
 * @returns The access control function restricted to current tenant.
 */
export const tenantSignatureAccess =
  (secret: string, { ttl = 300_000 }: Options): Access =>
  ({ req: { headers, payload, user } }) => {
    // If no user, deny access
    if (!isUser(user)) {
      return false;
    }

    if (!secret) {
      payload.logger.error(
        '[tenantSignatureAccess] Denied, missing signature secret'
      );
      return false;
    }

    // Verify client request signature
    const { success, error } = verifySignature({
      headers,
      secret,
      ttl
    });

    if (!success) {
      payload.logger.debug(
        `[tenantSignatureAccess] Denied, invalid signature: ${error}`
      );
      return false;
    }

    // Restrict access to the tenant scope
    return {
      tenant: { equals: user.id }
    };
  };
