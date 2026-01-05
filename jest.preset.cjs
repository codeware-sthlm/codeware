const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  collectCoverage: true,
  coverageReporters: ['html', 'json'],
  moduleNameMapper: {
    '^@actions/github$': '__mocks__/@actions/github.jest.ts'
  },
  passWithNoTests: true
};
