import type { Payload } from 'payload';

import type { Env } from '../../env-resolver/env.schema';
import type { Prettify, TenantRole } from '../../utils/custom-types';
import type { ArticleData } from '../utils/ensure-article';
import type { PageData } from '../utils/ensure-page';
import type { TenantData } from '../utils/ensure-tenant';
import type { UserData } from '../utils/ensure-user';

export type TenantLookup = { lookupName: string; role: TenantRole };

type ArticleDataLookup = Prettify<
  Omit<ArticleData, 'tenant'> & { tenant: Pick<TenantLookup, 'lookupName'> }
>;
type PageDataLookup = Prettify<
  Omit<PageData, 'tenant'> & { tenant: Pick<TenantLookup, 'lookupName'> }
>;
type UserDataLookup = Prettify<
  Omit<UserData, 'tenants'> & { tenants: Array<TenantLookup> }
>;

export type SeedData = {
  tenants: Array<TenantData>;
  users: Array<UserDataLookup>;
  pages: Array<PageDataLookup>;
  articles: Array<ArticleDataLookup>;
};

export type Seed = (args?: { payload: Payload; env: Env }) => SeedData | null;

export type SeedAsync = (args: {
  payload: Payload;
  env: Env;
}) => Promise<SeedData | null>;
