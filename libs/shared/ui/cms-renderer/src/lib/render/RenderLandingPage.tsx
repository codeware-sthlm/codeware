import { t } from '@codeware/shared/util/i18n';
import type { Page } from '@codeware/shared/util/payload-types';

import { ErrorContainer } from '../error/ErrorContainer';
import { Container } from '../layout/Container';
import { RenderBlocks } from '../RenderBlocks';

type RenderLandingPageProps = {
  /**
   * Landing page data from site settings.
   * The app is responsible for fetching this data.
   */
  landingPage?: Page | null;

  /**
   * The current locale used for translating UI strings.
   * Defaults to 'en' if not provided.
   */
  locale?: string;
};

/**
 * Framework-agnostic landing page renderer.
 *
 * Renders the landing page with:
 * - Optional header
 * - Page blocks via RenderBlocks
 * - Error message if no landing page is configured
 *
 * **Usage:**
 * The app is responsible for:
 * - Fetching landing page data from site settings
 * - Providing PayloadProvider context
 *
 * @example
 * ```tsx
 * // In Next.js app
 * const settings = await getSiteSettings(payload);
 * return <RenderLandingPage landingPage={settings?.landingPage} />;
 * ```
 */
export function RenderLandingPage({
  landingPage,
  locale
}: RenderLandingPageProps) {
  return (
    <Container className="mt-16 sm:mt-32">
      {landingPage?.header && (
        <header className="max-w-2xl">
          <h1 className="text-core-headline text-4xl font-bold tracking-tight sm:text-5xl">
            {landingPage.header}
          </h1>
        </header>
      )}
      <article className="mt-16">
        {landingPage?.layout ? (
          <RenderBlocks blocks={landingPage.layout} />
        ) : (
          <ErrorContainer
            title={t(locale ?? 'en', 'error.landingPageNotFound')}
            locale={locale}
            severity="info"
            withoutContainer={true}
          >
            {t(locale ?? 'en', 'error.landingPageNotFoundDescription')}
          </ErrorContainer>
        )}
      </article>
    </Container>
  );
}
