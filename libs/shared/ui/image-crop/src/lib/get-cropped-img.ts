type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Create a cropped image blob from a source image and a pixel crop area.
 *
 * The output is always scaled to `outputSize × outputSize` so that zoom level
 * affects which region is captured, not how many pixels the output contains.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 256
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get 2D canvas context');
  }

  // When zoomed out, pixelCrop can extend outside the image bounds.
  // Clamp the source rect and map only the intersecting region to the
  // corresponding position in the output canvas (transparent elsewhere).
  const scaleX = outputSize / pixelCrop.width;
  const scaleY = outputSize / pixelCrop.height;

  const srcX = Math.max(0, pixelCrop.x);
  const srcY = Math.max(0, pixelCrop.y);
  const srcRight = Math.min(image.naturalWidth, pixelCrop.x + pixelCrop.width);
  const srcBottom = Math.min(
    image.naturalHeight,
    pixelCrop.y + pixelCrop.height
  );

  if (srcRight > srcX && srcBottom > srcY) {
    const srcW = srcRight - srcX;
    const srcH = srcBottom - srcY;
    const dstX = (srcX - pixelCrop.x) * scaleX;
    const dstY = (srcY - pixelCrop.y) * scaleY;

    ctx.drawImage(
      image,
      srcX,
      srcY,
      srcW,
      srcH,
      dstX,
      dstY,
      srcW * scaleX,
      srcH * scaleY
    );
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob returned null'));
      }
    }, 'image/png');
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
