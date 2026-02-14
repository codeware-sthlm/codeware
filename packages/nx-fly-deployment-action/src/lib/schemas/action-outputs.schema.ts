import { EnvironmentSchema } from '@codeware/core/actions';
import { z } from 'zod';

export const ActionSchema = z.enum(['deploy', 'destroy', 'failed', 'skip']);

const FlyAppNameSchema = z.object({
  app: z.string({ description: 'App name' }).min(1, 'An app name is required')
});

// 'deploy' action requires project name, deployed app and url
const ActionDeploySchema = FlyAppNameSchema.merge(
  z.object({
    action: z.literal(ActionSchema.enum.deploy),
    name: z
      .string({ description: 'Project name' })
      .min(1, 'A project name is required'),
    url: z
      .string({ description: 'Deployment URL' })
      .min(1, 'A deployment URL is required')
  })
);

// 'destroy' action requires the app name
const ActionDestroySchema = FlyAppNameSchema.merge(
  z.object({
    action: z.literal(ActionSchema.enum.destroy)
  })
);

// 'failed' action requires an app or project name and an error message
const ActionFailedSchema = z.object({
  action: z.literal(ActionSchema.enum.failed),
  appOrProject: z
    .string({ description: 'App or project name' })
    .min(1, 'An app or project name is required'),
  error: z
    .string({ description: 'Error message' })
    .min(1, 'An error message is required')
});

// 'skip' action requires an app or project name and a reason
const ActionSkipSchema = z.object({
  action: z.literal(ActionSchema.enum.skip),
  appOrProject: z
    .string({ description: 'App or project name' })
    .min(1, 'An app or project name is required'),
  reason: z
    .string({ description: 'Reason for skipping' })
    .min(1, 'A reason is required')
});

// Combine the action schemas into a discriminated union
const ProjectSchema = z.discriminatedUnion('action', [
  ActionDeploySchema,
  ActionDestroySchema,
  ActionFailedSchema,
  ActionSkipSchema
]);

// Final action outputs schema
export const ActionOutputsSchema = z.object({
  environment: EnvironmentSchema.or(z.null()),
  projects: z.array(ProjectSchema)
});

// Export type definitions
export type Action = z.infer<typeof ActionSchema>;
export type ActionOutputs = z.infer<typeof ActionOutputsSchema>;
