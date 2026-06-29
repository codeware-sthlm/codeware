import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize an SVG string to prevent XSS attacks.
 *
 * Strips disallowed tags (script, style, foreignObject, etc.) and attributes
 * (event handlers, href with javascript: scheme, etc.) while preserving
 * valid SVG structure and presentation attributes.
 */
export const sanitizeSvg = (svg: string): string =>
  sanitizeHtml(svg, {
    allowedTags: [
      'svg',
      'g',
      'defs',
      'title',
      'desc',
      'use',
      'symbol',
      'path',
      'circle',
      'ellipse',
      'rect',
      'line',
      'polyline',
      'polygon',
      'text',
      'tspan',
      'clippath',
      'mask',
      'lineargradient',
      'radialgradient',
      'stop'
    ],
    allowedAttributes: {
      '*': ['id', 'class'],
      svg: [
        'xmlns',
        'viewbox',
        'width',
        'height',
        'fill',
        'stroke',
        'stroke-width',
        'role',
        'aria-label',
        'aria-hidden'
      ],
      g: ['fill', 'stroke', 'stroke-width', 'opacity', 'transform'],
      path: [
        'd',
        'fill',
        'stroke',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'fill-rule',
        'clip-rule',
        'opacity',
        'transform'
      ],
      circle: [
        'cx',
        'cy',
        'r',
        'fill',
        'stroke',
        'stroke-width',
        'opacity',
        'transform'
      ],
      ellipse: [
        'cx',
        'cy',
        'rx',
        'ry',
        'fill',
        'stroke',
        'stroke-width',
        'opacity',
        'transform'
      ],
      rect: [
        'x',
        'y',
        'width',
        'height',
        'rx',
        'ry',
        'fill',
        'stroke',
        'stroke-width',
        'opacity',
        'transform'
      ],
      line: [
        'x1',
        'y1',
        'x2',
        'y2',
        'stroke',
        'stroke-width',
        'opacity',
        'transform'
      ],
      polyline: [
        'points',
        'fill',
        'stroke',
        'stroke-width',
        'opacity',
        'transform'
      ],
      polygon: [
        'points',
        'fill',
        'stroke',
        'stroke-width',
        'opacity',
        'transform'
      ],
      text: [
        'x',
        'y',
        'fill',
        'font-size',
        'font-family',
        'text-anchor',
        'transform'
      ],
      tspan: ['x', 'y', 'dx', 'dy'],
      clippath: ['clippathunits'],
      mask: ['x', 'y', 'width', 'height', 'maskunits'],
      lineargradient: [
        'id',
        'x1',
        'y1',
        'x2',
        'y2',
        'gradientunits',
        'gradienttransform'
      ],
      radialgradient: ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientunits'],
      stop: ['offset', 'stop-color', 'stop-opacity'],
      // href intentionally omitted from <use> — xlink:href dropped automatically
      use: ['x', 'y', 'width', 'height']
    },
    allowedSchemes: [],
    disallowedTagsMode: 'discard'
  });
