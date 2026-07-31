import { toPoolerUrl } from './to-pooler-url';

const region = 'eu-central-1';

describe('toPoolerUrl', () => {
  it('should convert a direct connection URL to a session mode pooler URL', () => {
    expect(
      toPoolerUrl(
        'postgresql://postgres:pass@db.abc123.supabase.co:5432/postgres',
        region
      )
    ).toBe(
      'postgresql://postgres.abc123:pass@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
    );
  });

  it('should leave a pooler URL unchanged', () => {
    const url =
      'postgresql://postgres.abc123:pass@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

    expect(toPoolerUrl(url, region)).toBe(url);
  });

  it('should leave a non-Supabase URL unchanged', () => {
    const url = 'postgresql://postgres:postgres@localhost:5432/cms';

    expect(toPoolerUrl(url, region)).toBe(url);
  });

  it.each(['', 'not-a-url', 'db.abc123.supabase.co:5432'])(
    'should return %p unchanged rather than throwing',
    (value) => {
      expect(toPoolerUrl(value, region)).toBe(value);
    }
  );
});
