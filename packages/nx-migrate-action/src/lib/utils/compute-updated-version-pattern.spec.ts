import { computeUpdatedVersionPattern } from './compute-updated-version-pattern';

describe('computeUpdatedVersionPattern', () => {
  it('bumps plain semver to latest', () => {
    expect(computeUpdatedVersionPattern('21.2.3', '22.0.0')).toBe('22.0.0');
  });

  it('bumps major.x to latest major.x', () => {
    expect(computeUpdatedVersionPattern('21.x', '22.0.0')).toBe('22.x');
  });

  it('bumps caret to ^latest', () => {
    expect(computeUpdatedVersionPattern('^21.0.0', '22.0.0')).toBe('^22.0.0');
  });

  it('extends multi-range with latest (spaces)', () => {
    expect(computeUpdatedVersionPattern('^20.0.0 || ^21.0.0', '22.0.0')).toBe(
      '^20.0.0 || ^21.0.0 || ^22.0.0'
    );
  });

  it('extends multi-range with latest (no spaces)', () => {
    expect(computeUpdatedVersionPattern('^19.0.0||^20.0.0', '21.0.0')).toBe(
      '^19.0.0||^20.0.0||^21.0.0'
    );
  });

  it('does not duplicate the latest in range', () => {
    expect(
      computeUpdatedVersionPattern('^20.0.0 || ^21.0.0 || ^22.0.0', '22.0.0')
    ).toBe('^20.0.0 || ^21.0.0 || ^22.0.0');
  });

  it('leaves unrelated patterns alone', () => {
    expect(computeUpdatedVersionPattern('~21.0.0', '22.0.0')).toBe('~21.0.0');
    expect(computeUpdatedVersionPattern('file:../local', '22.0.0')).toBe(
      'file:../local'
    );
    expect(computeUpdatedVersionPattern('workspace:*', '22.0.0')).toBe(
      'workspace:*'
    );
    expect(computeUpdatedVersionPattern('latest', '22.0.0')).toBe('latest');
  });
});
