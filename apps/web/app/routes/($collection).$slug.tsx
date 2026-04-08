import { t } from '@codeware/shared/util/i18n';
import { findNavigationDoc } from '@codeware/shared/util/payload-api';
import { NavigationDoc } from '@codeware/shared/util/payload-types';
import { resolveMeta } from '@codeware/shared/util/payload-utils';
import type { MetaFunction } from '@remix-run/node';
import { json, useLoaderData, useRouteError, useRouteLoaderData } from '@remix-run/react';

import { Container } from '../components/container';
import { ErrorContainer } from '../components/error-container';
import { RenderPagesDoc } from '../components/render-pages-doc';
import { RenderPostsDoc } from '../components/render-posts-doc';
import type { loader as rootLoader } from '../root';
import { defaultAppName } from '../utils/default-app-name';
import { ensurePayloadDoc } from '../utils/ensure-payload-doc';
import { getPayloadRequestOptions } from '../utils/get-payload-request-options';
import { getTenantConfigFromRoot } from '../utils/get-tenant-config-from-root';
import { TypedLoaderFunctionArgs } from '../utils/types';

type LoaderError = {
  message: string;
  status: number;
};

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  const tenantConfig = getTenantConfigFromRoot(matches);
  const appName = tenantConfig?.appName ?? defaultAppName;

  const doc = ensurePayloadDoc((data as { doc: NavigationDoc })?.doc);
  const meta = resolveMeta(doc);

  return [{ title: `${appName} - ${meta?.title ?? 'Page'}` }];
};

/**
 * Fetch document data for the current route.
 */
export async function loader({
  context,
  params,
  request
}: TypedLoaderFunctionArgs) {
  const { collection, slug } = params;

  // Only slug is required
  if (!slug) {
    const error: LoaderError = {
      message: 'Page not found',
      status: 404
    };
    throw Response.json(error);
  }

  try {
    const doc = await findNavigationDoc(
      collection,
      slug,
      getPayloadRequestOptions('GET', context, request.headers)
    );
    if (!doc) {
      const error: LoaderError = {
        message: 'Page not found',
        status: 404
      };
      throw Response.json(error);
    }
    return json({ doc });
  } catch (e) {
    const error = e as Error;
    throw Response.json({ message: error.message }, { status: 404 });
  }
}

export default function Document() {
  const data = useLoaderData<typeof loader>();
  const doc = ensurePayloadDoc(data.doc);

  return (
    <Container className="mt-16 sm:mt-32">
      {doc?.collection === 'pages' && <RenderPagesDoc doc={doc} />}
      {doc?.collection === 'posts' && <RenderPostsDoc doc={doc} />}
    </Container>
  );
}

export function ErrorBoundary() {
  const error = useRouteError() as LoaderError;
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const locale = rootData?.requestInfo.userPrefs.locale ?? 'en';

  return (
    <ErrorContainer locale={locale} severity="error" stackTrace={error.message}>
      {t(locale, 'error.pageRenderFailed')}
    </ErrorContainer>
  );
}
