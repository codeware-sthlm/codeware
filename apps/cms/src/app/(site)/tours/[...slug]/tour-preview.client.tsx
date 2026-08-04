'use client';

import { RenderTour } from '@codeware/shared/ui/cms-renderer';
import type { Tour } from '@codeware/shared/util/payload-types';

import { LivePreview } from '../../../../components/LivePreview.client';

type Props = {
  tour: Tour;
};

export function TourPreview({ tour }: Props) {
  return (
    <LivePreview initialData={tour} depth={1}>
      {(data) => <RenderTour tour={data} />}
    </LivePreview>
  );
}
