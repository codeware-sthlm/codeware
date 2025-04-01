import { SiteSetting } from '@codeware/shared/util/payload-types';
import * as RemixReact from '@remix-run/react';
import { createRemixStub } from '@remix-run/testing';
import { render, screen, waitFor } from '@testing-library/react';

import Index, { ErrorBoundary } from '../../app/routes/_index';

it('renders loader data', async () => {
  vi.spyOn(RemixReact, 'useRouteLoaderData').mockImplementation((routeId) => {
    if (routeId === 'root') {
      return {
        siteSettings: {
          general: {
            appName: 'Test App',
            landingPage: {
              header: 'Welcome home!',
              name: 'home'
            }
          }
        } as Partial<SiteSetting>
      };
    }
    return undefined;
  });

  const RemixStub = createRemixStub([
    {
      path: '/',
      Component: Index
    }
  ]);

  render(<RemixStub />);

  await waitFor(() => screen.findByText('Welcome home!'));
});

it('renders error when loader throws', async () => {
  const RemixStub = createRemixStub([
    {
      path: '/',
      loader: () => {
        throw { message: 'Page not found', status: 404 };
      },
      Component: Index,
      ErrorBoundary
    }
  ]);

  render(<RemixStub />);

  await waitFor(() => screen.findByText('Page not found'));
});
