import { getSiteSettings } from '@codeware/app-cms/data-access';
import { Container } from '@codeware/app-cms/ui/web';
import { RenderBlocks } from '@codeware/shared/ui/cms-renderer';

import { authenticatedPayload } from '../../security/authenticated-payload';

// TODO: metadata

export default async function SiteIndexPage() {
  const payload = await authenticatedPayload();

  const settings = await getSiteSettings(payload);
  const landingPage = settings?.landingPage;

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
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950">
            <h3 className="text-lg font-semibold">
              Landing page not configured
            </h3>
            <p className="mt-2 text-sm">
              Please create a page in the CMS and assign it as the landing page
              in Site Settings.
            </p>
          </div>
        )}
      </article>
    </Container>
  );
}
