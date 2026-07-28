import { describe, expect, it } from 'vitest';

import { formatReleaseName } from './format-release-name';

describe('formatReleaseName', () => {
  it('formats name@version+sha', () => {
    expect(
      formatReleaseName({ name: 'cms', version: '1.4.0', sha: 'ab12cd3' })
    ).toBe('cms@1.4.0+ab12cd3');
  });

  it('omits the +sha part when sha is absent', () => {
    expect(formatReleaseName({ name: 'web', version: '2.0.1' })).toBe(
      'web@2.0.1'
    );
  });

  it('omits the +sha part when sha is an empty string', () => {
    expect(formatReleaseName({ name: 'web', version: '2.0.1', sha: '' })).toBe(
      'web@2.0.1'
    );
  });

  it('supports prerelease versions', () => {
    expect(
      formatReleaseName({
        name: 'cms',
        version: '1.5.0-preview.2',
        sha: 'deadbee'
      })
    ).toBe('cms@1.5.0-preview.2+deadbee');
  });
});
