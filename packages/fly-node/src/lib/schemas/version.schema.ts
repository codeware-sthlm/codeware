import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Fly version response schema
 *
 * ```ts
 * fly version --json
 * ```
 */
export const VersionTransformedResponseSchema = withCamelCase(
  z.object({
    name: z.string(),
    version: z.string(),
    commit: z.string(),
    branchName: z.string(),
    buildDate: z.string().datetime(),
    os: z.string(),
    architecture: z.string(),
    environment: z.string()
  })
);
