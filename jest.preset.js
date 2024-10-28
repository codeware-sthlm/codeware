const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    '^@actions/github$': '__mocks__/@actions/github.ts'
  }
};
