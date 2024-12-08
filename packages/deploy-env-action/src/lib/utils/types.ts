import { z } from 'zod';

import { ActionInputsSchema } from '../schemas/action-inputs.schema';
import { EnvironmentConfigSchema } from '../schemas/environment-config.schema';

export type Environment = 'preview' | 'production';

export type ActionInputs = z.infer<typeof ActionInputsSchema>;

export type ActionOutputs = {
  /** Target environment for deployment */
  environment: Environment | '';
};

export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;
