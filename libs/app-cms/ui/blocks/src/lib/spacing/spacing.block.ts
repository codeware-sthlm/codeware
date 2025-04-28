import { colorPickerField } from '@codeware/app-cms/ui/fields';
import { enumName } from '@codeware/app-cms/util/db';
import type { SpacingBlock } from '@codeware/shared/util/payload-types';
import type { Block, Condition, TypeWithID } from 'payload';

const isDivider: Condition<TypeWithID, SpacingBlock> = (_, siblingData) =>
  siblingData?.divider === true;

/**
 * Spacing block for adding an empty space between blocks.
 *
 * Optionally add a horizontal divider with a custom color.
 */
export const spacingBlock: Block = {
  slug: 'spacing',
  interfaceName: 'SpacingBlock',
  fields: [
    {
      type: 'select',
      name: 'size',
      enumName: enumName('spacing_size'),
      label: {
        en: 'Size',
        sv: 'Storlek'
      },
      admin: {
        description: {
          en: 'Regular spacing size matches the default spacing between blocks',
          sv: '"Regular" matchar det normala avståndet som finns mellan block'
        }
      },
      options: [
        { label: 'Tight', value: 'tight' },
        { label: 'Regular', value: 'regular' },
        { label: 'Loose', value: 'loose' }
      ],
      required: true,
      defaultValue: 'regular'
    },
    {
      type: 'row',
      fields: [
        {
          type: 'checkbox',
          name: 'divider',
          label: {
            en: 'Horizontal divider',
            sv: 'Horisontell linje'
          }
        },
        colorPickerField({
          props: { hideLabel: true },
          override: {
            admin: {
              description: {
                en: 'Override divider theme color',
                sv: 'Sätt en annan färg än temats för divider'
              },
              condition: isDivider
            }
          }
        })
      ]
    }
  ]
};
