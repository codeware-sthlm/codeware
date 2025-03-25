import { Image, Video } from '@codeware/shared/ui/react-components';
import type { MediaBlock as MediaBlockProps } from '@codeware/shared/util/payload-types';
import React from 'react';

import { usePayload } from '../providers/PayloadProvider';

import { RichText } from './RichText';

type Props = MediaBlockProps;

export const MediaBlock: React.FC<Props> = ({ media }) => {
  const { payloadUrl } = usePayload();

  const caption = media && typeof media === 'object' ? media.caption : '';
  const isImage =
    typeof media === 'object' && media?.mimeType?.includes('image');
  const isVideo =
    typeof media === 'object' && media?.mimeType?.includes('video');

  if (!isImage && !isVideo) {
    return null;
  }

  const alt = media.alt ?? '';
  const src = `${payloadUrl}${media.url ?? ''}`;

  return (
    <div>
      {isImage && <Image alt={alt} src={src} />}
      {isVideo && <Video src={src} />}
      {caption && (
        <div className="mt-2">
          <RichText data={caption} />
        </div>
      )}
    </div>
  );
};
