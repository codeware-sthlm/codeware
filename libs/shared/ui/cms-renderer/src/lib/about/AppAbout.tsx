import { t } from '@codeware/shared/util/i18n';
import { formatReleaseName } from '@codeware/shared/util/pure';

/**
 * App build metadata surfaced by the About UI.
 *
 * Each app supplies its own values (server-side build info), so the components
 * that render it stay app-agnostic.
 */
export type AppInfo = {
  /** App name, e.g. `cms` or `web`. */
  name: string;
  /** Semver version from the app's manifest, e.g. `1.4.0`. */
  version: string;
  /** Short commit sha of the build, e.g. `ab12cd3`. Empty in local dev. */
  sha: string;
  /** Deployment environment, e.g. `production`. */
  deployEnv: string;
  /** ISO timestamp when the image was built. Empty in local dev. */
  buildTime: string;
};

const formatBuildTime = (buildTime: string, locale: string): string => {
  if (!buildTime) {
    return '—';
  }
  const date = new Date(buildTime);
  if (Number.isNaN(date.getTime())) {
    return buildTime;
  }
  // Localized, but pin BOTH the locale (same on server & client) and the timezone
  // to UTC. Left to the runtime default, `toLocaleString` renders a different
  // language/timezone on the server than in the browser, breaking React hydration
  // (error #418) when the About block is server-rendered.
  return `${date.toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  })} UTC`;
};

/**
 * Presentational "About" panel for a deployed app: release identifier
 * (`name@version+sha`), environment and build time. App-agnostic — it renders
 * whatever {@link AppInfo} it is given, so both cms and web reuse it.
 *
 * `locale` localizes the row labels; each consumer passes its active locale
 * (web from `usePayload().locale`, cms admin from Payload's `i18n.language`).
 */
export const AppAbout: React.FC<{ appInfo: AppInfo; locale: string }> = ({
  appInfo,
  locale
}) => {
  const { name, version, sha, deployEnv, buildTime } = appInfo;

  const rows: Array<{ label: string; value: string }> = [
    {
      label: t(locale, 'about.release'),
      value: formatReleaseName({ name, version, sha })
    },
    { label: t(locale, 'about.version'), value: version },
    { label: t(locale, 'about.commit'), value: sha || '—' },
    { label: t(locale, 'about.environment'), value: deployEnv },
    {
      label: t(locale, 'about.built'),
      value: formatBuildTime(buildTime, locale)
    }
  ];

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {rows.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-foreground font-medium break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
};
