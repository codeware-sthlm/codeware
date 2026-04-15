'use client';

import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { usePayload } from '@codeware/shared/ui/cms-renderer';

/**
 * Client component for server-side live preview.
 * Listens for save events from Payload CMS and triggers a route refresh.
 *
 * Add this component to your layout or page to enable live preview updates when content is saved in the CMS.
 */
export const RefreshRouteOnSave: React.FC = () => {
  const { payloadUrl } = usePayload();
  const router = useRouter();

  return (
    <PayloadLivePreview
      refresh={() => router.refresh()}
      serverURL={payloadUrl}
    />
  );
};
