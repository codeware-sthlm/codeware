import type {
  CodeBlock as CodeBlockType,
  ContentBlock as ContentBlockType,
  MediaBlock as MediaBlockType,
  Page
} from '@codeware/shared/util/payload-types';
import React, { Fragment } from 'react';

// import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CodeBlock } from './CodeBlock';
import { ContentBlock } from './ContentBlock';
import { MediaBlock } from './MediaBlock';
import type { RenderBlocksExtraProps } from './render-blocks.type';

const blocksMap: Record<
  | CodeBlockType['blockType']
  | ContentBlockType['blockType']
  | MediaBlockType['blockType'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.JSXElementConstructor<any>
> = {
  code: CodeBlock,
  content: ContentBlock,
  media: MediaBlock
};

type Props = RenderBlocksExtraProps & {
  blocks: Page['layout'];
};

/**
 * Renders the blocks of a page.
 */
export const RenderBlocks: React.FC<Props> = (props) => {
  const { blocks, ...rest } = props;

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const Block = blocksMap[block.blockType];

          if (Block) {
            return (
              <div className="space-y-8" key={index}>
                <Block {...block} {...rest} />
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

export default RenderBlocks;
