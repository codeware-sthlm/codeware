import type { BlockSlug, Page } from '@codeware/shared/util/payload-types';
import React, { Fragment } from 'react';

// import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CodeBlock } from './blocks/CodeBlock';
import { ContentBlock } from './blocks/ContentBlock';
import { FormBlock } from './blocks/FormBlock';
import { MediaBlock } from './blocks/MediaBlock';

const blocksMap: Record<
  BlockSlug,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.JSXElementConstructor<any>
> = {
  code: CodeBlock,
  content: ContentBlock,
  form: FormBlock,
  media: MediaBlock
};

type Props = {
  blocks: Page['layout'];
};

/**
 * Renders the blocks of a page.
 */
export const RenderBlocks: React.FC<Props> = ({ blocks }) => {
  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const Block = blocksMap[block.blockType];

          if (Block) {
            return (
              <div className="space-y-8" key={index}>
                <Block {...block} />
              </div>
            );
          }
          return null;
        })}
      </Fragment>
    );
  }

  return null;
};
