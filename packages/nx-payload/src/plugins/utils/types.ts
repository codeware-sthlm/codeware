export type PayloadPluginOptions = {
  buildTargetName?: string;
  dockerBuildTargetName?: string;
  dockerRunTargetName?: string;
  generateTargetName?: string;
  mongodbTargetName?: string;
  payloadTargetName?: string;
  postgresTargetName?: string;
  serveTargetName?: string;
  startTargetName?: string;
  stopTargetName?: string;
};

export type NormalizedOptions = Required<PayloadPluginOptions>;
