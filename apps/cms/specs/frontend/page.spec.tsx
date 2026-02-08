import { render } from '@testing-library/react';
import * as payload from 'payload';

import HomePage from '../../src/app/(frontend)/start/page';

jest.mock('next/headers', () =>
  jest.requireMock('../../mocks/next-headers.mock')
);
jest.mock('next/image', () => jest.requireMock('../../mocks/next-image.mock'));
jest.mock('payload', () => jest.requireMock('../../mocks/payload.mock'));
jest.mock('../../src/payload.config', () =>
  require('../../mocks/payload-config.mock')
);

describe('HomePage', () => {
  const mockGetPayload = jest.spyOn(payload, 'getPayload');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render successfully', async () => {
    const Component = await HomePage();
    const { baseElement } = render(Component);
    expect(baseElement).toBeTruthy();
  });

  it('should show welcome message for non-authenticated users', async () => {
    const Component = await HomePage();
    const { getByText } = render(Component);
    expect(getByText('Welcome to your')).toBeTruthy();
    expect(getByText('Payload application.')).toBeTruthy();
  });

  it('should show personalized welcome for authenticated users', async () => {
    // Override the auth mock for this test
    mockGetPayload.mockResolvedValueOnce({
      auth: jest.fn().mockResolvedValue({
        user: { collection: 'users', email: 'test@example.com' }
      })
    } as Partial<payload.Payload> as payload.Payload);

    const Component = await HomePage();
    const { getByText } = render(Component);
    expect(getByText('Welcome back!')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });
});
