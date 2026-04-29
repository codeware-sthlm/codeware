const nxPreset = require('@nx/jest/preset').default;
const path = require('path');

module.exports = {
  ...nxPreset,
  collectCoverage: true,
  coverageReporters: ['html', 'json'],
  moduleNameMapper: {
    '^@actions/github$': path.join(
      __dirname,
      '__mocks__/@actions/github.jest.ts'
    )
  },
  passWithNoTests: true
};
