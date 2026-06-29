import { deepMerge } from '@codeware/shared/util/pure';
import type { UploadField } from 'payload';

/**
 * Icon crop field: a media relationship with a custom 1:1 crop UI in the Payload admin.
 *
 * Replaces the standard file upload picker with react-easy-crop so the admin
 * can select a 1:1 crop region before the result is stored as a media document.
 */
export const iconCropField = (
  override: Partial<UploadField> = {}
): UploadField => {
  const field = deepMerge<UploadField>(
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Image', sv: 'Bild' },
      admin: {
        components: {
          Field: '@codeware/app-cms/ui/fields/icon-crop/IconCropField.client'
        }
      }
    },
    override
  );

  return field;
};
