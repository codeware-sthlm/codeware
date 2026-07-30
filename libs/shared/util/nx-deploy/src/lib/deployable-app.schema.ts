import { z } from 'zod';

const ResolvedGithubConfigSchema = z.object({
  flyPostgresPreview: z.string().nullish(),
  flyPostgresProduction: z.string().nullish(),
  flyPostgresDatabaseName: z.string().nullish()
});

/**
 * Sentry wiring for a single app. Projects map one-to-one to apps, never to
 * tenants — tenants are separated by a runtime tag within the shared project.
 */
export const AppSentrySchema = z.object({
  /** Sentry project slug, resolved from Infisical by the pre-deploy action */
  project: z.string(),
  /** DSN of that project, resolved from Infisical by the pre-deploy action */
  dsn: z.string(),
  /**
   * Release identifier `name@version+sha`. Resolved by the build workflow once
   * the app manifests have been versioned, so it is absent until then.
   */
  release: z.string().optional()
});

export type AppSentry = z.infer<typeof AppSentrySchema>;

export const DeployableAppSchema = z.object({
  name: z.string(),
  flyConfigFile: z.string(),
  githubConfig: ResolvedGithubConfigSchema,
  /** Absent when the app has no Sentry configuration, which disables Sentry */
  sentry: AppSentrySchema.optional()
});

export type DeployableApp = z.infer<typeof DeployableAppSchema>;
