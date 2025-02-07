import type { TenantLookup } from '@codeware/shared/util/seed';
import type { Prettify } from '@codeware/shared/util/typesafe';

import type { ArticleData } from './local-api/ensure-article';
import type { PageData } from './local-api/ensure-page';
import type { TenantData } from './local-api/ensure-tenant';
import type { UserData } from './local-api/ensure-user';
export type SeedEnvironment = 'development' | 'preview' | 'production';

type ArticleDataLookup = Prettify<
  Omit<ArticleData, 'content' | 'tenant'> & {
    content: string;
    tenant: Pick<TenantLookup, 'lookupApiKey'>;
  }
>;
type PageDataLookup = Prettify<
  Omit<PageData, 'content' | 'tenant'> & {
    content: string;
    tenant: Pick<TenantLookup, 'lookupApiKey'>;
  }
>;
type UserDataLookup = Prettify<
  Omit<UserData, 'tenants' | 'password'> & {
    tenants: Array<TenantLookup>;
    password: string;
  }
>;

type TenantDataLookup = Prettify<
  Omit<TenantData, 'apiKey'> & { apiKey: string }
>;

// TODO: infer from seedDataSchema when it's refactored
export type SeedData = {
  tenants: Array<TenantDataLookup>;
  users: Array<UserDataLookup>;
  pages: Array<PageDataLookup>;
  articles: Array<ArticleDataLookup>;
};

export type ItemsRange = {
  min: number;
  max: number;
};

export type SeedRules = {
  /**
   * Number of tenants to generate.
   */
  tenants?: ItemsRange;

  /**
   * Number of system users to generate.
   *
   * Does not have any relation to tenants.
   */
  systemUsers?: ItemsRange;

  /**
   * Users with different roles to generate per tenant.
   *
   * Total number of users is the sum of all roles.
   */
  tenantUsers?: {
    /**
     * Number of users with `admin` role to generate per tenant.
     */
    roleAdmin: ItemsRange;

    /**
     * Number of users with `user` role to generate per tenant.
     */
    roleUser: ItemsRange;
  };

  /**
   * Number of articles to generate per tenant.
   */
  tenantArticles?: ItemsRange;

  /**
   * Number of pages to generate per tenant.
   */
  tenantPages?: ItemsRange;
};

export type StaticSeedOptions = {
  /**
   * Generate constant seed data based on this key or `null` to generate random data every time.
   *
   * Defaults to current deployment environment when not provided.
   */
  constantSeedKey?: string | null;

  /**
   * Defines the amount of data to generate.
   */
  seedRules?: SeedRules;
};
