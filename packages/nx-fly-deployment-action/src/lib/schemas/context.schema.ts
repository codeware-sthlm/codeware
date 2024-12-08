import { Environment, EnvironmentSchema } from '@codeware/core/actions';
import { z } from 'zod';

import { Action, ActionSchema } from './action-outputs.schema';

type PrettyPartial<T> = {
  [K in keyof T]?: T[K];
} & {};

// 'preview' environment requires a pull request number
const BasePreviewSchema = z.object({
  environment: z.literal(EnvironmentSchema.enum.preview),
  pullRequest: z.number({
    description: 'Pull request number',
    required_error: 'A pull request number is required'
  })
});

// 'production' environment requires no additional fields
const BaseProductionSchema = z.object({
  environment: z.literal(EnvironmentSchema.enum.production)
});

// Should be used to validate `BuildingContext` data
export const ContextSchema = z.discriminatedUnion('environment', [
  BasePreviewSchema.merge(
    z.object({
      action: z.enum([ActionSchema.enum.deploy, ActionSchema.enum.destroy])
    })
  ),
  BaseProductionSchema.merge(
    z.object({
      action: z.enum([ActionSchema.enum.deploy])
    })
  )
]);

// Export type definitions
export type Context = z.infer<typeof ContextSchema>;

// Context builder helper types
type BasePreview = z.infer<typeof BasePreviewSchema>;

/**
 * A type that is a subset of `Context` and should be used
 * as a flexible context builder by `flyDeployment`.
 *
 * For data safety the context must be validated by `ContextSchema`.
 */
export type BuildingContext = PrettyPartial<
  {
    action: Exclude<Action, 'skip'>;
    environment: Environment;
  } & Pick<BasePreview, 'pullRequest'>
>;
