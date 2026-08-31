import type { Page } from '@codeware/shared/util/payload-types';
import type { BlocksData } from '@codeware/shared/util/payload-utils';

import { Container } from '../layout/Container';
import { RenderBlocks } from '../RenderBlocks';

type RenderPageProps = {
  /**
   * Page data to render.
   * The app is responsible for fetching this data and handling 404s.
   */
  page: Page;
  /**
   * Pre-fetched data for blocks that require server-side data.
   * Keyed by block id.
   */
  blocksData?: BlocksData;
};

/**
 * Framework-agnostic page renderer.
 *
 * Renders a CMS page with:
 * - Optional header
 * - Page blocks via RenderBlocks
 *
 * **Usage:**
 * The app is responsible for:
 * - Fetching page data by slug
 * - Handling 404 cases (if page is null/undefined)
 * - Providing PayloadProvider context
 *
 * @example
 * ```tsx
 * // In Next.js app
 * const page = await getPageData(payload, slug);
 * if (!page) notFound();
 * return <RenderPage page={page} blocksData={page.blocksData} />;
 * ```
 */
export function RenderPage({ page, blocksData }: RenderPageProps) {
  return (
    <Container className="mt-16 sm:mt-32">
      {page.header && (
        <header className="max-w-2xl">
          <h1 className="text-core-headline text-4xl font-bold tracking-tight sm:text-5xl">
            {page.header}
          </h1>
        </header>
      )}
      <article className="mt-16">
        <RenderBlocks blocks={page.layout} blocksData={blocksData} />
      </article>
    </Container>
  );
}
