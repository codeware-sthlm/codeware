import { restrictedFontsIn } from './restricted-fonts';

describe('restrictedFontsIn', () => {
  it('reports nothing for an unrestricted recipe', () => {
    expect(
      restrictedFontsIn({ fontBody: 'inter', fontHeading: 'inter' })
    ).toEqual([]);
  });

  // The studio hides the option, but `recipe` is a JSON column — this is what
  // holds when the payload is hand-written
  it('reports a licensed face by label, not id', () => {
    expect(restrictedFontsIn({ fontHeading: 'nasalization' })).toEqual([
      'Nasalization'
    ]);
  });

  it('checks every slot, not just the heading', () => {
    expect(restrictedFontsIn({ fontBody: 'nasalization' })).toEqual([
      'Nasalization'
    ]);
  });

  it('reports a family named twice only once', () => {
    expect(
      restrictedFontsIn({
        fontBody: 'nasalization',
        fontHeading: 'nasalization'
      })
    ).toEqual(['Nasalization']);
  });

  // An unknown id resolves to the default elsewhere; refusing the save over it
  // would report a problem the author cannot act on
  it('ignores a family it does not know', () => {
    expect(restrictedFontsIn({ fontHeading: 'dropped-family' })).toEqual([]);
  });

  it.each([null, undefined, 'text', 42, [] as unknown])(
    'ignores a recipe that is not an object (%p)',
    (value) => {
      expect(restrictedFontsIn(value)).toEqual([]);
    }
  );

  // Mono is templated rather than stored, so a recipe carrying a stale
  // `fontMono` from before that change must not be refused over a value
  // nothing renders
  it('ignores a field the recipe no longer has', () => {
    expect(restrictedFontsIn({ fontMono: 'nasalization' })).toEqual([]);
  });
});
