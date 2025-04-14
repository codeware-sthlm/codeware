import { RenderBlocks } from '@codeware/shared/ui/payload-components';
import type { SiteSetting } from '@codeware/shared/util/payload-types';
import { type MetaFunction, useRouteError } from '@remix-run/react';

import { Container } from '../components/container';
import { ErrorContainer } from '../components/error-container';
import { useSiteSettings } from '../utils/use-site-settings';

type LoaderError = {
  message: string;
  status: number;
};

export const meta: MetaFunction = ({ matches }) => {
  // Get loading page from root loader data
  const rootData = matches.find((match) => match.id === 'root')?.data as Record<
    string,
    SiteSetting
  >;

  let title = 'Home';

  if (rootData && 'siteSettings' in rootData) {
    if (typeof rootData.siteSettings.general.landingPage === 'object') {
      title = rootData.siteSettings.general.landingPage.meta?.title ?? title;
    }
  }

  return [{ title }];
};

export default function Index() {
  const { landingPage } = useSiteSettings();

  return (
    <Container className="mt-16 sm:mt-32">
      {landingPage?.header && (
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            {landingPage.header}
          </h1>
        </header>
      )}
      <article className="mt-16">
        {landingPage ? (
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

export function ErrorBoundary() {
  const error = useRouteError() as LoaderError;

  return (
    <ErrorContainer severity="error" stackTrace={error.message}>
      The landing page could not be rendered.
    </ErrorContainer>
  );
}
