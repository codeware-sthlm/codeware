import { RenderBlocks } from '@codeware/shared/ui/cms-renderer';
import type { NavigationDoc } from '@codeware/shared/util/payload-types';
import type { BlocksData } from '@codeware/shared/util/payload-utils';

/**
 * Render a pages collection document.
 */
export const RenderPagesDoc: React.FC<{
  doc: NavigationDoc;
  blocksData?: BlocksData;
}> = ({ doc, blocksData }) => {
  if (doc.collection !== 'pages') {
    return null;
  }

  return (
    <>
      {doc.header && (
        <header className="max-w-2xl">
          <h1 className="text-core-headline text-4xl font-bold tracking-tight sm:text-5xl">
            {doc.header}
          </h1>
        </header>
      )}
      <article className="mt-16">
        <RenderBlocks blocks={doc.layout} blocksData={blocksData} />
      </article>
    </>
  );
};
