## 0.11.1 (2024-11-05)

### 🐞 Bug Fixes

- **nx-payload:** serve target should detect file changes ([d416850](https://github.com/codeware-sthlm/nx-plugins/commit/d416850))

## 0.11.0 (2024-10-25)

### ✨ Features

- update nx to major version 20 ([60849d4](https://github.com/codeware-sthlm/nx-plugins/commit/60849d4))

### 🐞 Bug Fixes

- 📦 bump dependency react-i18next to v15 ([ad33852](https://github.com/codeware-sthlm/nx-plugins/commit/ad33852))
- 📦 bump dependency react-router-dom to v6 ([b0085dc](https://github.com/codeware-sthlm/nx-plugins/commit/b0085dc))
- 📦 bump dependency react to v18.3.1 ([3eaf13a](https://github.com/codeware-sthlm/nx-plugins/commit/3eaf13a))
- **nx-payload:** add migrations ([2e9f52e](https://github.com/codeware-sthlm/nx-plugins/commit/2e9f52e))
- **nx-payload:** only install direct payload packages to user workspace ([de23fe8](https://github.com/codeware-sthlm/nx-plugins/commit/de23fe8))

### ⚙️ Miscellaneous Chores

- verify user is logged in to npm before local publish ([51793ad](https://github.com/codeware-sthlm/nx-plugins/commit/51793ad))

## 0.10.0 (2024-10-22)

### ✨ Features

- plugin require nx 19 versions ([24c9d4a](https://github.com/codeware-sthlm/nx-plugins/commit/24c9d4a))

### 🐞 Bug Fixes

- **nx-payload:** run e2e for a specific package manager and fix docker tests ([05d0ca9](https://github.com/codeware-sthlm/nx-plugins/commit/05d0ca9))

- **nx-payload:** add payload peers as plugin dependencies ([9580317](https://github.com/codeware-sthlm/nx-plugins/commit/9580317))

- **nx-payload:** prevent local app env file from beeing ignored ([9e6b621](https://github.com/codeware-sthlm/nx-plugins/commit/9e6b621))

### 🧹 Code Refactoring

- convert to flat eslint configuration ([ced33ee](https://github.com/codeware-sthlm/nx-plugins/commit/ced33ee))

- **nx-payload:** dockerfile should be npm only ([6972760](https://github.com/codeware-sthlm/nx-plugins/commit/6972760))

## 0.9.5 (2024-08-11)

### 🐞 Bug Fixes

- **nx-payload:** undefined paths do not need to be cleared during build ([1df4002](https://github.com/codeware-sthlm/nx-plugins/commit/1df4002))

### 📄 Documentation

- **nx-payload:** update version ([c9ec970](https://github.com/codeware-sthlm/nx-plugins/commit/c9ec970))

## 0.9.4 (2024-06-27)

### ✅ Tests

- **nx-payload:** add test for serve target ([7a5e85e](https://github.com/codeware-sthlm/nx-plugins/commit/7a5e85e))

## 0.9.3 (2024-05-30)

### ⚙️ Miscellaneous Chores

- **nx-payload:** prepare for bun support ([81ed10a](https://github.com/codeware-sthlm/nx-plugins/commit/81ed10a))

### ✅ Tests

- **nx-payload:** prevent test issues by skipping format ([179982f](https://github.com/codeware-sthlm/nx-plugins/commit/179982f))

## 0.9.2 (2024-05-27)

### 🐞 Bug Fixes

- **nx-payload:** fix serve target for generated applications ([970867d](https://github.com/codeware-sthlm/nx-plugins/commit/970867d))

## 0.9.1 (2024-05-12)

### ⚙️ Miscellaneous Chores

- fix otp code for publish from release script ([42cf1a3](https://github.com/codeware-sthlm/nx-plugins/commit/42cf1a3))

## 0.9.0 (2024-05-12)

### ✨ Features

- **nx-payload:** infer docker build and run targets ([1a16998](https://github.com/codeware-sthlm/nx-plugins/commit/1a16998))

## 0.8.0 (2024-05-06)

### ✨ Features

- **nx-payload:** all targets can be inferred ([736590d](https://github.com/codeware-sthlm/nx-plugins/commit/736590d))

### 🐞 Bug Fixes

- **nx-payload:** should respect NX_ADD_PLUGINS to opt out of inference ([b81411b](https://github.com/codeware-sthlm/nx-plugins/commit/b81411b))

## 0.7.1 (2024-04-10)

### ⚙️ Miscellaneous Chores

- convert release management to use nx release ([1ab99fd](https://github.com/codeware-sthlm/nx-plugins/commit/1ab99fd))

# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [0.7.0](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.6.1...nx-payload-0.7.0) (2024-04-05)

### ✨ Features

- **nx-payload:** implement build executor ([5632758](https://github.com/codeware-sthlm/nx-plugins/commit/56327588c86166ffee1e442f0faed6854d007261))
- **nx-payload:** implement payload executor ([d9d1653](https://github.com/codeware-sthlm/nx-plugins/commit/d9d1653eeb448d1c112830ab52d1f3f7ab4676e2))
- **nx-payload:** support project crystal to infer tasks ([6337c12](https://github.com/codeware-sthlm/nx-plugins/commit/6337c12d8672fb75a5ac9a6cf66318809e3f9acb))

### 📄 Documentation

- **nx-payload:** bump version compatibility ([e819c16](https://github.com/codeware-sthlm/nx-plugins/commit/e819c164b143f38eac0fb4a5fbfecf610515a3e7))

### 🤖 Continuous Integration

- fix nx migrate package lookup ([2a6e8b4](https://github.com/codeware-sthlm/nx-plugins/commit/2a6e8b41ff9307b6b84ee580a069585c6f5b1152))

## [0.6.1](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.6.0...nx-payload-0.6.1) (2024-03-18)

### 🧹 Code Refactoring

- **nx-payload:** workaround for nx run-commands env bug ([a6a3529](https://github.com/codeware-sthlm/nx-plugins/commit/a6a35299f9a58a21f948d64fe42c49e780dae576))

## [0.6.0](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.5.0...nx-payload-0.6.0) (2024-03-13)

### ✨ Features

- **nx-payload:** add support for postgres ([b678a63](https://github.com/codeware-sthlm/nx-plugins/commit/b678a6306b28cbbad7a2f334779fe3f8acf69f9e))

## [0.5.0](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.4.0...nx-payload-0.5.0) (2024-02-09)

## [0.4.0](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.3.0...nx-payload-0.4.0) (2024-02-05)

## [0.3.0](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.2.1...nx-payload-0.3.0) (2024-01-31)

### ✨ Features

- **nx-payload:** run application in development mode ([9e8d709](https://github.com/codeware-sthlm/nx-plugins/commit/9e8d709a3908ef2c9360708a256b78ffe36390a6))

## [0.2.1](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.2.0...nx-payload-0.2.1) (2024-01-28)

### ⚙️ Miscellaneous Chores

- **workspace:** update to node 20 ([2251317](https://github.com/codeware-sthlm/nx-plugins/commit/22513170791fce69fbd142bd5cb98f87ddb172de))

### 🤖 Continuous Integration

- **workspace:** renovate should have build type ([12f82a9](https://github.com/codeware-sthlm/nx-plugins/commit/12f82a9b726a81de4793f82b72b7453d8de94ae7))

# [0.2.0](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.1.4...nx-payload-0.2.0) (2024-01-24)

## [0.1.4](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.1.3...nx-payload-0.1.4) (2024-01-14)

### Bug Fixes

- set name and directory properly when using preset ([adef13c](https://github.com/codeware-sthlm/nx-plugins/commit/adef13c3e81a32f0ce71ec26950e86b5b6a79abe))

## [0.1.3](https://github.com/codeware-sthlm/nx-plugins/compare/nx-payload-0.1.2...nx-payload-0.1.3) (2024-01-10)

### Bug Fixes

- **nx-payload:** setup network in docker compose and persist mongo db ([dcb92f1](https://github.com/codeware-sthlm/nx-plugins/commit/dcb92f1d496310c8c60f966cc4209b14567f2a81))

## 0.1.0 (2024-01-07)

### Features

- **workspace:** implement semver and improve workflows ([2bee60b](https://github.com/codeware-sthlm/nx-plugins/commit/2bee60bfd1e1e03ca83725a76e32a80be13ef7f0))