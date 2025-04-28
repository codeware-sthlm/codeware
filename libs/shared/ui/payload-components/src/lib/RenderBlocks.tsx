import type {
  BlockSlug,
  Page,
  ReusableContentBlock
} from '@codeware/shared/util/payload-types';
import { cn } from '@codeware/shared/util/ui';
import { useRef } from 'react';

import { CardBlock } from './blocks/CardBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { ContentBlock } from './blocks/ContentBlock';
import { FormBlock } from './blocks/FormBlock';
import { MediaBlock } from './blocks/MediaBlock';
import { SocialMediaBlock } from './blocks/SocialMediaBlock';
import { SpacingBlock } from './blocks/SpacingBlock';

const blocksMap: Record<
  BlockSlug,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.JSXElementConstructor<any>
> = {
  card: CardBlock,
  code: CodeBlock,
  content: ContentBlock,
  form: FormBlock,
  media: MediaBlock,
  'social-media': SocialMediaBlock,
  spacing: SpacingBlock,
  // Reusable content block invokes RenderBlocks to resolve the nested blocks.
  // Keep implementation here to avoid circular dependency.
  'reusable-content': ({ reusableContent, refId }: ReusableContentBlock) => {
    if (reusableContent && typeof reusableContent === 'object') {
      return <RenderBlocks blocks={reusableContent.layout} refId={refId} />;
    }
    return null;
  }
};

type Props = {
  blocks: Page['layout'];
  refId?: string | null | undefined;
};

/**
 * Renders the blocks of a page.
 */
export const RenderBlocks: React.FC<Props> = ({ blocks, refId }) => {
  const docRef = useRef<HTMLDivElement>(null);

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

  if (hasBlocks) {
    return (
      <div id={refId ?? undefined} ref={docRef}>
        {blocks.map((block, index) => {
          const Block = blocksMap[block.blockType];

          // Spacing block or the first block after spacing block
          const isSpacingBlockOrFollowing =
            block.blockType === 'spacing' ||
            (index > 0 && blocks[index - 1].blockType === 'spacing');

          if (Block) {
            return (
              <div
                // Do not set any margins around spacing block since it has its own margin options.
                // For all other blocks, set a top margin unless it's the first block.
                className={cn({
                  'not-first:mt-8': !isSpacingBlockOrFollowing
                })}
                key={index}
              >
                <Block {...block} />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  return null;
};
