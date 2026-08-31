import { customThemeCss, isValidTokenValue } from '@codeware/shared/theme';
import {
  DEFAULT_RECIPE,
  NEUTRAL_FAMILIES,
  buildThemeTokens
} from '@codeware/shared/util/color';
import { describe, expect, it } from 'vitest';

import { previewCss, previewScope } from './preview-css';

const declarationsOf = (css: string, id: string) => {
  const block = new RegExp(`#${id}\\{([^}]*)\\}`).exec(css);
  return block ? block[1].split(';').filter(Boolean) : [];
};

describe('previewCss', () => {
  const { light, dark } = buildThemeTokens(DEFAULT_RECIPE);
  const ids = previewScope('studio');
  const css = previewCss('studio', light, dark);

  it('scopes both schemes to their own pane', () => {
    expect(css).toContain(`#${ids.light}{`);
    expect(css).toContain(`#${ids.dark}{`);
  });

  // On a real site both blocks land on the same element and dark cascades over
  // light; two side-by-side panes share no element, so dark has to carry both
  it('gives the dark pane the full map, not just the overrides', () => {
    expect(declarationsOf(css, ids.dark).length).toBe(
      declarationsOf(css, ids.light).length
    );
    expect(Object.keys(dark).length).toBeLessThan(Object.keys(light).length);
  });

  it('lets dark win where it differs', () => {
    const darkDeclarations = declarationsOf(css, ids.dark);

    expect(darkDeclarations).toContain(`--background:${dark['--background']}`);
    expect(darkDeclarations).not.toContain(
      `--background:${light['--background']}`
    );
  });

  it('inherits from light where dark says nothing', () => {
    expect(dark['--body']).toBeUndefined();
    expect(declarationsOf(css, ids.dark)).toContain(
      `--body:${light['--body']}`
    );
  });

  // An author's override reaches this the same way it reaches the live site
  it('drops a value that could break out of the block', () => {
    const css = previewCss(
      'studio',
      { ...light, '--evil': 'red}body{display:none' },
      dark
    );

    expect(isValidTokenValue('red}body{display:none')).toBe(false);
    expect(css).not.toContain('display:none');
  });
});

// `type:util` cannot reach `type:theme`, so the generator and the injection it
// feeds can only be checked together from here
describe('generated themes reach the page intact', () => {
  it.each(NEUTRAL_FAMILIES)('serialises a %s-based theme', (baseFamily) => {
    const { light, dark } = buildThemeTokens({
      ...DEFAULT_RECIPE,
      baseFamily,
      brandFamily: 'teal'
    });

    const css = customThemeCss([
      { slug: 'ocean', tokensLight: light, tokensDark: dark }
    ]);
    const block = /\[data-theme='ocean'\]\{([^}]*)\}/.exec(css);

    expect(block).not.toBeNull();
    // Every token survives the whitelist — none silently dropped
    expect(block?.[1].split(';').length).toBe(Object.keys(light).length);
    expect(css).toContain("[data-theme='ocean'].dark{");
  });
});
