import { cn } from '@codeware/shared/ui/shadcn';
import type { ContentBlock as ContentBlockProps } from '@codeware/shared/util/payload-types';
import React from 'react';

import { RichText } from './RichText';

type Props = ContentBlockProps;

/**
 * Render Payload content block data,
 * with the configured number of columns and rich text content in each column.
 *
 * User defined column sizes are applied for tablets and desktops.
 * Mobile devices display all columns as full width.
 */
export const ContentBlock: React.FC<Props> = ({ columns }) => {
  return (
    <div className="grid w-full grid-cols-12 gap-x-4 gap-y-8 overflow-hidden md:gap-x-8 lg:gap-x-16">
      {columns?.map((col, index) => {
        const { richText } = col;
        const size = col.size ?? 'full';

        return (
          <div
            className={cn('col-span-12', {
              'md:col-span-4': size === 'one-third',
              'md:col-span-6': size === 'half',
              'md:col-span-8': size === 'two-thirds'
            })}
            key={index}
          >
            {richText && <RichText data={richText} />}
          </div>
        );
      })}
    </div>
  );
};
