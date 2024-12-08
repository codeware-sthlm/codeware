import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Fly certs list response element schema
 *
 * ```ts
 * fly certs list --app [name] --json
 * ```
 */
export const CertsListFlyResponseElementSchema = z.object({
  createdAt: z.string().datetime(),
  hostname: z.string(),
  clientStatus: z.string()
});

/**
 * Transformed certs list response schema
 *
 * ```ts
 * fly certs list --app [name] --json
 * ```
 */
export const CertsListTransformedResponseSchema = z.array(
  withCamelCase(CertsListFlyResponseElementSchema)
);
