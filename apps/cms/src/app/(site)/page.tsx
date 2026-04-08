import { notFound } from 'next/navigation';

import { getPage } from '@codeware/app-cms/data-access';
import { RenderLandingPage } from '@codeware/shared/ui/cms-renderer';

import { payloadRuntime } from '../../security/payload-runtime';

// TODO: metadata

export default async function SiteIndexPage() {
  const runtime = await payloadRuntime();

  const page = await getPage(
    runtime,
    runtime.tenantConfig?.landingPage.id ?? 0
  );

  if (!page) {
    notFound();
  }

  return <RenderLandingPage landingPage={page} />;
}
