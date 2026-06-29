import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { Label } from '@codeware/shared/ui/shadcn/components/label';
import { t } from '@codeware/shared/util/i18n';
import { useCallback, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

import { getCroppedImg } from './get-cropped-img';

type Point = { x: number; y: number };
type Area = { x: number; y: number; width: number; height: number };

export type ImageCropProps = {
  /** Called with the cropped PNG blob when the user confirms. */
  onConfirm: (blob: Blob) => Promise<void> | void;
  onCancel?: () => void;
  /** Show a loading state on the confirm button (e.g. while uploading). */
  isLoading?: boolean;
  /** Error message to display below the cropper. */
  error?: string;
  /** Crop aspect ratio. Defaults to 1 (square). */
  aspect?: number;
  /** Output PNG size in pixels (width = height). Defaults to 256. */
  outputSize?: number;
  /** Locale for UI strings. Defaults to 'en'. */
  locale?: string;
};

export function ImageCrop({
  onConfirm,
  onCancel,
  isLoading = false,
  error,
  aspect = 1,
  outputSize = 256,
  locale = 'en'
}: ImageCropProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropError, setCropError] = useState('');

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropError('');
    };
    reader.readAsDataURL(file);
  }, []);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, outputSize);
      await onConfirm(blob);
    } catch {
      setCropError(t(locale, 'imageCrop.cropError'));
    }
  }, [croppedAreaPixels, imageSrc, locale, onConfirm, outputSize]);

  const displayError = error ?? cropError;

  return (
    <div className="twp space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          {t(locale, 'imageCrop.chooseImage')}
        </Button>
        <span className="text-muted-foreground truncate text-sm">
          {fileName || t(locale, 'imageCrop.noFileChosen')}
        </span>
      </div>

      {imageSrc && (
        <>
          <div className="relative h-80 w-full rounded bg-[#1a1a1a]">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              minZoom={0.1}
              maxZoom={3}
              aspect={aspect}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { borderRadius: 4 } }}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="image-crop-zoom">
              {t(locale, 'imageCrop.zoom')}
            </Label>
            <input
              id="image-crop-zoom"
              type="range"
              min={0.1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      )}

      {displayError && (
        <p className="text-destructive text-sm">{displayError}</p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={!imageSrc || !croppedAreaPixels || isLoading}
        >
          {isLoading
            ? t(locale, 'imageCrop.confirming')
            : t(locale, 'imageCrop.confirm')}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t(locale, 'imageCrop.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
}
