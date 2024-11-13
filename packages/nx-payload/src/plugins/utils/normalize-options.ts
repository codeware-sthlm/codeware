import type { NormalizedOptions, PayloadPluginOptions } from './types';

export const normalizeOptions = (
  options?: PayloadPluginOptions
): NormalizedOptions => ({
  buildTargetName: options?.buildTargetName ?? 'build',
  dockerBuildTargetName: options?.dockerBuildTargetName ?? 'docker-build',
  dockerRunTargetName: options?.dockerRunTargetName ?? 'docker-run',
  generateTargetName: options?.generateTargetName ?? 'gen',
  mongodbTargetName: options?.mongodbTargetName ?? 'mongodb',
  payloadTargetName: options?.payloadTargetName ?? 'payload',
  postgresTargetName: options?.postgresTargetName ?? 'postgres',
  serveTargetName: options?.serveTargetName ?? 'serve',
  startTargetName: options?.startTargetName ?? 'start',
  stopTargetName: options?.stopTargetName ?? 'stop'
});
