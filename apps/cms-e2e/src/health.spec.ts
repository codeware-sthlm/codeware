import { expect, test } from './fixtures';

test.describe('/api/health', () => {
  test('returns 200 Pong!', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('Pong!');
  });
});
