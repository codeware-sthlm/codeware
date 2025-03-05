import type { ContentBlock as ContentBlockProps } from '@codeware/shared/util/payload-types';
import { clsx } from 'clsx';
import React from 'react';

import type { RenderBlocksExtraProps } from './render-blocks.type';
import { RichText } from './RichText';

type Props = ContentBlockProps &
  Pick<RenderBlocksExtraProps, 'apiUrl' | 'enableProse' | 'isDark'>;

/**
 * Render Payload content block data,
 * with the configured number of columns and rich text content in each column.
 *
 * User defined column sizes are applied for tablets and desktops.
 * Mobile devices display all columns as full width.
 */
export const ContentBlock: React.FC<Props> = (props) => {
  const { apiUrl, columns, enableProse, isDark } = props;

  return (
    <div className="grid grid-cols-12 gap-y-8 gap-x-16">
      {columns?.map((col, index) => {
        const { richText } = col;
        const size = col.size ?? 'full';

        return (
          <div
            className={clsx('col-span-12', {
              'md:col-span-4': size === 'one-third',
              'md:col-span-6': size === 'half',
              'md:col-span-8': size === 'two-thirds'
            })}
            key={index}
          >
            {richText && (
              <RichText
                apiUrl={apiUrl}
                data={richText}
                enableProse={enableProse}
                isDark={isDark}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
