'use client';
import type {
  BlockSlug,
  ContentBlock as ContentBlockProps,
  Page,
  ReusableContentBlock as ReusableContentBlockProps
} from '@codeware/shared/util/payload-types';
import { cn } from '@codeware/shared/util/ui';
import { useRef } from 'react';

import { CardBlock } from './blocks/CardBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { FileAreaBlock } from './blocks/FileAreaBlock';
import { FormBlock } from './blocks/FormBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { MediaBlock } from './blocks/MediaBlock';
import { RichText } from './blocks/RichText';
import { SocialMediaBlock } from './blocks/SocialMediaBlock';
import { SpacingBlock } from './blocks/SpacingBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { ColumnSizeProvider } from './providers/ColumnSizeProvider';

/**
 * Render Payload content block data, with the configured number of columns
 * and rich text content in each column.
 *
 * Optional blocks are rendered after the rich text content, whitin each column.
 *
 * User defined column sizes are applied for tablets and desktops.
 * Mobile devices display all columns as full width.
 */
export const ContentBlock: React.FC<ContentBlockProps> = ({ columns }) => {
  return (
    <div className="grid w-full grid-cols-12 gap-x-4 gap-y-8 overflow-hidden md:gap-x-8 lg:gap-x-16">
      {columns?.map((col, index) => {
        const { blocks, richText } = col;
        const size = col.size ?? 'full';

        return (
          <ColumnSizeProvider size={size} key={index}>
            <div
              className={cn('first-child-no-margin col-span-12', {
                'md:col-span-4': size === 'one-third',
                'md:col-span-6': size === 'half',
                'md:col-span-8': size === 'two-thirds'
              })}
            >
              {richText && <RichText data={richText} />}
              {!!blocks?.length && (
                <RenderBlocks
                  className={cn({ 'mt-8': !!richText })}
                  blocks={blocks}
                />
              )}
            </div>
          </ColumnSizeProvider>
        );
      })}
    </div>
  );
};

/**
 * Render Payload reusable content block data, by rendering its layout blocks.
 */
export const ReusableContentBlock: React.FC<ReusableContentBlockProps> = ({
  reusableContent,
  refId
}) => {
  if (reusableContent && typeof reusableContent === 'object') {
    return <RenderBlocks blocks={reusableContent.layout} refId={refId} />;
  }
  return null;
};

// Why are the components above defined here and not in `blocks/` folder?
// Components depend on `RenderBlocks`. To avoid circular dependencies,
// these components must be defined in the same file as `RenderBlocks`.

/** Block slug to component mapping */
const blocksMap: Record<
  BlockSlug,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.JSXElementConstructor<any>
> = {
  card: CardBlock,
  code: CodeBlock,
  content: ContentBlock,
  'file-area': FileAreaBlock,
  form: FormBlock,
  image: ImageBlock,
  media: MediaBlock,
  'reusable-content': ReusableContentBlock,
  'social-media': SocialMediaBlock,
  spacing: SpacingBlock,
  video: VideoBlock
};

type Props = {
  blocks: Page['layout'];
  refId?: string | null | undefined;
  className?: string;
};

/**
 * Renders the blocks of a page.
 *
 * @throws Error if not wrapped in PayloadProvider (development only)
 */
export const RenderBlocks: React.FC<Props> = ({ blocks, className, refId }) => {
  const docRef = useRef<HTMLDivElement>(null);

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

  if (hasBlocks) {
    return (
      <div id={refId ?? undefined} ref={docRef} className={className}>
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
