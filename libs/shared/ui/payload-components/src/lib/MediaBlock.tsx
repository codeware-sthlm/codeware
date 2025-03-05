import { Image, Video } from '@codeware/shared/ui/react-components';
import type { MediaBlock as MediaBlockProps } from '@codeware/shared/util/payload-types';
import React from 'react';

import type { RenderBlocksExtraProps } from './render-blocks.type';
import { RichText } from './RichText';

type Props = MediaBlockProps &
  Pick<RenderBlocksExtraProps, 'apiUrl' | 'enableProse' | 'isDark'>;

export const MediaBlock: React.FC<Props> = (props) => {
  const { apiUrl, enableProse, isDark, media } = props;

  const caption = media && typeof media === 'object' ? media.caption : '';
  const isImage =
    typeof media === 'object' && media?.mimeType?.includes('image');
  const isVideo =
    typeof media === 'object' && media?.mimeType?.includes('video');

  if (!isImage && !isVideo) {
    return null;
  }

  const alt = media.alt ?? '';
  const src = `${apiUrl}${media.url ?? ''}`;

  return (
    <div>
      {isImage && <Image alt={alt} src={src} />}
      {isVideo && <Video src={src} />}
      {caption && (
        <div className="mt-2">
          <RichText
            apiUrl={apiUrl}
            data={caption}
            enableProse={enableProse}
            isDark={isDark}
          />
        </div>
      )}
    </div>
  );
};
