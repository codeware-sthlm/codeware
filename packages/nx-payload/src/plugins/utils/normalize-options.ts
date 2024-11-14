import type { NormalizedOptions, PayloadPluginOptions } from './types';

export const normalizeOptions = (
  options?: PayloadPluginOptions
): NormalizedOptions => ({
  buildTargetName: options?.buildTargetName ?? 'build',
  generateTargetName: options?.generateTargetName ?? 'gen',
  payloadTargetName: options?.payloadTargetName ?? 'payload',
  serveTargetName: options?.serveTargetName ?? 'serve',
  dxDockerBuildTargetName:
    options?.dxDockerBuildTargetName ?? 'dx:docker-build',
  dxDockerRunTargetName: options?.dxDockerRunTargetName ?? 'dx:docker-run',
  dxMongodbTargetName: options?.dxMongodbTargetName ?? 'dx:mongodb',
  dxPostgresTargetName: options?.dxPostgresTargetName ?? 'dx:postgres',
  dxStartTargetName: options?.dxStartTargetName ?? 'dx:start',
  dxStopTargetName: options?.dxStopTargetName ?? 'dx:stop'
});
