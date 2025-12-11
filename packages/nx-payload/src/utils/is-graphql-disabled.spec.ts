import { readFile } from 'fs/promises';

import { isGraphQLDisabled } from './is-graphql-disabled';

jest.mock('fs/promises');

describe('isGraphQLDisabled', () => {
  const mockReadFile = jest.mocked(readFile);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return true when graphQL.disable is true (basic format)', async () => {
    const content = `
      export default buildConfig({
        graphQL: { disable: true }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    const result = await isGraphQLDisabled('/path/to/config.ts');

    expect(result).toBe(true);
    expect(mockReadFile).toHaveBeenCalledWith('/path/to/config.ts', 'utf-8');
  });

  it('should return true when graphQL.disable is true (with trailing comma)', async () => {
    const content = `
      export default buildConfig({
        graphQL: { disable: true, }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(true);
  });

  it('should return true when disable is first property', async () => {
    const content = `
      export default buildConfig({
        graphQL: {
          disable: true,
          schema: { /* ... */ }
        }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(true);
  });

  it('should return true when disable is middle property', async () => {
    const content = `
      export default buildConfig({
        graphQL: {
          schema: { /* ... */ },
          disable: true,
          playground: false
        }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(true);
  });

  it('should return true when disable is last property', async () => {
    const content = `
      export default buildConfig({
        graphQL: {
          schema: { /* ... */ },
          disable: true
        }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(true);
  });

  it('should return true with no spaces around colons', async () => {
    const content = `
      export default buildConfig({
        graphQL:{disable:true}
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(true);
  });

  it('should return true with multiple newlines and spaces', async () => {
    const content = `
      export default buildConfig({
        graphQL: {

          disable:     true

        }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(true);
  });

  it('should return false when graphQL.disable is false', async () => {
    const content = `
      export default buildConfig({
        graphQL: { disable: false }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(false);
  });

  it('should return false when graphQL.disable is missing', async () => {
    const content = `
      export default buildConfig({
        graphQL: { schema: { /* ... */ } }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(false);
  });

  it('should return false when graphQL config is missing', async () => {
    const content = `
      export default buildConfig({
        collections: []
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(false);
  });

  it('should not match commented out disable', async () => {
    const content = `
      export default buildConfig({
        graphQL: {
          // disable: true
          schema: { /* ... */ }
        }
      })
    `;
    mockReadFile.mockResolvedValue(content);

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(false);
  });

  it('should return false when file read fails', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {
        // Suppress console output during tests
      });
    mockReadFile.mockRejectedValue(new Error('File not found'));

    const result = await isGraphQLDisabled('/path/to/config.ts');

    expect(result).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to check GraphQL status'),
      'File not found'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should return false when file read throws non-Error', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {
        // Suppress console output during tests
      });
    mockReadFile.mockRejectedValue('Some string error');

    const result = await isGraphQLDisabled('/path/to/config.ts');

    expect(result).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to check GraphQL status'),
      'Some string error'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle empty file', async () => {
    mockReadFile.mockResolvedValue('');

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(false);
  });

  it('should handle malformed content gracefully', async () => {
    mockReadFile.mockResolvedValue('{');

    expect(await isGraphQLDisabled('/path/to/config.ts')).toBe(false);
  });
});
