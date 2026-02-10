import { getSiteSettings } from '@codeware/app-cms/data-access';
import { Container, ErrorContainer } from '@codeware/app-cms/ui/web';
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
