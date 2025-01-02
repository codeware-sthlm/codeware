import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { MetaFunction, useLoaderData, useRouteError } from '@remix-run/react';

import type { AppLoadContext } from '../api/create-request-init';
import { fetchPage } from '../api/fetch-page';
import { Container } from '../components/container';

type LoaderError = {
  message: string;
  status: number;
};

// TODO: How to use it properly?
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.page ? data.page.title : 'Page Not Found';
  return [{ title }];
};

/**
 * Fetch page data for home page.
 */
export async function loader({ context, request }: LoaderFunctionArgs) {
  const page = await fetchPage(context as AppLoadContext, 'home', request);

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
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          {page.header}
        </h1>
        {page.intro_html && (
          <h3 className="mt-6 text-zinc-600 dark:text-zinc-400">
            {page.intro_html}
          </h3>
        )}
      </header>
      {page.content_html && (
        <div className="mt-16 sm:mt-20">
          <div className="prose prose-zinc dark:prose-invert">
            {page.content_html}
          </div>
        </div>
      )}
    </Container>
  );
}

export function ErrorBoundary() {
  const error = useRouteError() as LoaderError;

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="flex items-center justify-center min-h-[30vh]">
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
