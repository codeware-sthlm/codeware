import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  getNavigationTree,
  getTenantContext
} from '@codeware/app-cms/data-access';
import { getEnv } from '@codeware/app-cms/feature/env-loader';
import {
  Container,
  DesktopNavigation,
  Footer,
  MobileNavigation,
  ThemeSwitch
} from '@codeware/app-cms/ui/web';
import { CdwrCloud } from '@codeware/shared/ui/primitives';

import './spotlight.css';
import { authenticatedPayload } from '../../security/authenticated-payload';

import { Providers } from './providers';

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const tenantContext = await getTenantContext();

  // Redirect to admin panel if no tenant context (admin-only deployment)
  if (!tenantContext) {
    redirect('/admin');
  }

  // Get authenticated payload instance
  const payload = await authenticatedPayload();

  // Fetch navigation with proper access control and tenant scoping
  const navigationTree = await getNavigationTree(payload);

  // Get Payload URL from environment
  const env = getEnv();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Needed? */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <Providers payloadUrl={env.PAYLOAD_URL}>
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
                          <Link href="/" className="pointer-events-auto">
                            <CdwrCloud size={40} />
                          </Link>
                        </div>
                      </div>
                      <div className="flex flex-1 justify-end md:justify-center">
                        <MobileNavigation
                          navigationTree={navigationTree}
                          className="pointer-events-auto md:hidden"
                        />
                        <DesktopNavigation
                          navigationTree={navigationTree}
                          className="pointer-events-auto hidden md:block"
                        />
                      </div>
                      <div className="flex items-end justify-end md:flex-1">
                        <div className="pointer-events-auto">
                          <ThemeSwitch />
                        </div>
                      </div>
                    </div>
                  </Container>
                </div>
              </header>

              <main className="flex-auto">{children}</main>
              <Footer navigationTree={navigationTree} />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

// TODO: fetch metadata or static data?
export const metadata: Metadata = {
  title: 'Codeware CMS',
  description:
    'A headless CMS built with Payload CMS and Next.js, designed for flexibility and ease of use.'
};
