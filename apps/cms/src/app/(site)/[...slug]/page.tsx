import { notFound } from 'next/navigation';

import { getPage } from '@codeware/app-cms/data-access';
import { Container } from '@codeware/app-cms/ui/web';
import { RenderBlocks } from '@codeware/shared/ui/cms-renderer';

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

  return (
    <Container className="mt-16 sm:mt-32">
      {page.header && (
        <header className="max-w-2xl">
          <h1 className="text-core-headline text-4xl font-bold tracking-tight sm:text-5xl">
            {page.header}
          </h1>
        </header>
      )}
      <article className="mt-16">
        <RenderBlocks blocks={page.layout} />
      </article>
    </Container>
  );
}
