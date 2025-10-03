## 0.3.2 (2025-10-03)

### ⚙️ Miscellaneous Chores

- **repo:** fix vite name conflicts ([624d9eb](https://github.com/codeware-sthlm/codeware/commit/624d9eb))
- **repo:** migrate to eslint esm ([6581a92](https://github.com/codeware-sthlm/codeware/commit/6581a92))

### 🧱 Updated Dependencies

- Updated fly-node to 0.2.2
- Updated core to 1.4.2

## 0.3.1 (2025-02-15)

### ⚙️ Miscellaneous Chores

- **repo:** change to esm files for vite ([b93f286ab](https://github.com/codeware-sthlm/codeware/commit/b93f286ab))

## 0.3.0 (2025-02-07)

### ✨ Features

- **repo:** migrate nx to 20.4.0 and fix breaking changes ([ba6c6c5](https://github.com/codeware-sthlm/codeware/commit/ba6c6c5))

### 🐞 Bug Fixes

- **web:** remove dependency to payload and related packages ([0a7a63e](https://github.com/codeware-sthlm/codeware/commit/0a7a63e))

## 0.2.0 (2025-01-30)

### ✨ Features

- **fly-node:** optional opt out depot builder on deploy ([5bd15a0e1](https://github.com/codeware-sthlm/codeware/commit/5bd15a0e1))
- **core:** withEnvVars support both object and props level ([32181d07c](https://github.com/codeware-sthlm/codeware/commit/32181d07c))

### 🐞 Bug Fixes

- **fly-node:** use spawn pty for interactive prompts ([3998bc606](https://github.com/codeware-sthlm/codeware/commit/3998bc606))

## 0.1.0 (2025-01-12)

### ✨ Features

- **nx-fly-deployment-action:** destroy apps retroactively ([adc348d](https://github.com/codeware-sthlm/codeware/commit/adc348d))
- **nx-fly-deployment-action:** support postgres cluster on app level ([ab2c975](https://github.com/codeware-sthlm/codeware/commit/ab2c975))
- **nx-fly-deployment-action:** add support for env and secrets ([3b205f1](https://github.com/codeware-sthlm/codeware/commit/3b205f1))
- **nx-fly-deployment-action:** add automated fly deployments package ([2ccb786](https://github.com/codeware-sthlm/codeware/commit/2ccb786))

### 🐞 Bug Fixes

- **nx-fly-deployment-action:** deprecated apps filter returned too much ([35c8631](https://github.com/codeware-sthlm/codeware/commit/35c8631))
- **nx-payload:** nx version must be strict ([9a361cf](https://github.com/codeware-sthlm/codeware/commit/9a361cf))

### 🔙 Revert Code Changes

- **nx-fly-deployment-action:** fix version typo ([7dbdf5c](https://github.com/codeware-sthlm/codeware/commit/7dbdf5c))