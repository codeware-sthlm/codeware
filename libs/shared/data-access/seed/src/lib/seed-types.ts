import type { Prettify } from '@codeware/shared/util/payload';
import { z } from 'zod';

import type { ArticleData } from './local-api/ensure-article';
import type { PageData } from './local-api/ensure-page';
import type { TenantData } from './local-api/ensure-tenant';
import type { UserData } from './local-api/ensure-user';

export type SeedEnvironment = 'development' | 'preview' | 'production';

// TODO: import roles
const TenantLookupSchema = z.object({
  lookupApiKey: z.string(),
  role: z.enum(['admin', 'user'])
});

/**
 * Lookup tenant by its API key since it should be unique.
 */
export type TenantLookup = z.infer<typeof TenantLookupSchema>;

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

// TODO: define more schemas for other data types to reuse
export const SeedDataSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      author: z.string(),
      content: z.string({ description: 'Markdown content' }),
      tenant: TenantLookupSchema.pick({ lookupApiKey: true })
    })
  ),

  pages: z.array(
    z.object({
      name: z.string(),
      header: z.string(),
      content: z.string({ description: 'Markdown content' }),
      slug: z.string(),
      tenant: TenantLookupSchema.pick({ lookupApiKey: true })
    })
  ),
  users: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      email: z.string(),
      password: z.string(),
      role: z.enum(['system-user', 'user']),
      tenants: z.array(TenantLookupSchema)
    })
  ),
  tenants: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      hosts: z.array(z.string()),
      apiKey: z.string()
    })
  )
});

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
