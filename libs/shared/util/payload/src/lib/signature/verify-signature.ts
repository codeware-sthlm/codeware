import { createToken } from './create-token';
import { SignatureLowercaseSchema } from './signature.schema';

type Args = {
  /**
   * Incoming request headers.
   */
  headers: Record<string, string>;

  /**
   * The same secret key used to sign the signature.
   */
  secret: string;

  /**
   * The time in milliseconds before the signature is expired.
   *
   * @default 300_000 (5 minutes)
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
  const parsed = SignatureLowercaseSchema.safeParse(headers);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.toString()
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
