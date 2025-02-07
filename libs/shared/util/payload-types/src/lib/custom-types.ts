import type { Config, Tenant, User } from './payload-types';

type CollectionWithoutPayload = {
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

export type TenantRole = NonNullable<User['tenants']>[number]['role'];
