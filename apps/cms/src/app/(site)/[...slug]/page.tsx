import { notFound } from 'next/navigation';

import { getPageData } from '@codeware/app-cms/data-access';

import { payloadRuntime } from '../../../security/payload-runtime';

import { PagePreview } from './page-preview.client';

interface Props {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const slugString = slug.join('/');

  const runtime = await payloadRuntime();
  const data = await getPageData(runtime, slugString);

  if (!data) {
    notFound();
  }

  return <PagePreview page={data.page} blocksData={data.blocksData} />;
}
