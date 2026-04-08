import { notFound } from 'next/navigation';

import { getPost } from '@codeware/app-cms/data-access';
import { RenderPost } from '@codeware/shared/ui/cms-renderer';

import { payloadRuntime } from '../../../../security/payload-runtime';

interface Props {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function Post({ params }: Props) {
  const { slug } = await params;
  const slugString = slug.join('/');

  const runtime = await payloadRuntime();

  const post = await getPost(runtime, slugString);

  if (!post) {
    notFound();
  }

  return <RenderPost post={post} />;
}
