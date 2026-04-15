'use client';

import { useLivePreview } from '@payloadcms/live-preview-react';

import { usePayload } from '@codeware/shared/ui/cms-renderer';

interface LivePreviewProps<T extends Record<string, any>> {
  initialData: T;
  depth?: number;
  children: (data: T) => React.ReactNode;
}

/**
 * Generic client component for Payload live preview.
 *
 * Subscribes to live preview updates from the CMS admin panel and passes
 * the current data (updated as-you-type) to the render function.
 * Falls back to `initialData` when not in preview mode.
 *
 * @example
 * ```tsx
 * <LivePreview initialData={page}>
 *   {(data) => <RenderPage page={data} blocksData={blocksData} />}
 * </LivePreview>
 * ```
 */
export function LivePreview<T extends Record<string, any>>({
  initialData,
  depth = 2,
  children
}: LivePreviewProps<T>) {
  const { payloadUrl } = usePayload();
  const { data } = useLivePreview<T>({
    initialData,
    serverURL: payloadUrl,
    depth
  });

  return <>{children(data)}</>;
}
