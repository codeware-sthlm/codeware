import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Fly secrets list response element schema
 *
 * ```ts
 * fly secrets list --app [name] --json
 * ```
 */
export const SecretsListFlyResponseElementSchema = z.object({
  name: z.string(),
  digest: z.string(),
  createdAt: z.string().datetime()
});

/**
 * Transformed secrets list response schema
 *
 * ```ts
 * fly secrets list --app [name] --json
 * ```
 */
export const SecretsListTransformedResponseSchema = z.array(
  withCamelCase(SecretsListFlyResponseElementSchema)
);
