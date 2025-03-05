import { RenderBlocks } from '@codeware/shared/ui/payload-components';
import { findBySlug } from '@codeware/shared/util/payload-api';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, useLoaderData, useRouteError } from '@remix-run/react';

import env from '../../env-resolver/env';
import { Container } from '../components/container';
import { getApiOptions } from '../utils/get-api-options';

import { useTheme } from './resources.theme-switch';

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
 * Fetch page data for the current `slug` route.
 */
export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const { slug } = params;
  if (!slug) {
    const error: LoaderError = {
      message: 'Page not found',
      status: 404
    };
    throw Response.json(error);
  }

  try {
    const page = await findBySlug(
      'pages',
      slug,
      getApiOptions(context, request)
    );
    if (!page) {
      const error: LoaderError = {
        message: 'Page not found',
        status: 404
      };
      throw Response.json(error);
    }
    return json({ page, apiUrl: env.PAYLOAD_URL });
  } catch (e) {
    const error = e as Error;
    throw Response.json({ message: error.message }, { status: 404 });
  }
}

export default function Page() {
  const { page, apiUrl } = useLoaderData<typeof loader>();
  const theme = useTheme();

  return (
    <Container className="mt-16 sm:mt-32">
      {page.header && (
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            {page.header}
          </h1>
        </header>
      )}
      <article className="mt-16 prose md:prose-md dark:prose-invert">
        <RenderBlocks
          apiUrl={apiUrl}
          blocks={page.layout}
          enableProse={false}
          isDark={theme === 'dark'}
        />
      </article>
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
