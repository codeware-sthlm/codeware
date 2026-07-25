import { extractVersion } from './extract-version';

describe('extractVersion', () => {
  it.each([
    ['~6.0.3', { major: 6, minor: 0, patch: 3 }],
    ['^5.9.0', { major: 5, minor: 9, patch: 0 }],
    ['16.1.6', { major: 16, minor: 1, patch: 6 }],
    ['>=5.4.0', { major: 5, minor: 4, patch: 0 }]
  ])('should extract parts from %s', (version, parts) => {
    expect(extractVersion(version)).toEqual({ version, ...parts });
  });

  it('should leave missing parts undefined', () => {
    expect(extractVersion('5')).toEqual({
      version: '5',
      major: 5,
      minor: undefined,
      patch: undefined
    });
  });

  it('should keep the raw spec but leave parts undefined for non-numeric specs', () => {
    expect(extractVersion('workspace:*')).toEqual({
      version: 'workspace:*',
      major: undefined,
      minor: undefined,
      patch: undefined
    });
  });
});
