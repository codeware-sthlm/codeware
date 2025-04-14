import { RenderBlocks } from '@codeware/shared/ui/payload-components';
import { resolveMeta } from '@codeware/shared/util/payload-utils';
import { type MetaFunction, useRouteError } from '@remix-run/react';

import { Container } from '../components/container';
import { ErrorContainer } from '../components/error-container';
import { defaultAppName } from '../utils/default-app-name';
import { getSiteSettingsFromRoot } from '../utils/get-site-settings-from-root';
import { useSiteSettings } from '../utils/use-site-settings';

type LoaderError = {
  message: string;
  status: number;
};

export const meta: MetaFunction = ({ matches }) => {
  // Get site settings from root loader data
  const siteSettings = getSiteSettingsFromRoot(matches);
  const appName = siteSettings?.general?.appName ?? defaultAppName;

  const meta = resolveMeta(siteSettings);

  return [{ title: `${appName} - ${meta?.title ?? 'Home'}` }];
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
