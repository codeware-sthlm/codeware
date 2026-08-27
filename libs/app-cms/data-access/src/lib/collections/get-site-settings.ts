import type {
  SiteSettingsGeneral,
  TenantIconConfig
} from '@codeware/shared/util/payload-types';
import type { TypedLocale } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/** What tenant sites rendered before the theme setting existed. */
const FALLBACK_THEME = 'spotlight';

type Response = {
  appName: string;
  /** Light/dark: `system` lets the visitor choose, otherwise it is locked */
  colorScheme: SiteSettingsGeneral['colorScheme'];
  /** Theme rendered before the visitor picks one; always a member of `themes` */
  defaultTheme: string;
  defaultLocale: TypedLocale;
  icon: TenantIconConfig | null;
  landingPage: number;
  /** Themes this site may render. A single entry means no selector is shown. */
  themes: Array<string>;
};

/**
 * Fetch site settings (shallow).
 *
 * **Kept at depth 0** so relationship fields (landingPage, etc.) are returned as
 * IDs and are not subject to the authenticated user's collection-level access.
 *
 * Site settings are typically a singleton collection, so this returns
 * the first (and usually only) document.
 *
 * Returns null if settings are not found or the user doesn't have access.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @returns Site settings or null
 */
export async function getSiteSettings(
  runtime: PayloadRuntime,
  options: Pick<QuerySingleOptions, 'locale'> = {}
): Promise<Response | null> {
  const { payload, tenantConfig } = runtime;
  const { locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'site-settings',
    depth: 0,
    limit: 1,
    locale: locale ?? tenantConfig?.locale,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  if (!result.totalDocs) {
    return null;
  }
  const {
    general: {
      appName,
      colorScheme,
      defaultTheme,
      defaultLocale,
      icon,
      landingPage,
      themes
    }
  } = result.docs[0];

  // Resolve icon — SVG is inline; upload needs a media URL lookup
  let resolvedIcon: TenantIconConfig | null = null;
  switch (icon?.source) {
    case 'svg':
      {
        if (icon.svgCode) {
          resolvedIcon = { source: 'svg', svgCode: icon.svgCode };
        }
      }
      break;
    case 'upload': {
      const fileId = typeof icon.file === 'number' ? icon.file : null;
      if (fileId) {
        try {
          const media = await payload.findByID({
            collection: 'media',
            id: fileId,
            depth: 0
          });
          if (media?.url) {
            resolvedIcon = { source: 'upload', fileUrl: media.url };
          }
        } catch {
          // Non-fatal: icon URL unavailable, proceed without it
        }
      }
    }
  }

  // Settings saved before these fields existed read back empty, and a stale
  // default may name a theme since removed from the list — resolve both here so
  // every caller gets a theme that is actually selectable.
  const selectableThemes = themes?.length ? themes : [FALLBACK_THEME];
  const resolvedDefaultTheme = selectableThemes.includes(defaultTheme)
    ? defaultTheme
    : selectableThemes[0];

  return {
    appName,
    colorScheme: colorScheme ?? 'system',
    defaultTheme: resolvedDefaultTheme,
    defaultLocale,
    icon: resolvedIcon,
    landingPage: typeof landingPage === 'number' ? landingPage : landingPage.id,
    themes: selectableThemes
  };
}
