import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Transformed apps list response schema
 *
 * ```ts
 * fly apps list --json
 * ```
 */
export const AppsListTransformedResponseSchema = z.array(
  withCamelCase(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.string(),
      deployed: z.boolean(),
      hostname: z.string(),
      organization: z.object({
        name: z.string(),
        slug: z.string()
      }),
      currentRelease: z.nullable(
        z.object({
          status: z.string(),
          createdAt: z.string().datetime()
        })
      )
    })
  )
);
