/**
 * Format a human-readable release identifier for an app build.
 *
 * Produces `name@version+sha` (e.g. `cms@1.4.0+ab12cd3`), the shape used by the
 * About UI and, later, the Sentry release name. The build metadata part (`+sha`)
 * is omitted when no sha is provided, yielding just `name@version`.
 *
 * @param params.name - App name, e.g. `cms`.
 * @param params.version - Semver version, e.g. `1.4.0`.
 * @param params.sha - Short commit sha, e.g. `ab12cd3`. Optional.
 * @returns The release identifier string.
 */
export const formatReleaseName = ({
  name,
  version,
  sha
}: {
  name: string;
  version: string;
  sha?: string;
}): string => `${name}@${version}${sha ? `+${sha}` : ''}`;
