import {
  PayloadProvider,
  type PayloadValue
} from '@codeware/shared/ui/payload-components';
import { CdwrCloud } from '@codeware/shared/ui/react-components';
import { getShallow } from '@codeware/shared/util/payload-api';
import type { Page, Post } from '@codeware/shared/util/payload-types';
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction
} from '@remix-run/node';
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  useLoaderData,
  useNavigate
} from '@remix-run/react';

import env from '../env-resolver/env';

import { Container } from './components/container';
import { DesktopNavigation } from './components/desktop-navigation';
import { GeneralErrorBoundary } from './components/error-boundary';
import { Footer } from './components/footer';
import { MobileNavigation } from './components/mobile-navigation';
import { ThemeSwitch, useTheme } from './routes/resources.theme-switch';
import stylesheet from './tailwind.css?url';
import { ClientHintCheck, getHints } from './utils/client-hints';
import { getPayloadRequestOptions } from './utils/get-payload-request-options';
import { type Theme, getTheme } from './utils/theme.server';
export type PageDetails = Pick<Page, 'name' | 'slug'> & { slug: string };
export type PostDetails = Pick<Post, 'title' | 'slug'> & { slug: string };

export const meta: MetaFunction = () => [
  {
    title: 'Codeware Web'
  }
];

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
  },
  { rel: 'stylesheet', href: stylesheet }
];

export async function loader({ context, request }: LoaderFunctionArgs) {
  try {
    // Get the theme before fetching pages in case it fails
    const theme = await getTheme(request);

    /** Error message to display to the user when we have e.g. API issues */
    let displayError = '';
    let pages: Array<Page> = [];
    let posts: Array<Post> = [];

    // Fetch layout data but don't propagate the exception to the error boundary
    try {
      const requestOptions = getPayloadRequestOptions(
        'GET',
        context,
        request.headers
      );
      pages = await getShallow('pages', requestOptions);
      posts = await getShallow('posts', requestOptions);
    } catch (e) {
      const error = e as Error;
      console.error(`Failed to load shallow data: ${error.message}`);
      displayError = 'Unable to load content. Please try again later.';
    }

    // Filter what to expose to the client
    const pageDetails: Array<PageDetails> = pages
      .filter(({ slug }) => slug)
      .map(({ name, slug }) => ({
        name,
        slug: String(slug)
      }));
    const postDetails: Array<PostDetails> = posts
      .filter(({ slug }) => slug)
      .map(({ title, slug }) => ({
        title,
        slug: String(slug)
      }));

    return {
      displayError,
      env,
      pages: pageDetails,
      posts: postDetails,
      requestInfo: {
        hints: getHints(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: theme
        }
      }
    };
  } catch (error) {
    console.error('Failed to load root data:\n', error);
    throw data(
      { message: 'Failed to load application. Please try again later.' },
      { status: 500 }
    );
  }
}

function Document({
  children,
  theme = 'light'
}: {
  children: React.ReactNode;
  theme?: Theme;
}) {
  return (
    <html lang="en" className={theme}>
      <head>
        <ClientHintCheck />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <Document theme={theme}>{children}</Document>;
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const theme = useTheme();

  // Provide app opinionated context to Payload components
  const context: PayloadValue = {
    navigate: (path: string) => {
      if (path.match(/^https?:\/\//)) {
        console.warn(
          'Payload navigation to external URL is not supported:',
          path
        );
      } else {
        navigate(path);
      }
    },
    payloadUrl: loaderData.env.PAYLOAD_URL,
    submitForm: async (formData) => {
      try {
        // Send to server-side action to use secure API key authentication
        const response = await fetch('/form-submission', {
          method: 'POST',
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();
        return { data: result, success: true };
      } catch (e) {
        const error = e as Error;
        return {
          success: false,
          data: { error: error?.message ?? 'Unknown error' }
        };
      }
    },
    theme
  };

  return (
    <PayloadProvider value={context}>
      <div className="flex w-full">
        <div className="fixed inset-0 flex justify-center sm:px-8">
          <div className="flex w-full max-w-7xl lg:px-8">
            <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
          </div>
        </div>
        <div className="relative flex w-full flex-col">
          <header className="pointer-events-none relative z-50 flex flex-none flex-col">
            <div className="top-0 z-10 h-16 pt-6">
              <Container className="w-full">
                <div className="relative flex gap-4">
                  <div className="flex flex-1">
                    <div className="flex h-10 w-10 items-center backdrop-blur">
                      <Link to="/" className="pointer-events-auto">
                        <CdwrCloud className="text-zinc-600 dark:text-zinc-400" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-1 justify-end md:justify-center">
                    <MobileNavigation className="pointer-events-auto md:hidden" />
                    <DesktopNavigation className="pointer-events-auto hidden md:block" />
                  </div>
                  <div className="flex items-end justify-end md:flex-1">
                    <div className="pointer-events-auto">
                      <ThemeSwitch
                        userPreference={loaderData.requestInfo.userPrefs.theme}
                      />
                    </div>
                  </div>
                </div>
              </Container>
            </div>
          </header>
          <main className="flex-auto">
            <Outlet />
            {loaderData.displayError && (
              <div className="flex items-center justify-center p-4">
                <p className="text-red-500">{loaderData.displayError}</p>
              </div>
            )}
          </main>
          <Footer />
        </div>
      </div>
    </PayloadProvider>
  );
}

// this is a last resort error boundary. There's not much useful information we
// can offer at this level.
export const ErrorBoundary = GeneralErrorBoundary;
