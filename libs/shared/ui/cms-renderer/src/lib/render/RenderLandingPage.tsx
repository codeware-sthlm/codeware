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
export function RenderLandingPage({ landingPage }: RenderLandingPageProps) {
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
            title="Landing page was not found"
            severity="info"
            withoutContainer={true}
          >
            Please create a page in the CMS and assign it to be a landing page.
          </ErrorContainer>
        )}
      </article>
    </Container>
  );
}
