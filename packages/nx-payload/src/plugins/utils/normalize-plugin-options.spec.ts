import { normalizePluginOptions } from './normalize-plugin-options';

describe('normalizePluginOptions', () => {
  it('should return all defaults when called with no options', () => {
    expect(normalizePluginOptions()).toEqual({
      generateTargetName: 'gen',
      payloadTargetName: 'payload',
      payloadGraphqlTargetName: 'payload-graphql',
      dxMongodbTargetName: 'dx:mongodb',
      dxPostgresTargetName: 'dx:postgres',
      dxStartTargetName: 'dx:start',
      dxStopTargetName: 'dx:stop'
    });
  });

  it('should return all defaults when called with undefined', () => {
    expect(normalizePluginOptions(undefined)).toEqual(normalizePluginOptions());
  });

  it('should override generateTargetName', () => {
    expect(
      normalizePluginOptions({ generateTargetName: 'generate' })
        .generateTargetName
    ).toBe('generate');
  });

  it('should override payloadTargetName', () => {
    expect(
      normalizePluginOptions({ payloadTargetName: 'run-payload' })
        .payloadTargetName
    ).toBe('run-payload');
  });

  it('should override payloadGraphqlTargetName', () => {
    expect(
      normalizePluginOptions({ payloadGraphqlTargetName: 'graphql' })
        .payloadGraphqlTargetName
    ).toBe('graphql');
  });

  it('should override dx target names', () => {
    const result = normalizePluginOptions({
      dxMongodbTargetName: 'start:mongo',
      dxPostgresTargetName: 'start:pg',
      dxStartTargetName: 'start:all',
      dxStopTargetName: 'stop:all'
    });
    expect(result.dxMongodbTargetName).toBe('start:mongo');
    expect(result.dxPostgresTargetName).toBe('start:pg');
    expect(result.dxStartTargetName).toBe('start:all');
    expect(result.dxStopTargetName).toBe('stop:all');
  });

  it('should keep defaults for unspecified options', () => {
    const result = normalizePluginOptions({ generateTargetName: 'generate' });
    expect(result.payloadTargetName).toBe('payload');
    expect(result.dxMongodbTargetName).toBe('dx:mongodb');
  });
});
