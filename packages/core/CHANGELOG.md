## 1.2.0 (2025-01-12)

### ✨ Features

- **nx-fly-deployment-action:** destroy apps retroactively ([adc348d](https://github.com/codeware-sthlm/codeware/commit/adc348d))
- **core:** add functions for infisical and improve schema validations ([8f22c66](https://github.com/codeware-sthlm/codeware/commit/8f22c66))
- **core:** infisical secrets management support ([94ceb1c](https://github.com/codeware-sthlm/codeware/commit/94ceb1c))
- **core:** add zod schema test suite and refactor exposed endpoints ([833f440](https://github.com/codeware-sthlm/codeware/commit/833f440))

### 🐞 Bug Fixes

- **deps:** update dependencies ([4002e5c](https://github.com/codeware-sthlm/codeware/commit/4002e5c))
- **core:** sync dependencies ([4cdbc95](https://github.com/codeware-sthlm/codeware/commit/4cdbc95))
- **deps:** update dependencies ([208824c](https://github.com/codeware-sthlm/codeware/commit/208824c))
- **core:** release workaround must stage changes to package.json ([8d0a73e](https://github.com/codeware-sthlm/codeware/commit/8d0a73e))

### ⚙️ Miscellaneous Chores

- **core:** use esm in core package ([fa3f4ea](https://github.com/codeware-sthlm/codeware/commit/fa3f4ea))

## 1.1.0 (2024-11-19)

### ✨ Features

- **nx-migrate-action:** check commit signature and print details ([208ad717](https://github.com/codeware-sthlm/codeware/commit/208ad717))

### 🐞 Bug Fixes

- **core:** add workaround for nx release changing workspace package.json ([4b5cab52](https://github.com/codeware-sthlm/codeware/commit/4b5cab52))

# 1.0.0 (2024-11-18)

### ✨ Features

- **nx-migrate-action:** add github action to perform nx migrations ([08a93a78](https://github.com/codeware-sthlm/codeware/commit/08a93a78))

### 🐞 Bug Fixes

- **nx-migrate-action:** enable auto-merge via graphql ([1a0d3bf7](https://github.com/codeware-sthlm/codeware/commit/1a0d3bf7))

### 🧹 Code Refactoring

- ⚠️  **repo:** migrate nx-plugins repo to this repo ([556bf360](https://github.com/codeware-sthlm/codeware/commit/556bf360))

### ⚠️  Breaking Changes

- **repo:** all packages from nx-plugins repository are moved including release management and other important features