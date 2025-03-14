import type { ClientUser, User } from 'payload';

import type {
  User as CollectionUser,
  Config,
  ContentBlock,
  Tenant,
  TenantsArrayField
} from './payload-types';

export type CollectionWithoutPayload = {
  [key in keyof Config['collections'] as key extends `payload${string}`
    ? never
    : key]: Config['collections'][key];
};

type CollectionWithTenantField = {
  [key in keyof CollectionWithoutPayload as CollectionWithoutPayload[key] extends {
    tenant?: (number | null) | Tenant;
  }
    ? key
    : never]: CollectionWithoutPayload[key];
};

/** Collection slugs */
export type CollectionSlug = keyof CollectionWithoutPayload;

/** Collection types */
export type CollectionType = CollectionWithoutPayload[CollectionSlug];

/** Collection slugs that have a `tenant` field */
export type CollectionTenantScopedSlug = keyof CollectionWithTenantField;

/** Collection types that have a `tenant` field */
export type CollectionTenantScopedType =
  CollectionWithTenantField[CollectionTenantScopedSlug];

export type TenantRole = NonNullable<TenantsArrayField>[number]['role'];

/** User type that can be any of the user types defined by Payload */
export type UserAny = ClientUser | CollectionUser | User;

/** Content block column size */
export type ContentBlockSize = NonNullable<
  NonNullable<NonNullable<ContentBlock['columns']>[number]>['size']
>;
