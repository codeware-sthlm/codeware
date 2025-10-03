## 1.3.1 (2025-10-03)

### ⚙️ Miscellaneous Chores

- **repo:** migrate to eslint esm ([6581a92](https://github.com/codeware-sthlm/codeware/commit/6581a92))

### 🧱 Updated Dependencies

- Updated core to 1.4.2

## 1.3.0 (2025-02-07)

### ✨ Features

- **repo:** migrate nx to 20.4.0 and fix breaking changes ([ba6c6c5](https://github.com/codeware-sthlm/codeware/commit/ba6c6c5))

## 1.2.0 (2025-01-12)

### ✨ Features

- **nx-fly-deployment-action:** destroy apps retroactively ([adc348d](https://github.com/codeware-sthlm/codeware/commit/adc348d))
- **core:** add zod schema test suite and refactor exposed endpoints ([833f440](https://github.com/codeware-sthlm/codeware/commit/833f440))

## 1.1.0 (2024-11-19)

### ✨ Features

- **nx-migrate-action:** add option to skip tests completely ([10f4bb4f](https://github.com/codeware-sthlm/codeware/commit/10f4bb4f))
- **nx-migrate-action:** check commit signature and print details ([208ad717](https://github.com/codeware-sthlm/codeware/commit/208ad717))

# 1.0.0 (2024-11-18)

### ✨ Features

- **nx-migrate-action:** delete branch when pull request is closed ([b08d0af5](https://github.com/codeware-sthlm/codeware/commit/b08d0af5))
- **nx-migrate-action:** add github action to perform nx migrations ([08a93a78](https://github.com/codeware-sthlm/codeware/commit/08a93a78))

### 🐞 Bug Fixes

- **nx-migrate-action:** enable auto-merge via graphql ([1a0d3bf7](https://github.com/codeware-sthlm/codeware/commit/1a0d3bf7))
- **nx-migrate-action:** run any e2e projects that exists ([db76c0bc](https://github.com/codeware-sthlm/codeware/commit/db76c0bc))
- **nx-migrate-action:** no need to check pr comments before adding a new ([c9f33b47](https://github.com/codeware-sthlm/codeware/commit/c9f33b47))
- **nx-migrate-action:** skip migration when pr with branch exists ([523d650f](https://github.com/codeware-sthlm/codeware/commit/523d650f))

### ⚡️ Performance Improvements

- **nx-migrate-action:** improve performance of name email regex ([2db1a050](https://github.com/codeware-sthlm/codeware/commit/2db1a050))

### 🧹 Code Refactoring

- ⚠️  **repo:** migrate nx-plugins repo to this repo ([556bf360](https://github.com/codeware-sthlm/codeware/commit/556bf360))

### 🤖 Continuous Integration

- **repo:** use codeware bot token in nx migrate workflow ([7a9b440a](https://github.com/codeware-sthlm/codeware/commit/7a9b440a))
- **repo:** fix nx migrate workflow permissions to trigger pr checks ([323b8334](https://github.com/codeware-sthlm/codeware/commit/323b8334))

### ⚠️  Breaking Changes

- **repo:** all packages from nx-plugins repository are moved including release management and other important features