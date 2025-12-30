import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Transformed postgres list response schema
 *
 * ```ts
 * fly postgres list --json
 * ```
 *
 * Returns an array of Postgres instances, but when there are no instances,
 * it returns a string e.g. "No postgres clusters found".
 */
export const PostgresListTransformedResponseSchema = z
  .array(
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
  )
  .or(z.string());
