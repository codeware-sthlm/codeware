import type { GenerateImageName, UploadConfig } from 'payload';

/** Custom image name */
const imageName: GenerateImageName = ({ extension, originalName, sizeName }) =>
  `${originalName}-${sizeName}.${extension}`;

/**
 * The image pipeline shared by every upload collection.
 *
 * Kept in one place because `ImageBlock` builds its responsive `<picture>` from
 * the size names — a collection with different sizes would render a different
 * set of sources for the same markup.
 */
export const imageUploadConfig = {
  // Uploaded image is converted to a backward compatible format known by all browsers.
  // This image should be used as the default image in a `<picture />` element.
  formatOptions: { format: 'jpeg' },
  resizeOptions: { width: 1600 },
  imageSizes: [
    {
      name: 'thumbnail',
      width: 300,
      height: 300,
      formatOptions: { format: 'webp' },
      generateImageName: imageName
    },
    {
      name: 'small',
      width: 600,
      formatOptions: { format: 'webp' },
      generateImageName: imageName
    },
    {
      name: 'medium',
      width: 900,
      formatOptions: { format: 'webp' },
      generateImageName: imageName
    },
    {
      name: 'large',
      width: 1400,
      formatOptions: { format: 'webp' },
      generateImageName: imageName
    },
    {
      name: 'meta',
      width: 1200,
      height: 630,
      crop: 'center',
      fit: 'inside',
      formatOptions: { format: 'webp' },
      generateImageName: imageName
    }
  ],
  adminThumbnail: 'thumbnail',
  displayPreview: true,
  focalPoint: true
} satisfies Partial<UploadConfig>;
