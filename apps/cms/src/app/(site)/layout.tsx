import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import {
  getNavigationTree,
  getTenantContext
} from '@codeware/app-cms/data-access';
import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { RenderLayout } from '@codeware/shared/ui/cms-renderer';

import './spotlight.css';
import { payloadRuntime } from '../../security/payload-runtime';

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
  const runtime = await payloadRuntime();

  // Fetch navigation with proper access control and tenant scoping
  const navigationTree = await getNavigationTree(runtime);

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
        <Providers
          iconConfig={runtime.tenantConfig?.icon ?? null}
          locale={runtime.tenantConfig?.locale ?? 'en'}
          payloadUrl={env.APP_MODE.serverURL}
        >
          <RenderLayout navigationTree={navigationTree}>
            {children}
          </RenderLayout>
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
