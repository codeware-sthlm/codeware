import { notFound } from 'next/navigation';

import { getPage } from '@codeware/app-cms/data-access';
import { RenderPage } from '@codeware/shared/ui/cms-renderer';

import { payloadRuntime } from '../../../security/payload-runtime';

interface Props {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const slugString = slug.join('/');

  const runtime = await payloadRuntime();

  const page = await getPage(runtime, slugString);

  if (!page) {
    notFound();
  }

  return <RenderPage page={page} />;
}
