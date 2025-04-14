import { RichText } from '@codeware/shared/ui/payload-components';
import type { NavigationDoc } from '@codeware/shared/util/payload-types';

/**
 * Render a posts collection document.
 */
export const RenderPostsDoc: React.FC<{ doc: NavigationDoc }> = ({ doc }) => {
  if (doc.collection !== 'posts') {
    return null;
  }

  return (
    <>
      {/* TODO: Improve the hero image rendering */}
      {doc.heroImage?.url && (
        <div className="relative">
          <img
            src={doc.heroImage.url}
            alt={doc.heroImage.alt ?? ''}
            className="h-96 w-full object-cover"
          />
        </div>
      )}
      <article className="mt-16">
        <RichText data={doc.content} />
      </article>
    </>
  );
};
