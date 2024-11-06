import { type Schema as ExpressSchema } from '@nx/express/src/generators/application/schema';

export type AppGeneratorSchema =
  // Not supporting `projectNameAndRootFormat='derived'`, which is deprecated and removed in Nx 18.
  // Hence `directory` is required.
  Required<Pick<ExpressSchema, 'directory' | 'name'>> &
    // Optional generator properties
    Partial<
      Pick<
        ExpressSchema,
        | 'linter'
        | 'projectNameAndRootFormat'
        | 'skipFormat'
        | 'tags'
        | 'unitTestRunner'
      >
    > & {
      database?: 'mongodb' | 'postgres';
      // Custom property to set `e2eTestRunner`
      skipE2e?: boolean;
    };
