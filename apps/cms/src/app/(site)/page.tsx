import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { getPage } from '@codeware/app-cms/data-access';

import { payloadRuntime } from '../../security/payload-runtime';

import { LandingPagePreview } from './landing-page-preview.client';

// TODO: metadata

export default async function SiteIndexPage() {
  const { isEnabled: draft } = await draftMode();
  const runtime = await payloadRuntime();

  const page = await getPage(
    runtime,
    runtime.tenantConfig?.landingPage.id ?? 0,
    { draft }
  );

  if (!page) {
    notFound();
  }

  return <LandingPagePreview landingPage={page} />;
}
