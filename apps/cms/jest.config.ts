export default {
  displayName: 'cms',
  preset: '../../jest.preset.cjs',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/next/babel'] }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/cms',
  // A Next build copies the whole source tree — specs included — into
  // `.next/standalone`. Jest discovers those duplicates and runs them from
  // there, where relative paths the spec assumed (e.g. sibling `libs/`)
  // don't resolve, so they fail for a reason that has nothing to do with the
  // code under test.
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/']
};
