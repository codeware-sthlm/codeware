# Integration Tests

## Overview

The integration tests validate that `withInfisical` works correctly with the actual Infisical API.

Tests use **vitest snapshot testing** for better DX and automatic snapshot management.

## Running Tests Locally

### Prerequisites

1. Set up a dedicated Infisical test project following [FIXTURES.md](./FIXTURES.md)
2. Create a `.env.test.local` file with your credentials:

```bash
# Option 1: Universal Auth (recommended)
INFISICAL_TEST_PROJECT_ID=your-project-id
INFISICAL_TEST_CLIENT_ID=your-client-id
INFISICAL_TEST_CLIENT_SECRET=your-client-secret

# Option 2: Service Token
INFISICAL_TEST_PROJECT_ID=your-project-id
INFISICAL_TEST_SERVICE_TOKEN=your-service-token

# Optional: Set site for EU region (default is US)
# INFISICAL_TEST_SITE=eu
```

### Run Tests

```bash
# Run unit tests
pnpm nx test shared-feature-infisical

# Run integration tests
pnpm nx integration-test shared-feature-infisical
```

## Running Tests in CI

See `.github/workflows/ci.yml`
