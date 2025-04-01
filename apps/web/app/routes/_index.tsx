import { RenderBlocks } from '@codeware/shared/ui/payload-components';
import { type MetaFunction, useRouteError } from '@remix-run/react';

import { Container } from '../components/container';
import { useSiteSettings } from '../utils/use-site-settings';

type LoaderError = {
  message: string;
  status: number;
};

// TODO: How to use it properly?
export const meta: MetaFunction = () => {
  const { landingPage } = useSiteSettings();
  return [{ title: landingPage.name }];
};

export default function Index() {
  const { landingPage } = useSiteSettings();

  return (
    <Container className="mt-16 sm:mt-32">
      {landingPage.header && (
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            {landingPage.header}
          </h1>
        </header>
      )}
      <article className="mt-16">
        <RenderBlocks blocks={landingPage.layout} />
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
