import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

import type { Config } from 'payload/config';
import ts from 'typescript';

import { ConfigExtractor } from './config-extractor.class';

type Metrics = {
  /** Time in milliseconds */
  totalTime: number;
  /** Time in milliseconds */
  fileReadTime: number;
  /** Time in milliseconds */
  parsingTime: number;
  /** Time in milliseconds */
  analysisTime: number;
};

type FormattedMetrics = {
  total: string;
  fileRead: string;
  parsing: string;
  analysis: string;
};

type ConfigExtractResult = {
  config?: Partial<Config>;
  error?: string;
  metrics?: Metrics;
  formattedMetrics?: FormattedMetrics;
};

/**
 * The config paths to be able to extract
 * when you don't want to extract the complete config object.
 *
 * Defined using dot notation.
 *
 * #### Note about this workaround!
 * There's a great type `Paths` from `type-fest` library
 * that can provide all properties in dot notation from any object type.
 * The problem is that `Config` is too complex which makes TypeScript return `any`.
 *
 * **Make sure the paths are included in tests at some level!**
 */
export const configPaths = [
  // Currently only for testing purposes
  'admin',
  'admin.autoLogin',
  'email',
  'email.fromAddress',
  // Support dynamic `gen` target
  'graphQL.disable'
] as const;

export type ConfigPropertyPath = (typeof configPaths)[number];

/**
 * Extract the Payload config object from the given directory.
 *
 * The extraction is done by parsing the TypeScript source file,
 * which comes with some limitations by design:
 *
 * - Only the config object is extracted, not the collections, hooks, etc.
 * - The config object must be exported using `export default buildConfig()`
 * - Functions are replaced with their string representation in the result
 * - The config object is assumed to be a valid Payload config when returned,
 *   due to the file being type-safe by design
 *
 * @param appDirectory - Path to the Payload config file folder
 * @param properties Extract only a subset of the config properties
 * @returns The extracted Payload config object with status and metrics
 */
export function extractPayloadConfig(
  appDirectory: string,
  properties?: ConfigPropertyPath | Array<ConfigPropertyPath>
): ConfigExtractResult {
  const metrics: Metrics = {
    totalTime: 0,
    fileReadTime: 0,
    parsingTime: 0,
    analysisTime: 0
  };

  const startTime = performance.now();

  try {
    const fileReadStart = performance.now();
    const configPath = path.resolve(appDirectory, 'payload.config.ts');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file '${configPath}' does not exist`);
    }
    metrics.fileReadTime = performance.now() - fileReadStart;

    const parseStart = performance.now();
    const program = ts.createProgram([configPath], {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS
    });
    const sourceFile = program.getSourceFile(configPath);
    if (!sourceFile) {
      throw new Error('Could not get source file');
    }
    metrics.parsingTime = performance.now() - parseStart;

    const analysisStart = performance.now();
    const extractor = new ConfigExtractor(
      sourceFile,
      program.getTypeChecker(),
      properties
    );
    const config = extractor.extract();

    const missingProps = extractor.getMissingProperties();
    if (missingProps.length > 0) {
      console.warn(
        'Warning: Some requested properties were not found:',
        missingProps
      );
    }

    metrics.analysisTime = performance.now() - analysisStart;

    if (!config) {
      return {
        error: 'Could not find a valid Payload config object',
        metrics,
        formattedMetrics: formatMetrics(metrics)
      };
    }

    metrics.totalTime = performance.now() - startTime;
    return {
      config,
      metrics,
      formattedMetrics: formatMetrics(metrics)
    };
  } catch (err) {
    metrics.totalTime = performance.now() - startTime;
    return {
      error: err instanceof Error ? err.message : 'Unknown error occurred',
      metrics,
      formattedMetrics: formatMetrics(metrics)
    };
  }
}

function formatMetrics(metrics: Metrics): FormattedMetrics {
  const format = (ms: number): string => {
    if (ms < 0.01) return '<0.01ms';
    if (ms < 1) return `${ms.toFixed(2)}ms`;
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return {
    total: format(metrics.totalTime),
    fileRead: format(metrics.fileReadTime),
    parsing: format(metrics.parsingTime),
    analysis: format(metrics.analysisTime)
  };
}
