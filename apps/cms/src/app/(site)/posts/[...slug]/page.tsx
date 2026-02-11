import { notFound } from 'next/navigation';

import { getPost } from '@codeware/app-cms/data-access';
import { RenderPost } from '@codeware/shared/ui/cms-renderer';

import { authenticatedPayload } from '../../../../security/authenticated-payload';

interface Props {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function Post({ params }: Props) {
  const { slug } = await params;
  const slugString = slug.join('/');

  const payload = await authenticatedPayload();

  const post = await getPost(payload, slugString);

  if (!post) {
    notFound();
  }

  return <RenderPost post={post} />;
}
