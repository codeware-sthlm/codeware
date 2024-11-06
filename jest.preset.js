const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  coverageReporters: ['html', 'json'],
  moduleNameMapper: {
    '^@actions/github$': '__mocks__/@actions/github.jest.ts'
  }
};
