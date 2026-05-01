import { EnvironmentSchema } from '@codeware/core/actions-internal';
import { z } from 'zod';

const DeployProjectSchema = z.object({
  action: z.literal('deploy'),
  app: z.string(),
  name: z.string(),
  url: z.string()
});

const DestroyProjectSchema = z.object({
  action: z.literal('destroy'),
  app: z.string()
});

const FailedProjectSchema = z.object({
  action: z.literal('failed'),
  appOrProject: z.string(),
  error: z.string()
});

export const ProjectSchema = z.discriminatedUnion('action', [
  DeployProjectSchema,
  DestroyProjectSchema,
  FailedProjectSchema
]);

export type Project = z.infer<typeof ProjectSchema>;

export const ActionInputsSchema = z.object({
  pullRequest: z.number().int().positive(),
  environment: EnvironmentSchema,
  deployed: z.record(z.string(), z.string()).optional(),
  failed: z.array(z.string()).optional(),
  projects: z.array(ProjectSchema).optional(),
  token: z.string().min(1, 'A GitHub token is required')
});

export type ActionInputs = z.infer<typeof ActionInputsSchema>;
