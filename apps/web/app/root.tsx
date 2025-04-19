import {
  PayloadProvider,
  type PayloadValue
} from '@codeware/shared/ui/payload-components';
import { CdwrCloud } from '@codeware/shared/ui/react-universal-components';
import {
  type NavigationItem,
  getNavigationTree,
  getSiteSettings
} from '@codeware/shared/util/payload-api';
import type { SiteSetting } from '@codeware/shared/util/payload-types';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData,
  useNavigate
} from '@remix-run/react';

import env from '../env-resolver/env';

import { Container } from './components/container';
import { DesktopNavigation } from './components/desktop-navigation';
import { GeneralErrorBoundary } from './components/error-boundary';
import { ErrorContainer } from './components/error-container';
import { Footer } from './components/footer';
import { MobileNavigation } from './components/mobile-navigation';
import { ThemeSwitch, useTheme } from './routes/resources.theme-switch';
import stylesheet from './tailwind.css?url';
import { ClientHintCheck, getHints } from './utils/client-hints';
import { getPayloadRequestOptions } from './utils/get-payload-request-options';
import { type Theme, getTheme } from './utils/theme.server';

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
  /** Error message to display to the user when we have e.g. API issues */
  let loaderErrorMessage = '';

  try {
    // Get the theme before fetching pages in case it fails
    const theme = await getTheme(request);

    let navigationTree: Array<NavigationItem> = [];
    let siteSettings: SiteSetting | null = null;

    // Fetch layout data but don't propagate the exception to the error boundary
    try {
      const requestOptions = getPayloadRequestOptions(
        'GET',
        context,
        request.headers
      );
      navigationTree = await getNavigationTree(requestOptions);
      siteSettings = await getSiteSettings(requestOptions);
    } catch (e) {
      const error = e as Error;
      console.error(`Failed to load data: ${error.message}`);
      loaderErrorMessage =
        'Unable to load application content. Please try again later.';
    }

    return json({
      env,
      loaderErrorMessage,
      navigationTree,
      requestInfo: {
        hints: getHints(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: theme
        }
      },
      siteSettings
    });
  } catch (error) {
    console.error('Failed to load root data:\n', error);
    // Delegate to error boundary
    throw error;
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
    navigate: (path, newTab) => {
      const isExternal = path.startsWith('http');
      // Open new tab
      if (newTab) {
        window.open(path, '_blank');
        return;
      }
      // Native redirect external links
      if (isExternal) {
        window.location.href = path;
        return;
      }
      // Invoke router event for internal links
      navigate(path);
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
                      <Link
                        to="/"
                        className="pointer-events-auto text-zinc-600 dark:text-zinc-400"
                      >
                        <CdwrCloud size={40} />
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
            {/* Display loader error message if it exists instead of the outlet */}
            {(loaderData.loaderErrorMessage && (
              <ErrorContainer severity="error">
                {loaderData.loaderErrorMessage}
              </ErrorContainer>
            )) || <Outlet />}
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
