import { describe, expect, it } from 'vitest';

import type { AppTenantsMap } from './fetch-app-tenants';
import { filterByDeployRules } from './filter-by-deploy-rules';

describe('filterByDeployRules', () => {
  const mockAppTenants: AppTenantsMap = {
    web: [
      { tenant: 'demo', env: { URL: 'demo.com' } },
      { tenant: 'acme', env: { URL: 'acme.com' } },
      { tenant: 'globex', env: { URL: 'globex.com' } }
    ],
    cms: [{ tenant: 'demo', secrets: { KEY: 'value' } }],
    api: []
  };

  describe('wildcard rules', () => {
    it('should keep all apps and tenants with wildcard rules', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: '*',
        tenants: '*'
      });

      expect(result).toEqual(mockAppTenants);
    });
  });

  describe('app filtering', () => {
    it('should filter apps by specific names', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: 'web,cms',
        tenants: '*'
      });

      expect(result).toEqual({
        web: mockAppTenants['web'],
        cms: mockAppTenants['cms']
      });
      expect(result['api']).toBeUndefined();
    });

    it('should return empty object when no apps match', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: 'nonexistent',
        tenants: '*'
      });

      expect(result).toEqual({});
    });

    it('should handle single app name', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: 'web',
        tenants: '*'
      });

      expect(result).toEqual({
        web: mockAppTenants['web']
      });
    });
  });

  describe('tenant filtering', () => {
    it('should filter tenants by specific names', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: '*',
        tenants: 'demo'
      });

      expect(result).toEqual({
        web: [{ tenant: 'demo', env: { URL: 'demo.com' } }],
        cms: [{ tenant: 'demo', secrets: { KEY: 'value' } }],
        api: []
      });
    });

    it('should filter multiple tenants', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: '*',
        tenants: 'demo,globex'
      });

      expect(result).toEqual({
        web: [
          { tenant: 'demo', env: { URL: 'demo.com' } },
          { tenant: 'globex', env: { URL: 'globex.com' } }
        ],
        cms: [{ tenant: 'demo', secrets: { KEY: 'value' } }],
        api: []
      });
    });

    it('should preserve empty tenant arrays', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: '*',
        tenants: 'demo'
      });

      expect(result['api']).toEqual([]);
    });
  });

  describe('combined filtering', () => {
    it('should filter both apps and tenants', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: 'web',
        tenants: 'demo,acme'
      });

      expect(result).toEqual({
        web: [
          { tenant: 'demo', env: { URL: 'demo.com' } },
          { tenant: 'acme', env: { URL: 'acme.com' } }
        ]
      });
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace in rules', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: ' web , cms ',
        tenants: ' demo , acme '
      });

      expect(result).toEqual({
        web: [
          { tenant: 'demo', env: { URL: 'demo.com' } },
          { tenant: 'acme', env: { URL: 'acme.com' } }
        ],
        cms: [{ tenant: 'demo', secrets: { KEY: 'value' } }]
      });
    });

    it('should handle empty app tenant map', () => {
      const result = filterByDeployRules(
        {},
        {
          apps: '*',
          tenants: '*'
        }
      );

      expect(result).toEqual({});
    });

    it('should filter out apps with no matching tenants', () => {
      const result = filterByDeployRules(mockAppTenants, {
        apps: '*',
        tenants: 'nonexistent'
      });

      expect(result).toEqual({
        web: [],
        cms: [],
        api: []
      });
    });
  });
});
