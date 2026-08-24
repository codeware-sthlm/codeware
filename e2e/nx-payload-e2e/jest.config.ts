export default {
  displayName: 'nx-payload-e2e',
  preset: '../../jest.preset.cjs',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'node',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json'
      }
    ]
  },
  // htmlparser2 and its own dependency subtree (a sanitize-html dependency,
  // pulled in transitively via the shared-util-pure/shared-util-node barrels)
  // ship ESM-only, so they need to be transformed too instead of left as
  // untouched node_modules. Matched against pnpm's .pnpm/<pkg>@<version>/
  // store layout, not a flat node_modules/<pkg>/ one.
  transformIgnorePatterns: [
    'node_modules/\\.pnpm/(?!(htmlparser2|entities|dom-serializer|domhandler|domutils|domelementtype)@)'
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/e2e/nx-payload-e2e',
  globalSetup: '../utils/start-local-registry.ts',
  globalTeardown: '../utils/stop-local-registry.ts'
};
