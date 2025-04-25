import { RenderBlocks } from '@codeware/shared/ui/payload-components';
import type { NavigationDoc } from '@codeware/shared/util/payload-types';

/**
 * Render a pages collection document.
 */
export const RenderPagesDoc: React.FC<{ doc: NavigationDoc }> = ({ doc }) => {
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
        <RenderBlocks blocks={doc.layout} />
      </article>
    </>
  );
};
