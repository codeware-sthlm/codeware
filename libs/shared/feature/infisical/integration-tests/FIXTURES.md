# Test Fixtures for Infisical Integration Tests

This document describes the expected structure of the Infisical test project that the integration tests run against.

## Required Infisical Test Project Setup

### Project Configuration

1. **Project Name**: `codeware-test` (or any name)
2. **Environments**:
   - `development` (required)
   - `preview` (optional but recommended)
   - `production` (optional but recommended)

### Required Folder Structure

The test project should have the following folder structure in the `development` environment:

```
/ (root)
├── apps/
│   ├── cms/
│   │   └── shared/
│   └── client/
|       └── import cms/shared
├── empty/
└── tenants/
    ├── demo/
    ├── company/
    └── customer/
```

### Suggested Secrets

#### Root Level (`/`)

- `SHARED_API_URL` - Example: `https://api.example.com`
- `COMMON_SECRET` - Any test value
- `EMPTY_SECRET` - No value (`EMPTY`)

#### `/empty` folder

No secrets

#### `/apps` folder

- `APP_NAME` - Example: `Codeware Test`
- `APP_VERSION` - Example: `1.0.0`

#### `/apps/cms` folder

- `PORT` - Example: `3000`
- `DATABASE_URL` - Example: `postgresql://postgres:postgres@localhost:5432/cms`
- `LOG_LEVEL` - Example: `debug`

#### `/apps/cms/shared` folder

- `PAYLOAD_URL` - Example: `http://localhost:3000`; add metadata key `shared`
- `SIGNATURE_SECRET` - Any secure random string; add metadata key `shared`

#### `/apps/client` folder

Import `/apps/cms/shared` folder

- `API_HOST` - Example: `client.localhost`
- `API_KEY` - Example: `crypto-development`

#### `/tenants/demo` folder

- `TENANT_NAME` - Example: `Demo Tenant`
- `TENANT_ID` - Example: `demo-001`
- `FEATURES` - Example: `basic,analytics`

#### `/tenants/company` folder

- `TENANT_NAME` - Example: `Company Tenant`
- `TENANT_ID` - Example: `company-001`
- `FEATURES` - Example: `premium,analytics,custom-domain`

#### `/tenants/customer` folder

- `TENANT_NAME` - Example: `Customer Tenant`
- `TENANT_ID` - Example: `customer-001`
- `FEATURES` - Example: `standard,analytics`

### Multi-Tenant Architecture

The tenant structure supports multi-tenant applications where each tenant has isolated configuration. The integration tests will:

- Verify folder-based organization works correctly
- Test recursive secret fetching within tenant folders
- Validate path filtering for specific tenants
- Ensure nested folder structures are properly handled## Authentication Credentials

### Option 1: Universal Auth

Create a Machine Identity (Universal Auth):

1. Go to Project Settings → Access Control → Machine Identities
2. Create new Machine Identity
3. Name it something like `github-actions-integration-tests`
4. Grant read access to all folders (`/**`) in `development`, `preview`, and `production`
5. Save the Client ID and Client Secret

Set as GitHub Secrets:

- `INFISICAL_TEST_PROJECT_ID` - The project ID
- `INFISICAL_TEST_CLIENT_ID` - The machine identity client ID
- `INFISICAL_TEST_CLIENT_SECRET` - The machine identity client secret

### Option 2: Service Token

Alternatively, create a Service Token:

1. Go to Project Settings → Service Tokens
2. Create new Service Token
3. Grant access to required environments and paths like in option 1
4. Save the token

Set as GitHub Secret:

- `INFISICAL_TEST_PROJECT_ID` - The project ID
- `INFISICAL_TEST_SERVICE_TOKEN` - The service token

## Initial Snapshot Generation

The first time you run the integration tests, snapshots will be created and stored in `integration-tests/__snapshots__/` and should be committed to version control.

## Updating Snapshots

If you intentionally change the test data in Infisical:

1. Delete the relevant snapshot files
2. Run the integration tests again
3. Review the new snapshots
4. Commit the updated snapshots

## Security Notes

⚠️ **Important**:

- Snapshots include secret values, so make sure NOT to use a project with sensitive data
- Use test/dummy data only in the test project
- Never use production credentials
- Keep the test project isolated from production data
