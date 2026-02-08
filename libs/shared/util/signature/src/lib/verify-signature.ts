import { createToken } from './create-token';
import { SignatureLowercaseSchema } from './signature.schema';

type Args = {
  /**
   * Incoming request headers.
   */
  headers: Headers;

  /**
   * The same secret key used to sign the signature.
   */
  secret: string;

  /**
   * The time in milliseconds before the signature is expired.
   *
   * @default 300_000
   */
  ttl?: number;
};

type Response =
  | {
      success: true;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Verifies the signature of the incoming request.
 *
 * @param args - The arguments to verify the signature.
 * @returns The result of the verification.
 */
export const verifySignature = ({
  headers,
  secret,
  ttl = 300_000
}: Args): Response => {
  // Map to record to validate with zod
  const headersRecord: Record<string, string> = {};
  headers.forEach((value, key) => {
    headersRecord[key] = value;
  });

  const parsed = SignatureLowercaseSchema.safeParse(headersRecord);

  if (!parsed.success) {
    // Map to a compact single-line error message
    const error = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([key, value]) => `${key}: ${value?.join(', ')}`)
      .join('; ');

    return {
      success: false,
      error
    };
  }

  const {
    'x-request-id': requestId,
    'x-device-id': deviceId,
    'x-user-agent': userAgent,
    'x-timestamp': timestamp,
    'x-signature': clientToken
  } = parsed.data;

  // Verify TTL
  if (Date.now() - Number(timestamp) > ttl) {
    return {
      success: false,
      error: `Request expired ${new Date(timestamp).toISOString()} (TTL: ${ttl}ms)`
    };
  }

  // Verify the signature by creating a token like in the client
  const token = createToken({
    requestId,
    deviceId,
    userAgent,
    timestamp,
    secret
  });

  if (clientToken !== token) {
    return {
      success: false,
      error: 'Invalid signature token'
    };
  }

  return {
    success: true
  };
};
