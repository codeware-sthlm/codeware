import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Transformed postgres list response schema
 *
 * ```ts
 * fly postgres list --json
 * ```
 */
export const PostgresListTransformedResponseSchema = z.array(
  withCamelCase(
    z.object({
      deployed: z.boolean(),
      hostname: z.string(),
      id: z.string(),
      name: z.string(),
      organization: z.object({ id: z.string(), slug: z.string() }),
      status: z.string(),
      version: z.number()
    })
  )
);
