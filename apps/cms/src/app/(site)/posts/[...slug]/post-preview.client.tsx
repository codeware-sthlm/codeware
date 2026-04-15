'use client';

import { RenderPost } from '@codeware/shared/ui/cms-renderer';
import type { Post } from '@codeware/shared/util/payload-types';

import { LivePreview } from '../../../../components/LivePreview.client';

type Props = {
  post: Post;
};

export function PostPreview({ post }: Props) {
  return (
    <LivePreview initialData={post} depth={1}>
      {(data) => <RenderPost post={data} />}
    </LivePreview>
  );
}
