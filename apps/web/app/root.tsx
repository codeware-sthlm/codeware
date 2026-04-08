import {
  PayloadProvider,
  type PayloadValue
} from '@codeware/shared/ui/cms-renderer';
import { CdwrCloud } from '@codeware/shared/ui/primitives';
import {
  type NavigationItem,
  findById,
  getNavigationTree
} from '@codeware/shared/util/payload-api';
import { Page } from '@codeware/shared/util/payload-types';
import type { LinksFunction } from '@remix-run/node';
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
import { TypedLoaderFunctionArgs } from './utils/types';

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

export async function loader({ context, request }: TypedLoaderFunctionArgs) {
  /** Error message to display to the user when we have e.g. API issues */
  let loaderErrorMessage = '';

  try {
    // Get the theme before fetching pages in case it fails
    const theme = await getTheme(request);
    const tenantConfig = context.tenantConfig;

    let landingPage: Page | null = null;
    let navigationTree: Array<NavigationItem> = [];

    // Fetch layout data but don't propagate the exception to the error boundary
    try {
      if (!tenantConfig) {
        throw new Error('No tenant configuration available in loader context');
      }

      // Fetch landing page and navigation tree with proper locale
      const requestOptions = getPayloadRequestOptions(
        'GET',
        context,
        request.headers
      );
      const response = await Promise.all([
        findById(
          tenantConfig.landingPage.collection,
          tenantConfig.landingPage.id,
          requestOptions
        ),
        getNavigationTree(requestOptions)
      ]);

      landingPage = response[0];
      navigationTree = response[1];
    } catch (e) {
      const error = e as Error;
      console.error(`Failed to load data: ${error.message}`);
      loaderErrorMessage =
        'Unable to load application content. Please try again later.';
    }

    return json({
      env,
      loaderErrorMessage,
      landingPage,
      navigationTree,
      requestInfo: {
        hints: getHints(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          locale: context.tenantConfig?.locale ?? 'en',
          theme: theme
        }
      },
      tenantConfig
    });
  } catch (error) {
    console.error('Failed to load root data:\n', error);
    // Delegate to error boundary
    throw error;
  }
}

function Document({
  children,
  lang,
  theme = 'light'
}: {
  children: React.ReactNode;
  lang: string;
  theme?: Theme;
}) {
  return (
    <html lang={lang} className={theme}>
      <head>
        <ClientHintCheck />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const loaderData = useLoaderData<typeof loader>();
  const lang = loaderData.requestInfo.userPrefs.locale;

  return (
    <Document theme={theme} lang={lang}>
      {children}
    </Document>
  );
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const theme = useTheme();

  // Provide app opinionated context to Payload components
  const context: PayloadValue = {
    getCurrentPath: () => loaderData.requestInfo.path,
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
    setTheme: (theme) =>
      console.warn('Theme switcher not implemented yet', theme),
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
    theme,
    locale: loaderData.requestInfo.userPrefs.locale
  };

  return (
    <PayloadProvider value={context}>
      <div className="flex w-full">
        {/* Create a center aligned section with background space on each side */}
        <div className="fixed inset-0 flex justify-center sm:px-8">
          <div className="flex w-full max-w-7xl lg:px-8">
            {/* Content section */}
            <div className="bg-core-background-content ring-core-content-border w-full ring-1" />
          </div>
        </div>
        {/* Display header, main and footer inside the content section */}
        <div className="relative flex w-full flex-col">
          <header className="pointer-events-none relative z-50 flex flex-none flex-col">
            <div className="top-0 z-10 h-16 pt-6">
              <Container className="w-full">
                <div className="relative flex gap-4">
                  <div className="flex flex-1">
                    <div className="flex h-10 w-10 items-center backdrop-blur">
                      <Link to="/" className="pointer-events-auto">
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
