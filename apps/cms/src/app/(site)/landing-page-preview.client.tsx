'use client';

import { RenderLandingPage } from '@codeware/shared/ui/cms-renderer';
import type { Page } from '@codeware/shared/util/payload-types';

import { LivePreview } from '../../components/LivePreview.client';

type Props = {
  landingPage: Page;
};

export function LandingPagePreview({ landingPage }: Props) {
  return (
    <LivePreview initialData={landingPage}>
      {(data) => <RenderLandingPage landingPage={data} />}
    </LivePreview>
  );
}
