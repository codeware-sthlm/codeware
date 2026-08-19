import { describe, expect, it } from 'vitest';

import {
  type BuildFacts,
  type IntegrationFacts,
  summarizeBuild,
  summarizeIntegrations
} from './platform-status';

const facts = (
  overrides: Partial<IntegrationFacts> = {}
): IntegrationFacts => ({
  deployEnv: 'production',
  email: 'sendgrid',
  sentryOrg: 'codeware',
  storageBucket: 'cdwr-media',
  infisicalAuth: 'universal-auth',
  ...overrides
});

describe('summarizeIntegrations', () => {
  it('is green when production has all three', () => {
    expect(summarizeIntegrations(facts())).toEqual({
      tone: 'ok',
      kind: 'all-configured'
    });
  });

  it('treats mail with nowhere to go as an error', () => {
    expect(summarizeIntegrations(facts({ email: null }))).toEqual({
      tone: 'error',
      kind: 'email-missing'
    });
  });

  it('treats production mail into Ethereal as an error, not a warning', () => {
    // A send that "succeeds" into a throwaway inbox looks healthy from every
    // other angle, which is exactly why it has to shout here
    expect(summarizeIntegrations(facts({ email: 'ethereal' }))).toEqual({
      tone: 'error',
      kind: 'email-not-delivered'
    });
  });

  it('catches production smtp pointed at a local catcher', () => {
    expect(
      summarizeIntegrations(facts({ email: 'smtp', emailHost: 'localhost' }))
    ).toEqual({ tone: 'error', kind: 'email-not-delivered' });
  });

  it('accepts production smtp pointed at a real relay', () => {
    expect(
      summarizeIntegrations(
        facts({ email: 'smtp', emailHost: 'smtp.example.com' })
      )
    ).toEqual({ tone: 'ok', kind: 'all-configured' });
  });

  it('counts how many of the supporting three are missing', () => {
    expect(
      summarizeIntegrations(facts({ sentryOrg: null, storageBucket: null }))
    ).toEqual({ tone: 'warning', kind: 'incomplete', count: 2 });
  });

  it('warns when secrets are unreachable, which strands Fly behind them', () => {
    expect(summarizeIntegrations(facts({ infisicalAuth: null }))).toEqual({
      tone: 'warning',
      kind: 'incomplete',
      count: 1
    });
  });

  it('stays quiet outside production, where a test inbox is correct', () => {
    // Otherwise every preview would sit permanently amber until the colour
    // stopped meaning anything
    expect(
      summarizeIntegrations(
        facts({ deployEnv: 'preview', email: 'ethereal', storageBucket: null })
      )
    ).toEqual({ tone: 'neutral', kind: 'not-production' });
  });
});

const build = (overrides: Partial<BuildFacts> = {}): BuildFacts => ({
  version: '1.12.0',
  sha: 'ab12cd3',
  buildTime: '2026-08-19T21:00:00Z',
  deployEnv: 'production',
  appMode: 'host',
  ...overrides
});

describe('summarizeBuild', () => {
  it('is informational when the build is stamped', () => {
    expect(summarizeBuild(build())).toEqual({
      tone: 'neutral',
      kind: 'informational'
    });
  });

  it('warns when production is running an untraceable build', () => {
    expect(summarizeBuild(build({ sha: '' }))).toEqual({
      tone: 'warning',
      kind: 'unstamped'
    });
    expect(summarizeBuild(build({ buildTime: '' }))).toEqual({
      tone: 'warning',
      kind: 'unstamped'
    });
  });

  it('says nothing about an unstamped local build, which is normal', () => {
    expect(
      summarizeBuild(
        build({ deployEnv: 'development', sha: '', buildTime: '' })
      )
    ).toEqual({ tone: 'neutral', kind: 'informational' });
  });
});
