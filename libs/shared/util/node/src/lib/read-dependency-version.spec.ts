import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { readDependencyVersion } from './read-dependency-version';

describe('readDependencyVersion', () => {
  let dir: string;

  const writePackageJson = (contents: unknown): void => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify(contents));
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'read-dependency-version-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should read and extract a dependency version from disk', () => {
    writePackageJson({ devDependencies: { typescript: '~6.0.3' } });

    expect(readDependencyVersion('typescript', { cwd: dir })).toEqual({
      version: '~6.0.3',
      major: 6,
      minor: 0,
      patch: 3
    });
  });

  it('should prefer devDependencies over dependencies', () => {
    writePackageJson({
      dependencies: { typescript: '~5.9.0' },
      devDependencies: { typescript: '~6.0.3' }
    });

    expect(readDependencyVersion('typescript', { cwd: dir })).toEqual({
      version: '~6.0.3',
      major: 6,
      minor: 0,
      patch: 3
    });
  });

  it('should read from dependencies when devDependencies is absent', () => {
    writePackageJson({ dependencies: { typescript: '~5.9.0' } });

    expect(readDependencyVersion('typescript', { cwd: dir })).toEqual({
      version: '~5.9.0',
      major: 5,
      minor: 9,
      patch: 0
    });
  });

  it('should read from devDependencies when dependencies is absent', () => {
    writePackageJson({ devDependencies: { typescript: '~6.0.3' } });

    expect(readDependencyVersion('typescript', { cwd: dir })).toEqual({
      version: '~6.0.3',
      major: 6,
      minor: 0,
      patch: 3
    });
  });

  it('should return undefined when the dependency is not declared', () => {
    writePackageJson({ dependencies: {} });

    expect(readDependencyVersion('typescript', { cwd: dir })).toBeUndefined();
  });

  it('should return undefined when package.json does not exist', () => {
    expect(readDependencyVersion('typescript', { cwd: dir })).toBeUndefined();
  });

  it('should throw on a malformed package.json', () => {
    writeFileSync(join(dir, 'package.json'), '{ not json');

    expect(() => readDependencyVersion('typescript', { cwd: dir })).toThrow();
  });
});
