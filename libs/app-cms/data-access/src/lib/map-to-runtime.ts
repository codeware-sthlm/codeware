import type { BasePayload } from 'payload';

import type { PayloadRuntime } from './payload-runtime.types';

/**
 * Utility to map a `BasePayload` to a `PayloadRuntime`
 * with `tenantConfig` and `authenticatedUser` set to `null`.
 *
 * This is useful to keep a unified signature for collection functions
 * that can accept either an authenticated tenant with configuration or just the default payload instance.
 */
export const mapToRuntime = (
  maybeRuntime: PayloadRuntime | BasePayload
): PayloadRuntime => {
  if ('tenantConfig' in maybeRuntime) {
    return maybeRuntime;
  }

  return {
    payload: Object.assign(maybeRuntime, { authenticatedUser: null }),
    tenantConfig: null
  };
};
