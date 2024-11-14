export type PayloadPluginOptions = {
  buildTargetName?: string;
  generateTargetName?: string;
  payloadTargetName?: string;
  serveTargetName?: string;
  dxDockerBuildTargetName?: string;
  dxDockerRunTargetName?: string;
  dxMongodbTargetName?: string;
  dxPostgresTargetName?: string;
  dxStartTargetName?: string;
  dxStopTargetName?: string;
};

export type NormalizedOptions = Required<PayloadPluginOptions>;
