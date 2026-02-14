import { Image, type Size } from '@codeware/shared/ui/image';
import type { ImageBlock as ImageBlockProps } from '@codeware/shared/util/payload-types';
import React from 'react';

import { usePayload } from '../providers/PayloadProvider';

import { RichText } from './RichText';

type Props = ImageBlockProps;

/**
 * Renders image block with optional caption and alt text
 * with responsive image sizes.
 */
export const ImageBlock: React.FC<Props> = ({ media }) => {
  const { payloadUrl } = usePayload();

  if (!media || typeof media !== 'object') {
    return null;
  }

  const { alt, caption, sizes = {}, url = '' } = media;

  const src = url?.startsWith('http') ? url : `${payloadUrl}/${url}`;
  const mediaSizes = Object.values(sizes);

  // Convert media sizes to responsive image sizes
  let sizeCount = 0;
  const responsiveSizes = mediaSizes.reduce((acc, { mimeType, url, width }) => {
    sizeCount++;
    if (!url) {
      return acc;
    }
    const size = {
      src,
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
    <>
      <Image
        sizes={responsiveSizes}
        src={src}
        alt={alt}
        height={media.height ?? undefined}
        width={media.width ?? undefined}
      />
      {caption && (
        <div className="mt-2">
          <RichText data={caption} />
        </div>
      )}
    </>
  );
};
