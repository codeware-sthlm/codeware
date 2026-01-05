export { applicationGenerator } from './src/generators/application/application';
export { initGenerator } from './src/generators/init/init';
export { presetGenerator } from './src/generators/preset/preset';

export type { AppGeneratorSchema } from './src/generators/application/schema';
export {
  payloadCommonJSVersion,
  payloadESMVersion
} from './src/utils/versions';
