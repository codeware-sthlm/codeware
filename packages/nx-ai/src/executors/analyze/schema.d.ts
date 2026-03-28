export type AnalyzeCategory =
  | 'architecture'
  | 'typing'
  | 'maintainability'
  | 'refactoring';

export type AnalyzeFormat = 'full' | 'summary';

export type AnalyzeSchema = {
  maxFiles?: number;
  includeDeps?: boolean;
  focus?: Array<AnalyzeCategory>;
  model?: string;
  format?: AnalyzeFormat;
  outputFile?: string;
};
