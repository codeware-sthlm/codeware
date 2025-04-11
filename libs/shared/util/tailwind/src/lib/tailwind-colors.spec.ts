import { tailwindColors } from './tailwind-colors';

describe('Tailwind Colors', () => {
  it('should have white and black as direct string values', () => {
    expect(tailwindColors.white).toBe('#fff');
    expect(tailwindColors.black).toBe('#000');
  });

  it('should have color objects with numeric levels', () => {
    // Check a few known color objects
    const colorObjects = Object.entries(tailwindColors).filter(
      ([_, value]) => typeof value === 'object'
    );

    expect(colorObjects.length).toBeGreaterThan(0);

    // Check structure of a color object
    const [colorName, colorObject] = colorObjects[0];
    expect(typeof colorName).toBe('string');
    expect(typeof colorObject).toBe('object');

    // Check that it has numeric levels
    const levels = Object.keys(colorObject);
    expect(levels.every((level) => /^\d+$/.test(level))).toBe(true);
    expect(levels).toContain('50');
    expect(levels).toContain('500');
    expect(levels).toContain('950');
  });

  it('should have valid oklch color values', () => {
    Object.entries(tailwindColors).forEach(([name, value]) => {
      if (typeof value === 'string') {
        // Check direct color values (white, black)
        expect(value).toMatch(/^#[0-9a-f]{3,6}$/i);
      } else {
        // Check color object values
        Object.values(value).forEach((color) => {
          expect(color).toMatch(/^oklch\([^)]+\)$/);
        });
      }
    });
  });

  it('should have consistent color structure', () => {
    const colorObjects = Object.entries(tailwindColors).filter(
      ([_, value]) => typeof value === 'object'
    );

    // Check that all color objects have the same levels
    const expectedLevels = [
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
      '950'
    ];

    colorObjects.forEach(([_, colorObject]) => {
      const levels = Object.keys(colorObject);
      expect(levels).toEqual(expectedLevels);
    });
  });

  it('should have all required color families', () => {
    const expectedColorFamilies = [
      'slate',
      'gray',
      'zinc',
      'neutral',
      'stone',
      'red',
      'orange',
      'amber',
      'yellow',
      'lime',
      'green',
      'emerald',
      'teal',
      'cyan',
      'sky',
      'blue',
      'indigo',
      'violet',
      'purple',
      'fuchsia',
      'pink',
      'rose'
    ];

    const actualColorFamilies = Object.keys(tailwindColors).filter(
      (key) =>
        typeof tailwindColors[key as keyof typeof tailwindColors] === 'object'
    );

    expect(actualColorFamilies).toEqual(
      expect.arrayContaining(expectedColorFamilies)
    );
  });

  it('should have consistent oklch format for all color values', () => {
    const colorObjects = Object.entries(tailwindColors).filter(
      ([_, value]) => typeof value === 'object'
    );

    colorObjects.forEach(([_, colorObject]) => {
      Object.values(colorObject).forEach((color) => {
        // Check oklch format: oklch(L C H)
        const match = color.match(/^oklch\(([^)]+)\)$/);
        expect(match).not.toBeNull();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const values = match![1];
        const [l, c, h] = values.split(' ').map(Number);

        // Check value ranges
        expect(l).toBeGreaterThanOrEqual(0);
        expect(l).toBeLessThanOrEqual(1);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(360);
      });
    });
  });
});
