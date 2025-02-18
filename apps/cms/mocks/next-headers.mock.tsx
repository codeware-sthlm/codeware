import * as nextHeaders from 'next/headers';

type MockNextHeaders = typeof nextHeaders;

/**
 * Mock for `next/headers`.
 *
 * Returns `headers` with empty object.
 */
const mockNextHeaders: Partial<MockNextHeaders> = {
  headers: jest.fn().mockResolvedValue({})
};

export const { headers } = mockNextHeaders;

export default mockNextHeaders;
