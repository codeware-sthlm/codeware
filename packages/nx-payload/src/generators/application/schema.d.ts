import { type Schema as NextSchema } from '@nx/next/src/generators/application/schema';

export type AppGeneratorSchema = NextSchema &
  // `name` is required by this plugin
  Required<Pick<NextSchema, 'name'>> & {
    database?: 'mongodb' | 'postgres';
  };
