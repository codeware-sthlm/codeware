import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Transformed postgres users list response schema
 *
 * ```ts
 * fly postgres users list --app [name] --json
 * ```
 */
export const PostgresUsersListTransformedResponseSchema = z.array(
  withCamelCase(
    z.object({
      username: z.string(),
      superuser: z.boolean(),
      databases: z.array(z.string())
    })
  )
);
