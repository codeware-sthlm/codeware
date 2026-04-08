import { RenderBlocks, usePayload } from '@codeware/shared/ui/cms-renderer';
import { t } from '@codeware/shared/util/i18n';
import { resolveMeta } from '@codeware/shared/util/payload-utils';
import {
  type MetaFunction,
  useRouteError,
  useRouteLoaderData
} from '@remix-run/react';

import { Container } from '../components/container';
import { ErrorContainer } from '../components/error-container';
import type { loader as rootLoader } from '../root';
import { defaultAppName } from '../utils/default-app-name';
import { getLandingPageFromRoot } from '../utils/get-landing-page-from-root';
import { getTenantConfigFromRoot } from '../utils/get-tenant-config-from-root';
import { useLandingPage } from '../utils/use-landing-page';

type LoaderError = {
  message: string;
  status: number;
};

export const meta: MetaFunction = ({ matches }) => {
  const landingPage = getLandingPageFromRoot(matches);
  const tenantConfig = getTenantConfigFromRoot(matches);

  const appName = tenantConfig?.appName ?? defaultAppName;
  const meta = resolveMeta(landingPage);

  return [{ title: `${appName} - ${meta?.title ?? 'Home'}` }];
};

export default function Index() {
  const landingPage = useLandingPage();
  const { locale } = usePayload();

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
        {landingPage ? (
          <RenderBlocks blocks={landingPage.layout} />
        ) : (
          <ErrorContainer
            title={t(locale, 'error.landingPageNotFound')}
            severity="info"
            withoutContainer={true}
          >
            {t(locale, 'error.landingPageNotFoundDescription')}
          </ErrorContainer>
        )}
      </article>
    </Container>
  );
}

export function ErrorBoundary() {
  const error = useRouteError() as LoaderError;
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const locale = rootData?.requestInfo.userPrefs.locale ?? 'en';

  return (
    <ErrorContainer locale={locale} severity="error" stackTrace={error.message}>
      {t(locale, 'error.landingPageRenderFailed')}
    </ErrorContainer>
  );
}
