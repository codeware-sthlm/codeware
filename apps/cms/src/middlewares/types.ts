import type { User } from '@codeware/shared/util/payload-types';
import type { NextFunction, Response } from 'express';
import type { PayloadRequest } from 'payload/types';

export type ExpressMiddleware = (
  req: PayloadRequest<User>,
  res: Response,
  next: NextFunction
) => ReturnType<NextFunction>;
