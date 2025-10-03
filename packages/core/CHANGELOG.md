## 1.4.2 (2025-10-03)

### ⚙️ Miscellaneous Chores

- **deps:** update weekly dependencies ([113a8d9](https://github.com/codeware-sthlm/codeware/commit/113a8d9))
- **deps:** update weekly dependencies ([6efe16e](https://github.com/codeware-sthlm/codeware/commit/6efe16e))
- **deps:** update weekly dependencies ([00a340c](https://github.com/codeware-sthlm/codeware/commit/00a340c))
- **repo:** defaults to bundler resolution ([4fd1a61](https://github.com/codeware-sthlm/codeware/commit/4fd1a61))
- **repo:** fix vite name conflicts ([624d9eb](https://github.com/codeware-sthlm/codeware/commit/624d9eb))
- **repo:** migrate to eslint esm ([6581a92](https://github.com/codeware-sthlm/codeware/commit/6581a92))

## 1.4.1 (2025-02-15)

### 🐞 Bug Fixes

- **core:** improve windows compatibility ([46057818f](https://github.com/codeware-sthlm/codeware/commit/46057818f))
- **deps:** update dependencies ([1f7cafad9](https://github.com/codeware-sthlm/codeware/commit/1f7cafad9))

### ⚙️ Miscellaneous Chores

- **repo:** change to esm files for vite ([b93f286ab](https://github.com/codeware-sthlm/codeware/commit/b93f286ab))

## 1.4.0 (2025-02-07)

### ✨ Features

- **repo:** migrate nx to 20.4.0 and fix breaking changes ([ba6c6c5](https://github.com/codeware-sthlm/codeware/commit/ba6c6c5))

### 🧹 Code Refactoring

- **core:** move secrets and some zod utilities to internal projects ([0b801c5](https://github.com/codeware-sthlm/codeware/commit/0b801c5))

## 1.3.0 (2025-01-30)

### ✨ Features

- **cms:** improved seed process ([bd4af3414](https://github.com/codeware-sthlm/codeware/commit/bd4af3414))
- **core:** provide custom spawn with interactive prompt support ([ba12f323b](https://github.com/codeware-sthlm/codeware/commit/ba12f323b))
- **cms:** initial multi-tenant support ([3c629f8bc](https://github.com/codeware-sthlm/codeware/commit/3c629f8bc))
- **core:** withEnvVars support both object and props level ([32181d07c](https://github.com/codeware-sthlm/codeware/commit/32181d07c))

### 🐞 Bug Fixes

- **core:** pty is needed to properly spawn interactive ([9a3844bc4](https://github.com/codeware-sthlm/codeware/commit/9a3844bc4))
- **core:** detect package manager before publish release ([db2eb28d5](https://github.com/codeware-sthlm/codeware/commit/db2eb28d5))

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