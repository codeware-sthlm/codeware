import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

import { statusFlyResponseSchema } from './status.schema';

/**
 * status response extended with domains and secrets
 */
export const StatusExtendedTransformedResponseSchema = withCamelCase(
  statusFlyResponseSchema.extend({
    domains: z.array(z.object({ hostname: z.string() })),
    secrets: z.array(z.object({ name: z.string() }))
  }),
  {
    preserve: ['machines.config.env', 'machines.config.metadata']
  }
);
