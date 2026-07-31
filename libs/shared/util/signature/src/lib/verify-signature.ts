import { createToken } from './create-token';
import { SignatureLowercaseSchema } from './signature.schema';

type Args = {
  /**
   * Incoming request headers.
   */
  headers: Headers;

  /**
   * The same secret key used to sign the signature.
   *
   * Pass several secrets to accept more than one during a rollover.
   * Verification succeeds when any of them matches.
   */
  secret: string | Array<string>;

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
    const zodErrors = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([key, value]) => `${key}: ${value?.join(', ')}`)
      .join('; ');

    // Provide the headers for easier debugging
    const headersList = Object.entries(headersRecord).map(
      ([key, value]) => `${key}: ${value}`
    );

    return {
      success: false,
      error: `[headers] ${headersList}\n[zod] ${zodErrors}`
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
      error: `Request expired ${new Date(Number(timestamp)).toISOString()} (TTL: ${ttl}ms)`
    };
  }

  const secrets = (Array.isArray(secret) ? secret : [secret]).filter(Boolean);

  if (!secrets.length) {
    return {
      success: false,
      error: 'No signature secret provided'
    };
  }

  // Verify the signature by creating a token like in the client.
  // Any secret may match to keep requests signed with the previous
  // secret valid while a rollover is in progress.
  const isValid = secrets.some(
    (secret) =>
      clientToken ===
      createToken({
        requestId,
        deviceId,
        userAgent,
        timestamp,
        secret
      })
  );

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid signature token'
    };
  }

  return {
    success: true
  };
};
