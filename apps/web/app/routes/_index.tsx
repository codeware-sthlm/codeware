import {
  ErrorContainer,
  RenderLandingPage,
  usePayload
} from '@codeware/shared/ui/cms-renderer';
import { t } from '@codeware/shared/util/i18n';
import { resolveDocMeta } from '@codeware/shared/util/payload-utils';
import {
  type MetaFunction,
  useRouteError,
  useRouteLoaderData
} from '@remix-run/react';

import type { loader as rootLoader } from '../root';
import { defaultAppName } from '../utils/default-app-name';
import { getLandingDocFromRoot } from '../utils/get-landing-doc-from-root';
import { getTenantConfigFromRoot } from '../utils/get-tenant-config-from-root';
import { useLandingDoc } from '../utils/use-landing-doc';

type LoaderError = {
  message: string;
  status: number;
};

export const meta: MetaFunction = ({ matches }) => {
  const landingDoc = getLandingDocFromRoot(matches);
  const tenantConfig = getTenantConfigFromRoot(matches);

  const appName = tenantConfig?.appName ?? defaultAppName;
  const meta = resolveDocMeta(landingDoc);

  return [{ title: `${appName} - ${meta?.title ?? 'Home'}` }];
};

export default function Index() {
  const landingDoc = useLandingDoc();
  const { locale } = usePayload();

  return (
    <RenderLandingPage
      landingPage={landingDoc?.doc}
      locale={locale}
      blocksData={landingDoc?.blocksData}
    />
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
