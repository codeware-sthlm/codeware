export type PayloadPluginOptions = {
  generateTargetName?: string;
  payloadTargetName?: string;
  payloadGraphqlTargetName?: string;
  dxMongodbTargetName?: string;
  dxPostgresTargetName?: string;
  dxStartTargetName?: string;
  dxStopTargetName?: string;
};

type NormalizedOptions = Required<PayloadPluginOptions>;

/**
 * Apply default values to plugin options that are not set.
 */
export const normalizePluginOptions = (
  options?: PayloadPluginOptions
): NormalizedOptions => ({
  generateTargetName: options?.generateTargetName ?? 'gen',
  payloadTargetName: options?.payloadTargetName ?? 'payload',
  payloadGraphqlTargetName:
    options?.payloadGraphqlTargetName ?? 'payload-graphql',
  dxMongodbTargetName: options?.dxMongodbTargetName ?? 'dx:mongodb',
  dxPostgresTargetName: options?.dxPostgresTargetName ?? 'dx:postgres',
  dxStartTargetName: options?.dxStartTargetName ?? 'dx:start',
  dxStopTargetName: options?.dxStopTargetName ?? 'dx:stop'
});
