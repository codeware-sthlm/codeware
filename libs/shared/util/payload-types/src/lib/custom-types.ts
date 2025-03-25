import type { ClientUser, User } from 'payload';

import type {
  User as CollectionUser,
  Config,
  ContentBlock,
  Form,
  FormSubmission,
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

/** Block type */
export type BlockSlug = keyof Config['blocks'];

/** Content block column size */
export type ContentBlockSize = NonNullable<
  NonNullable<NonNullable<ContentBlock['columns']>[number]>['size']
>;

/** Form block type */
export type FormBlockType = NonNullable<
  NonNullable<NonNullable<Form['fields']>[number]>['blockType']
>;

/** Form field type */
export type FormField = NonNullable<NonNullable<Form['fields']>[number]>;

/** Form field for a specific block type */
export type FormFieldForBlockType<T extends FormBlockType> = FormField & {
  blockType: T;
};

/** Form submission data */
export type FormSubmissionData = NonNullable<
  NonNullable<FormSubmission['submissionData']>
>;
