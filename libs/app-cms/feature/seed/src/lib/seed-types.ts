import type {
  CategoryLookup,
  SeedOptions,
  TagLookup,
  TenantLookup,
  UserLookup
} from '@codeware/shared/util/seed';
import type { Prettify } from '@codeware/shared/util/typesafe';

import type { CategoryData } from './local-api/ensure-category';
import type { MediaData } from './local-api/ensure-media';
import type { PageData } from './local-api/ensure-page';
import type { PostData } from './local-api/ensure-post';
import type { TagData } from './local-api/ensure-tag';
import type { TenantData } from './local-api/ensure-tenant';
import type { UserData } from './local-api/ensure-user';
export type SeedEnvironment = 'development' | 'preview' | 'production';

type CategoryDataLookup = Prettify<
  Omit<CategoryData, 'slug' | 'tenant'> & {
    slug: string;
    tenant: Pick<TenantLookup, 'lookupApiKey'>;
  }
>;
type MediaDataLookup = Prettify<
  Omit<MediaData, 'tags' | 'tenant'> & {
    tags: Array<TagLookup>;
    tenant: Pick<TenantLookup, 'lookupApiKey'>;
  }
>;
type PostDataLookup = Prettify<
  Omit<PostData, 'authors' | 'categories' | 'content' | 'tenant'> & {
    authors: Array<UserLookup>;
    categories: Array<CategoryLookup>;
    content: string; // Markdown content
    tenant: Pick<TenantLookup, 'lookupApiKey'>;
  }
>;
type PageDataLookup = Prettify<
  Omit<PageData, 'layout' | 'tenant'> & {
    layoutContent: string; // Markdown content
    tenant: Pick<TenantLookup, 'lookupApiKey'>;
  }
>;
type TagDataLookup = Prettify<
  Omit<TagData, 'brand' | 'slug' | 'tenant'> & {
    brand: NonNullable<TagData['brand']>;
    slug: string;
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
  categories: Array<CategoryDataLookup>;
  media: Array<MediaDataLookup>;
  pages: Array<PageDataLookup>;
  posts: Array<PostDataLookup>;
  tags: Array<TagDataLookup>;
  tenants: Array<TenantDataLookup>;
  users: Array<UserDataLookup>;
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
   * Number of categories to generate per tenant.
   */
  tenantCategories?: ItemsRange;

  /**
   * Number of tags to generate per tenant.
   */
  tenantTags?: ItemsRange;

  /**
   * Number of posts to generate per tenant.
   */
  tenantPosts?: ItemsRange;

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
} & Pick<SeedOptions, 'remoteDataUrl'>;
