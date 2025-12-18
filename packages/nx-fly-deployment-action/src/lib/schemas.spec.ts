import { join } from 'path';

import { SchemaRegistry, createSchemaTests } from '@codeware/core/testing';

import { ActionInputsSchema } from './schemas/action-inputs.schema';
import { ActionOutputsSchema } from './schemas/action-outputs.schema';
import { DeploymentConfigSchema } from './schemas/deployment-config.schema';

// Register all schemas and fixtures for automated testing
SchemaRegistry.register('action-inputs', ActionInputsSchema, {
  name: 'ActionInputsSchema'
});
SchemaRegistry.register('action-outputs', ActionOutputsSchema, {
  name: 'ActionOutputsSchema'
});
SchemaRegistry.register('deployment-config', DeploymentConfigSchema, {
  name: 'DeploymentConfigSchema'
});

// Run the tests
createSchemaTests({
  schemaDir: join(__dirname, 'schemas'),
  description: 'Fly Deployment Action schema validation',
  snapshots: true
});
