import { expect, test } from './fixtures';

test.describe('/api/health', () => {
  test('returns 200 with Pong! when healthy', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('Pong!');
    expect(response.headers()['content-type']).toContain('text/plain');
    expect(response.headers()['cache-control']).toContain('no-store');
  });
});
