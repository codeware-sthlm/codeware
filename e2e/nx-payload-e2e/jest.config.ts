module.exports = {
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
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/e2e/nx-payload-e2e',
  globalSetup: '../utils/start-local-registry.ts',
  globalTeardown: '../utils/stop-local-registry.ts'
};
