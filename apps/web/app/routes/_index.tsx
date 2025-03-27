import { RenderBlocks } from '@codeware/shared/ui/payload-components';
import { findBySlug } from '@codeware/shared/util/payload-api';
import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { MetaFunction, useLoaderData, useRouteError } from '@remix-run/react';

import { Container } from '../components/container';
import { getPayloadRequestOptions } from '../utils/get-payload-request-options';

type LoaderError = {
  message: string;
  status: number;
};

// TODO: How to use it properly?
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.page ? data.page.name : 'Page Not Found';
  return [{ title }];
};

/**
 * Fetch page data for home page.
 */
export async function loader({ context, request }: LoaderFunctionArgs) {
  const page = await findBySlug(
    'pages',
    'home',
    getPayloadRequestOptions('GET', context, request.headers)
  );

  if (!page) {
    const error: LoaderError = {
      message: 'Page failed to load',
      status: 404
    };
    throw Response.json(error);
  }

  return json({ page });
}

export default function Index() {
  const { page } = useLoaderData<typeof loader>();

  return (
    <Container className="mt-16 sm:mt-32">
      {page.header && (
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            {page.header}
          </h1>
        </header>
      )}
      <article className="mt-16">
        <RenderBlocks blocks={page.layout} />
      </article>
    </Container>
  );
}

export function ErrorBoundary() {
  const error = useRouteError() as LoaderError;

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {error.message}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    </Container>
  );
}
