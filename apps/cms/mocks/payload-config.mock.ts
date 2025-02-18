/**
 * Mock for default import of `payload.config`.
 *
 * Returns `routes` with `admin` set to `/admin`.
 */
export const mockPayloadConfig = Promise.resolve({
  routes: {
    admin: '/admin'
  }
});

export default mockPayloadConfig;
