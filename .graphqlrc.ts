import type { IGraphQLConfig } from 'graphql-config';

/**
 * Enable GraphQL schema validation for the project.
 *
 * Add `GraphQL` comment to the queries to enable schema validation.
 */
const config: IGraphQLConfig = {
  schema: 'node_modules/@octokit/graphql-schema/schema.graphql',
  documents: ['src/**/*.ts', 'src/**/*.tsx']
};

export default config;
