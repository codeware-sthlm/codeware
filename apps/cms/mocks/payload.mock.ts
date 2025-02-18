import * as payload from 'payload';

type MockPayload = typeof payload;
type Payload = payload.Payload;

/**
 * Mock for `payload`.
 *
 * Returns `getPayload` with `auth` set to unknown user.
 */
const mockPayload: Partial<MockPayload> = {
  getPayload: jest.fn().mockResolvedValue({
    auth: jest
      .fn()
      .mockResolvedValue({ user: null } as Partial<Payload['auth']>)
  } as Partial<Payload>)
};

export const { getPayload } = mockPayload;

export default mockPayload;
