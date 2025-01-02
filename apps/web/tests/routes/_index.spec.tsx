import { createRemixStub } from '@remix-run/testing';
import { render, screen, waitFor } from '@testing-library/react';

import Index, { ErrorBoundary } from '../../app/routes/_index';

it('renders loader data', async () => {
  const RemixStub = createRemixStub([
    {
      path: '/',
      loader: () => ({ page: { title: 'Home', header: 'Welcome home!' } }),
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
