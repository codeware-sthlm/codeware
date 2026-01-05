import { findNavigationDoc } from '@codeware/shared/util/payload-api';
import { resolveMeta } from '@codeware/shared/util/payload-utils';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, useLoaderData, useRouteError } from '@remix-run/react';

import { Container } from '../components/container';
import { ErrorContainer } from '../components/error-container';
import { RenderPagesDoc } from '../components/render-pages-doc';
import { RenderPostsDoc } from '../components/render-posts-doc';
import { defaultAppName } from '../utils/default-app-name';
import { ensurePayloadDoc } from '../utils/ensure-payload-doc';
import { getPayloadRequestOptions } from '../utils/get-payload-request-options';
import { getSiteSettingsFromRoot } from '../utils/get-site-settings-from-root';

type LoaderError = {
  message: string;
  status: number;
};

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  // Get site settings from root loader data
  const siteSettings = getSiteSettingsFromRoot(matches);
  const appName = siteSettings?.general?.appName ?? defaultAppName;

  const doc = ensurePayloadDoc(data?.doc);
  const meta = resolveMeta(doc);

  return [{ title: `${appName} - ${meta?.title ?? 'Page'}` }];
};

/**
 * Fetch document data for the current route.
 */
export async function loader({ context, params, request }: LoaderFunctionArgs) {
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

  return (
    <ErrorContainer severity="error" stackTrace={error.message}>
      The page you're looking for could not be rendered.
    </ErrorContainer>
  );
}
