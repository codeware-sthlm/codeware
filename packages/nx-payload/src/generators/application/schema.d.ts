import { type Schema as NodeSchema } from '@nx/node/src/generators/application/schema';

export type AppGeneratorSchema = NodeSchema &
  Required<Pick<NodeSchema, 'name'>> & {
    database?: 'mongodb' | 'postgres';
  };
