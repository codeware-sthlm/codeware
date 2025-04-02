import { findNavigationDoc } from '@codeware/shared/util/payload-api';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, useLoaderData, useRouteError } from '@remix-run/react';

import { Container } from '../components/container';
import { ErrorContainer } from '../components/error-container';
import { RenderPagesDoc } from '../components/render-pages-doc';
import { RenderPostsDoc } from '../components/render-posts-doc';
import { getPayloadRequestOptions } from '../utils/get-payload-request-options';

type LoaderError = {
  message: string;
  status: number;
};

// TODO: How to use it properly?
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (data?.doc.collection === 'pages') {
    return [{ title: data.doc.name }];
  }
  if (data?.doc.collection === 'posts') {
    return [{ title: data.doc.title }];
  }
  return [{ title: 'Page Not Found' }];
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
  const { doc } = useLoaderData<typeof loader>();

  return (
    <Container className="mt-16 sm:mt-32">
      {doc.collection === 'pages' && <RenderPagesDoc doc={doc} />}
      {doc.collection === 'posts' && <RenderPostsDoc doc={doc} />}
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
