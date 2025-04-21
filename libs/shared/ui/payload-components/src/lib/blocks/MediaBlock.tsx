import { Image, type Size, Video } from '@codeware/shared/ui/react-components';
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
  const mediaSizes = Object.values(media.sizes ?? {});

  // Convert media sizes to responsive image sizes
  let sizeCount = 0;
  const sizes = mediaSizes.reduce((acc, { mimeType, url, width }) => {
    sizeCount++;
    if (!url) {
      return acc;
    }
    const size = {
      src: `${payloadUrl}${url}`,
      width: width ?? undefined,
      mimeType: mimeType ?? undefined,
      ignoreMedia: false
    };
    acc.push(size);
    // Append a copy of the last size with ignored media query
    // to ensure a modern image format is used as fallback
    // before the component fallback image
    if (sizeCount === mediaSizes.length) {
      acc.push({ ...size, ignoreMedia: true });
    }
    return acc;
  }, [] as Array<Size>);

  return (
    <div>
      {isImage && (
        <Image
          sizes={sizes}
          src={src}
          alt={alt}
          height={media.height ?? undefined}
          width={media.width ?? undefined}
        />
      )}
      {isVideo && <Video src={src} />}
      {caption && (
        <div className="mt-2">
          <RichText data={caption} />
        </div>
      )}
    </div>
  );
};
