import { vol } from 'memfs';

import { extractPayloadConfig } from './extract-payload-config';

// Mock the fs module
jest.mock('fs', () => require('memfs'));

describe('extractPayloadConfig', () => {
  console.log = jest.fn();
  console.warn = jest.fn();

  const properties = `
  const Users: CollectionConfig = {
    fields: [],
    slug: 'users'
  };
  const buildPath = 'dist/apps/app/build';
  const connectionString = 'db-connection-string';
  `;

  const configObject = `
  {
    admin: {
      bundler: webpackBundler(),
      user: Users.slug,
      buildPath
    },
    collections: [Users],
    db: postgresAdapter({
      pool: { connectionString }
    }),
    editor: slateEditor({}),
    graphQL: {
      disable: false,
      schemaOutputFile: resolve(__dirname, 'generated/schema.graphql')
    }
  }
  `;

  const expectedConfig = {
    admin: {
      bundler: 'webpackBundler()',
      user: 'users',
      buildPath: 'dist/apps/app/build'
    },
    collections: [{ fields: [], slug: 'users' }],
    db: expect.stringContaining('postgresAdapter'),
    editor: expect.stringContaining('slateEditor'),
    graphQL: {
      disable: false,
      schemaOutputFile: expect.stringContaining(
        `resolve(__dirname, 'generated/schema.graphql')`
      )
    }
  };

  beforeEach(() => {
    // Clear the virtual file system before each test
    vol.reset();

    // Create a file with inline config object
    vol.mkdirSync('/default-config');
    vol.writeFileSync(
      '/default-config/payload.config.ts',
      `
${properties}
export default buildConfig(${configObject});
`
    );

    // Create a file with named config object
    vol.mkdirSync('/named-config');
    vol.writeFileSync(
      '/named-config/payload.config.ts',
      `
${properties}
const config = ${configObject};
export default buildConfig(config);
`
    );

    // Create a file with unused named config object and no default export
    vol.mkdirSync('/named-config-no-default');
    vol.writeFileSync(
      '/named-config-no-default/payload.config.ts',
      `
${properties}
const config = ${configObject};
`
    );

    // Create a file with unused named config object and default export
    vol.mkdirSync('/named-config-and-default');
    vol.writeFileSync(
      '/named-config-and-default/payload.config.ts',
      `
${properties}
const config = {
  admin: {
    bundler: webpackBundler(),
    user: Users.slug,
  }
};
export default buildConfig(${configObject});
`
    );

    // Create a file with no config object
    vol.mkdirSync('/no-config');
    vol.writeFileSync('/no-config/payload.config.ts', 'foo bar');
  });

  describe('full config', () => {
    it('should extract inline config object', () => {
      const result = extractPayloadConfig('/default-config');
      console.log('perf', result.formattedMetrics);

      expect(result.config).toMatchObject(expectedConfig);
    });

    it('should extract named config object', () => {
      const result = extractPayloadConfig('/named-config');
      console.log('perf', result.formattedMetrics);

      expect(result.config).toEqual(expectedConfig);
    });

    it('should extract named config object when a named config object also exists', () => {
      const result = extractPayloadConfig('/named-config-and-default');
      console.log('perf', result.formattedMetrics);

      expect(result.config).toEqual(expectedConfig);
    });

    it('should handle not finding any config object in the file', () => {
      const result = extractPayloadConfig('/no-config');
      console.log('perf', result.formattedMetrics);

      expect(result.config).toBeUndefined();
      expect(result.error).toEqual(
        'Could not find a valid Payload config object'
      );
    });

    it('should handle not finding any config object in the file when a named config object also exists', () => {
      const result = extractPayloadConfig('/named-config-no-default');
      console.log('perf', result.formattedMetrics);

      expect(result.config).toBeUndefined();
      expect(result.error).toEqual(
        'Could not find a valid Payload config object'
      );
    });

    it('should handle non-existent config file', () => {
      const result = extractPayloadConfig('/unknown-path');
      console.log('perf', result.formattedMetrics);

      expect(result.config).toBeUndefined();
      expect(result.error).toEqual(
        `Config file '/unknown-path/payload.config.ts' does not exist`
      );
    });
  });

  describe('partial config', () => {
    it('should lookup admin object', () => {
      const result = extractPayloadConfig('/default-config', 'admin');
      console.log('perf', result.formattedMetrics);
      expect(result.config).toEqual({ admin: expectedConfig.admin });
    });

    it('should lookup graphQL disabled state', () => {
      const result = extractPayloadConfig('/default-config', 'graphQL.disable');
      console.log('perf', result);
      expect(result.config).toEqual({ graphQL: { disable: false } });
    });

    it('should get empty object for unused top property', () => {
      const result = extractPayloadConfig('/default-config', 'email');
      console.log('perf', result);
      expect(result.config).toEqual({});
    });

    it('should get empty object for unused deep property', () => {
      const result = extractPayloadConfig(
        '/default-config',
        'email.fromAddress'
      );
      console.log('perf', result);
      expect(result.config).toEqual({});
    });

    it('should get nested empty object for unused deep property for used parent', () => {
      const result = extractPayloadConfig('/default-config', 'admin.autoLogin');
      console.log('perf', result);
      expect(result.config).toEqual({ admin: {} });
    });
  });
});
