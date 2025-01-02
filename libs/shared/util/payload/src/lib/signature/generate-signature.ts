import { randomUUID } from 'crypto';

import { createToken } from './create-token';
import { type Signature, SignatureSchema } from './signature.schema';

type Args = {
  /**
   * Device identifier that should be consistent across requests.
   *
   * Generate a UUID at startup and store it properly to be reused.
   *
   * @example
   *
   * ```ts
   * import { randomUUID } from 'crypto';
   * const deviceId = randomUUID();
   * ```
   */
  deviceId: string;

  /**
   * Secret key used to sign the signature.
   * This key must be stored securely and is also used by the server
   * to verify the signature.
   *
   * It's serves the same purpose as the `PAYLOAD_API_KEY`.
   */
  secret: string;

  /**
   * User agent details of the client.
   *
   * @example
   *
   * ```ts
   * const ua = 'user-agent-from-request';
   * const appInfo = {
   *   name: 'web-client',
   *   version: '1.0.0',
   *   environment: process.env.NODE_ENV,
   *   // Could add other relevant info
   * };
   * const { name, version, environment } = appInfo;
   *
   * const userAgent = `${ua} ${name}/${version} (${environment})`;
   * ```
   */
  userAgent: string;
};

/**
 * Generates cryptographic signature headers which should be applied to the other headers
 * for the outgoing request.
 *
 * These headers serves as a handshake between the client and the server
 * to ensure that the request is coming from a valid client,
 * when the server can not guarantee CORS/CSRF protection.
 *
 * On the server side, the signature headers are verified against the secret key
 * to ensure that the request is coming from a valid client.
 *
 * @param args - The arguments to generate the signature headers.
 * @returns The signature headers
 * @throws If the headers are not valid.
 *
 * @example
 * ```ts
 * const signature = generateSignature({
 *   deviceId,
 *   secret,
 *   userAgent
 * });
 *
 * // Apply the headers to the request
 * const response = await fetch('https://example.com/api', {
 *   headers: {
 *     // Ordinary headers...
 *     ...signature,
 *   },
 *   method: 'GET'
 * });
 * ```
 */
export const generateSignature = (args: Args): Signature => {
  const { deviceId, secret, userAgent } = args;

  const requestId = randomUUID();
  const timestamp = Date.now().toString();

  const token = createToken({
    deviceId,
    requestId,
    timestamp,
    secret,
    userAgent
  });

  return SignatureSchema.parse({
    'X-Device-Id': deviceId,
    'X-Request-Id': requestId,
    'X-Signature': token,
    'X-Timestamp': timestamp,
    'X-User-Agent': userAgent
  });
};
