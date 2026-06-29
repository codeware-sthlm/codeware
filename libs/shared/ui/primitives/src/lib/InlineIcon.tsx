type InlineIconProps = {
  size: number;
} & ({ svgCode: string; src?: never } | { src: string; svgCode?: never });

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
        dangerouslySetInnerHTML={{ __html: svgCode }}
      />
    );
  }

  return <img src={src} width={size} height={size} alt="" />;
}
