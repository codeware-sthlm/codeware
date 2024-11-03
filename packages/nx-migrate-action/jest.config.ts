export default {
  displayName: 'nx-migrate-action',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],

  coverageDirectory: '../../coverage/packages/nx-migrate-action'
};
