import {
  type MimeTypeSlug,
  getMimeTypes
} from '@codeware/app-cms/util/definitions';
import { deepMerge } from '@codeware/shared/util/pure';
import type { UploadField, Where } from 'payload';

type Options = {
  /**
   * Limit media to specific mime types.
   */
  mimeTypeSlugs?: Array<MimeTypeSlug>;

  /**
   * The name of the field.
   */
  name: string;

  /**
   * Override properties which will be deep merged with the field.
   */
  overrides?: Partial<UploadField>;

  /**
   * Whether the field is required.
   * @default false
   */
  required?: boolean;
};

/**
 * Media field that can be used to select or upload media files.
 *
 * Media files to select from can optionally be limited to specific mime types.
 *
 * @param options - Options for the field
 */
export const mediaUploadField = ({
  mimeTypeSlugs,
  name,
  overrides,
  required = false
}: Options): UploadField => {
  const field: UploadField = {
    name,
    type: 'upload',
    relationTo: 'media',
    required
  };

  if (mimeTypeSlugs && mimeTypeSlugs.length) {
    const mimeTypes = getMimeTypes({
      limit: mimeTypeSlugs,
      stripWildcard: true
    });
    // Query for all provided mime types
    const query: Where = {
      or: [
        ...mimeTypes.map((mimeType) => ({
          mimeType: { contains: mimeType }
        }))
      ]
    };
    field.filterOptions = query;
  }

  return overrides ? deepMerge(field, overrides) : field;
};
