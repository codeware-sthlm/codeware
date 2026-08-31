import { ErrorContainer, RenderDoc } from '@codeware/shared/ui/cms-renderer';
import { t } from '@codeware/shared/util/i18n';
import { findDoc } from '@codeware/shared/util/payload-api';
import {
  type DocData,
  resolveDocMeta
} from '@codeware/shared/util/payload-utils';
import type { MetaFunction, SerializeFrom } from '@remix-run/node';
import {
  json,
  useLoaderData,
  useRouteError,
  useRouteLoaderData
} from '@remix-run/react';

import type { loader as rootLoader } from '../root';
import { defaultAppName } from '../utils/default-app-name';
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

  const meta = resolveDocMeta(data);

  return [{ title: `${appName} - ${meta?.title ?? 'Page'}` }];
};

/**
 * Fetch document data for the current route.
 *
 * Which collections are servable and how each one is fetched belongs to
 * `findDoc` — the route only forwards its dynamic values and guards the miss.
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
    const requestOptions = getPayloadRequestOptions(
      'GET',
      context,
      request.headers
    );

    const data = await findDoc(collection, slug, requestOptions);
    if (!data) {
      throw Response.json({ message: 'Page not found' }, { status: 404 });
    }

    return json(data);
  } catch (e) {
    const error = e as Error;
    throw Response.json({ message: error.message }, { status: 404 });
  }
}

export default function Document() {
  // Checked against the renderer's contract, then cast past serialization only
  const data: SerializeFrom<DocData> = useLoaderData<typeof loader>();

  // No wrapping container here — each renderer owns its own, and nesting them
  // indented the content twice
  return <RenderDoc {...(data as DocData)} />;
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
