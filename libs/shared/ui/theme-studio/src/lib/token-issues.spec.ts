import type {
  BrokenReference,
  ContrastResult
} from '@codeware/shared/util/color';
import { describe, expect, it } from 'vitest';

import { tokenIssues } from './token-issues';

const pair = (overrides: Partial<ContrastResult> = {}): ContrastResult => ({
  foreground: '--foreground',
  background: '--background',
  usage: 'Body text',
  minimum: 4.5,
  ratio: 2.59,
  passes: false,
  ...overrides
});

const dangling = (
  overrides: Partial<BrokenReference> = {}
): BrokenReference => ({
  token: '--core-surface-invert',
  reference: '--eerie-black',
  reason: 'undefined',
  ...overrides
});

describe('tokenIssues', () => {
  it('says nothing about a theme with nothing wrong', () => {
    expect(tokenIssues([pair({ passes: true, ratio: 12 })], [])).toEqual({});
  });

  // Either end of the pair can be the fix, and nothing here knows which was
  // meant — marking only the text leaves the surface looking innocent
  it('marks both ends of a failing pair', () => {
    const issues = tokenIssues([pair()], []);

    expect(Object.keys(issues).sort()).toEqual([
      '--background',
      '--foreground'
    ]);
    expect(issues['--foreground']).toEqual(['Body text: 2.59:1, needs 4.5:1']);
  });

  it('carries the ratio and the threshold, not just a verdict', () => {
    const issues = tokenIssues(
      [pair({ usage: 'Captions', ratio: 4.34, minimum: 4.5 })],
      []
    );

    expect(issues['--foreground'][0]).toBe('Captions: 4.34:1, needs 4.5:1');
  });

  it('names the token a dangling alias points at', () => {
    const issues = tokenIssues([], [dangling()]);

    expect(issues['--core-surface-invert']).toEqual([
      '--eerie-black is not defined'
    ]);
  });

  it('tells a cycle apart from an absence', () => {
    const issues = tokenIssues(
      [],
      [dangling({ reference: '--core-link', reason: 'cycle' })]
    );

    expect(issues['--core-surface-invert']).toEqual([
      '--core-link refers back to itself'
    ]);
  });

  // A token can be both unreadable and undefined, and hiding one behind the
  // other sends the author back for a second pass
  it('collects every issue a token has', () => {
    const issues = tokenIssues(
      [pair(), pair({ usage: 'Captions', ratio: 3.1 })],
      [dangling({ token: '--foreground', reference: '--nope' })]
    );

    expect(issues['--foreground']).toEqual([
      'Body text: 2.59:1, needs 4.5:1',
      'Captions: 3.10:1, needs 4.5:1',
      '--nope is not defined'
    ]);
  });
});
