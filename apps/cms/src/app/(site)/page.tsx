import { getSiteSettings } from '@codeware/app-cms/data-access';
import { RenderLandingPage } from '@codeware/shared/ui/cms-renderer';

import { authenticatedPayload } from '../../security/authenticated-payload';

// TODO: metadata

export default async function SiteIndexPage() {
  const payload = await authenticatedPayload();

  const settings = await getSiteSettings(payload);
  const landingPage = settings?.landingPage;

  return <RenderLandingPage landingPage={landingPage} />;
}
