import { createHmac } from 'crypto';

/**
 * Creates a token to be used for the signature.
 *
 * @param args - The arguments to create the token.
 * @returns Signature token.
 */
export const createToken = (args: {
  deviceId: string;
  requestId: string;
  timestamp: number | string;
  secret: string;
  userAgent: string;
}): string => {
  const { deviceId, requestId, timestamp, secret, userAgent } = args;

  const message = `${deviceId}${requestId}${timestamp}${userAgent}`;

  const token = createHmac('sha256', secret).update(message).digest('hex');

  return token;
};
