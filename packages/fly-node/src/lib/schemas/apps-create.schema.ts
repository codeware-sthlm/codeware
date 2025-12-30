import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Transformed apps create response schema
 *
 * ```ts
 * fly apps create --app [name] --json
 * ```
 */
export const AppsCreateTransformedResponseSchema = withCamelCase(
  z.object({
    id: z.string(),
    name: z.string()
  })
);
