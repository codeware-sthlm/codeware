import { notFound } from 'next/navigation';

import { getPage } from '@codeware/app-cms/data-access';
import { RenderPage } from '@codeware/shared/ui/cms-renderer';

import { authenticatedPayload } from '../../../security/authenticated-payload';

interface Props {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const slugString = slug.join('/');

  const payload = await authenticatedPayload();

  const page = await getPage(payload, slugString);

  if (!page) {
    notFound();
  }

  return <RenderPage page={page} />;
}
