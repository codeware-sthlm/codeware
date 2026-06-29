import { InlineIcon } from '@codeware/shared/ui/primitives';
import type { TenantIconConfig } from '@codeware/shared/util/payload-types';

type TenantIconProps = {
  config: TenantIconConfig | null | undefined;
  size: number;
};

/** Maps a serialisable `TenantIconConfig` from the CMS to an `InlineIcon`. */
export function TenantIcon({ config, size }: TenantIconProps) {
  if (!config) return null;

  if (config.source === 'svg') {
    return <InlineIcon svgCode={config.svgCode} size={size} />;
  }

  return <InlineIcon src={config.fileUrl} size={size} />;
}
