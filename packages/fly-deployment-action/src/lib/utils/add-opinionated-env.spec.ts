import { describe, expect, it } from 'vitest';

import { addOpinionatedEnv } from './add-opinionated-env';

describe('addOpinionatedEnv', () => {
  it('should add APP_NAME, FLY_URL and PR_NUMBER without tenant', () => {
    const result = addOpinionatedEnv({
      appName: 'my-app',
      prNumber: undefined,
      tenantId: undefined
    });

    expect(result).toEqual({
      APP_NAME: 'my-app',
      FLY_URL: 'https://my-app.fly.dev',
      PR_NUMBER: ''
    });
  });

  it('should add APP_NAME, FLY_URL, PR_NUMBER and TENANT_ID with tenant', () => {
    const result = addOpinionatedEnv({
      appName: 'my-app',
      prNumber: 123,
      tenantId: 'demo'
    });

    expect(result).toEqual({
      APP_NAME: 'my-app',
      FLY_URL: 'https://my-app.fly.dev',
      PR_NUMBER: '123',
      TENANT_ID: 'demo'
    });
  });

  it('should merge with existing env variables', () => {
    const result = addOpinionatedEnv(
      {
        appName: 'my-app',
        prNumber: 123,
        tenantId: 'demo'
      },
      {
        DATABASE_URL: 'postgres://...',
        API_KEY: 'secret'
      }
    );

    expect(result).toEqual({
      DATABASE_URL: 'postgres://...',
      API_KEY: 'secret',
      APP_NAME: 'my-app',
      FLY_URL: 'https://my-app.fly.dev',
      PR_NUMBER: '123',
      TENANT_ID: 'demo'
    });
  });

  it('should NOT add TENANT_ID for reserved tenant name "_default"', () => {
    const result = addOpinionatedEnv({
      appName: 'cms',
      prNumber: undefined,
      tenantId: '_default'
    });

    expect(result).toEqual({
      APP_NAME: 'cms',
      FLY_URL: 'https://cms.fly.dev',
      PR_NUMBER: ''
    });
    expect(result).not.toHaveProperty('TENANT_ID');
  });

  it('should NOT add TENANT_ID for "_default" even with PR number', () => {
    const result = addOpinionatedEnv({
      appName: 'cms',
      prNumber: 456,
      tenantId: '_default'
    });

    expect(result).toEqual({
      APP_NAME: 'cms',
      FLY_URL: 'https://cms.fly.dev',
      PR_NUMBER: '456'
    });
    expect(result).not.toHaveProperty('TENANT_ID');
  });

  it('should merge "_default" tenant with existing env without TENANT_ID', () => {
    const result = addOpinionatedEnv(
      {
        appName: 'cms',
        prNumber: 123,
        tenantId: '_default'
      },
      {
        DATABASE_URL: 'postgres://...',
        PAYLOAD_SECRET_KEY: 'secret'
      }
    );

    expect(result).toEqual({
      DATABASE_URL: 'postgres://...',
      PAYLOAD_SECRET_KEY: 'secret',
      APP_NAME: 'cms',
      FLY_URL: 'https://cms.fly.dev',
      PR_NUMBER: '123'
    });
    expect(result).not.toHaveProperty('TENANT_ID');
  });

  it('should treat other tenant names normally (not "_default")', () => {
    const result = addOpinionatedEnv({
      appName: 'cms',
      prNumber: undefined,
      tenantId: 'acme'
    });

    expect(result).toEqual({
      APP_NAME: 'cms',
      FLY_URL: 'https://cms.fly.dev',
      PR_NUMBER: '',
      TENANT_ID: 'acme'
    });
  });

  it('should generate correct FLY_URL for tenant-specific app names', () => {
    const result = addOpinionatedEnv({
      appName: 'my-app-pr-123-demo',
      prNumber: 123,
      tenantId: 'demo'
    });

    expect(result).toEqual({
      APP_NAME: 'my-app-pr-123-demo',
      FLY_URL: 'https://my-app-pr-123-demo.fly.dev',
      PR_NUMBER: '123',
      TENANT_ID: 'demo'
    });
  });
});
