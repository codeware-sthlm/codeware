import * as CmsRenderer from '@codeware/shared/ui/cms-renderer';
import * as RemixReact from '@remix-run/react';
import { createRemixStub } from '@remix-run/testing';
import { render, screen, waitFor } from '@testing-library/react';

import Index, { ErrorBoundary } from '../../app/routes/_index';

vi.mock('@codeware/shared/ui/cms-renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof CmsRenderer>();
  return {
    ...actual,
    usePayload: () => ({ locale: 'en' })
  };
});

it('renders loader data', async () => {
  vi.spyOn(RemixReact, 'useRouteLoaderData').mockImplementation((routeId) => {
    if (routeId === 'root') {
      return {
        landingPage: {
          header: 'Welcome home!',
          name: 'home',
          layout: [{}]
        },
        requestInfo: {
          userPrefs: {
            locale: 'en'
          }
        }
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
