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
  useLoaderData
} from '@remix-run/react';

import { fetchPages } from './api/fetch-pages';
import { Container } from './components/container';
import { GeneralErrorBoundary } from './components/error-boundary';
import { Footer } from './components/footer';
import CdwrCloud from './components/logo';
import { DesktopNavigation } from './components/navigation';
import { ThemeSwitch, useTheme } from './routes/resources.theme-switch';
import stylesheet from './tailwind.css?url';
import { ClientHintCheck, getHints } from './utils/client-hints';
import { type Theme, getTheme } from './utils/theme.server';

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

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const [theme, pages] = await Promise.all([getTheme(request), fetchPages()]);

    const pageDetails = pages.map((page) => ({
      slug: page.slug,
      title: page.title
    }));

    return {
      pages: pageDetails,
      requestInfo: {
        hints: getHints(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: theme
        }
      }
    };
  } catch (error) {
    console.error('Failed to load root data:', error);
    throw data(
      { message: 'Failed to load root data. Please try again later.' },
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
  const data = useLoaderData<typeof loader>();

  return (
    <>
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
                  <div className="flex flex-1 ">
                    <div className="flex items-center h-10 w-10 backdrop-blur">
                      <Link to="/" className="pointer-events-auto">
                        <CdwrCloud className="text-black dark:text-white" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-1 justify-end md:justify-center">
                    {/** TODO Add mobile navigation - COD-195
                     * <MobileNavigation className="pointer-events-auto md:hidden" />
                     */}
                    <DesktopNavigation className="pointer-events-auto hidden md:block" />
                  </div>
                  <div className="flex justify-end items-end md:flex-1">
                    <div className="pointer-events-auto">
                      <ThemeSwitch
                        userPreference={data.requestInfo.userPrefs.theme}
                      />
                    </div>
                  </div>
                </div>
              </Container>
            </div>
          </header>
          <main className="flex-auto">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}

// this is a last resort error boundary. There's not much useful information we
// can offer at this level.
export const ErrorBoundary = GeneralErrorBoundary;
