import { randomUUID } from 'crypto';

import { generateSignature } from './generate-signature';
import { verifySignature } from './verify-signature';

const userAgent = 'web-client/1.0.0';

const signedHeaders = (secret: string) =>
  new Headers(generateSignature({ deviceId: randomUUID(), secret, userAgent }));

describe('verifySignature', () => {
  it('should accept a signature signed with the same secret', () => {
    const headers = signedHeaders('active-secret');

    expect(verifySignature({ headers, secret: 'active-secret' })).toEqual({
      success: true
    });
  });

  it('should reject a signature signed with another secret', () => {
    const headers = signedHeaders('other-secret');

    expect(verifySignature({ headers, secret: 'active-secret' })).toEqual({
      success: false,
      error: 'Invalid signature token'
    });
  });

  it('should reject an expired signature without throwing', () => {
    const headers = signedHeaders('active-secret');

    const result = verifySignature({
      headers,
      secret: 'active-secret',
      ttl: -1
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/^Request expired \d{4}-/);
  });

  it('should reject when signature headers are missing', () => {
    expect(
      verifySignature({ headers: new Headers(), secret: 'active-secret' })
    ).toMatchObject({ success: false });
  });
});
