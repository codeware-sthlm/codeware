import type {
  CustomThemeConfig,
  Tenant,
  TenantRuntimeConfig
} from '@codeware/shared/util/payload-types';

import type { getSiteSettings } from './collections/get-site-settings';

type SiteSettings = NonNullable<Awaited<ReturnType<typeof getSiteSettings>>>;

/**
 * Assemble the runtime config a tenant site renders from.
 *
 * Both the local bootstrap and the `tenant-config` endpoint answer with this
 * shape, and a field added to one but not the other is invisible until an
 * external client renders differently from the site it mirrors — so they build
 * it here rather than each on their own.
 *
 * @param settings - Site settings, already normalised by `getSiteSettings`
 * @param customThemes - The tenant's authored themes, if any
 * @param tenant - The authenticated tenant
 */
export function buildTenantConfig({
  settings,
  customThemes,
  tenant
}: {
  settings: SiteSettings;
  customThemes: Array<CustomThemeConfig>;
  tenant: Tenant;
}): TenantRuntimeConfig {
  return {
    appName: settings.appName,
    icon: settings.icon,
    locale: settings.defaultLocale,
    fallbackLocale: null,
    landingPage: { collection: 'pages', id: settings.landingPage },
    tenant,
    // Site settings can only offer the built-in themes — the field is backed by
    // a Postgres enum — so an authored theme joins the list here. `themes` is
    // already normalised to a non-empty list whose first entry `defaultTheme`
    // falls back to, and appending names cannot invalidate that
    themes: [...settings.themes, ...customThemes.map(({ slug }) => slug)],
    customThemes,
    defaultTheme: settings.defaultTheme,
    colorScheme: settings.colorScheme
  };
}
