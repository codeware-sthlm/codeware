import type { NextFunction, Response } from 'express';
import type { PayloadRequest } from 'payload/types';

import type { Config, User } from '../generated/payload-types';

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type CollectionWithoutPayload = {
  [key in keyof Config['collections'] as key extends `payload${string}`
    ? never
    : key]: Config['collections'][key];
};

export type CollectionSlug = keyof CollectionWithoutPayload;

export type CollectionType = CollectionWithoutPayload[CollectionSlug];

export type ExpressMiddleware = (
  req: PayloadRequest<User>,
  res: Response,
  next: NextFunction
) => ReturnType<NextFunction>;

export type TenantRole = NonNullable<User['tenants']>[number]['role'];
