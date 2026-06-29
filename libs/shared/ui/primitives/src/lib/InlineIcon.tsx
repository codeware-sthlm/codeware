type InlineIconProps = {
  size: number;
} & ({ svgCode: string; src?: never } | { src: string; svgCode?: never });

/** Strips known SVG XSS vectors: script elements, event handlers, javascript: hrefs, and foreignObject. */
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    .replace(
      /(?:href|xlink:href)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,
      ''
    );
}

/**
 * Renders a sized icon from either raw SVG markup or an image URL.
 */
export function InlineIcon({ size, svgCode, src }: InlineIconProps) {
  if (svgCode) {
    return (
      <span
        style={{
          display: 'inline-flex',
          width: size,
          height: size,
          verticalAlign: 'middle',
          flexShrink: 0
        }}
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgCode) }}
      />
    );
  }

  return <img src={src} width={size} height={size} alt="" />;
}
