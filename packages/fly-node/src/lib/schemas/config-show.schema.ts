import { withCamelCase } from '@codeware/core/zod';
import { z } from 'zod';

/**
 * Fly config show response schema
 *
 * ```ts
 * fly config show --app [name] --config [path]
 * ```
 */
export const ConfigShowResponseSchema = withCamelCase(
  z.object({
    app: z.string(),
    primaryRegion: z.string().optional(),
    build: z
      .record(z.string(), z.any())
      .optional()
      .or(
        z.object({
          args: z.record(z.string(), z.string()).optional(),
          dockerfile: z.string().optional(),
          image: z.string().optional()
        })
      ),
    deploy: z
      .record(z.string(), z.any())
      .optional()
      .or(z.object({ strategy: z.string().optional() })),
    env: z.record(z.string(), z.string()).optional(),
    httpService: z.record(z.string(), z.any()).optional(),
    mounts: z.record(z.string(), z.any()).optional(),
    services: z.array(z.record(z.string(), z.any())).optional()
  }),
  {
    preserve: ['build.args', 'env']
  }
);
