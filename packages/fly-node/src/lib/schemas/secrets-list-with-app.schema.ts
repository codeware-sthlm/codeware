import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

import { SecretsListFlyResponseElementSchema } from './secrets-list.schema';

/**
 * secrets list response extended with application name
 */
export const SecretsListWithAppTransformedResponseSchema = z.array(
  withCamelCase(
    SecretsListFlyResponseElementSchema.extend({
      app: z.string()
    })
  )
);
