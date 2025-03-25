import { fields as defaultFields } from '@payloadcms/plugin-form-builder';
import { type Block, Field } from 'payload';

/**
 * Customized width field for form builder.
 *
 * Replace the default width field with a select field
 * to allow selecting the width from a list of predefined values.
 */
const widthSelect: Field = {
  name: 'width',
  type: 'select',
  interfaceName: 'FieldWidth',
  label: 'Field width',
  options: [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12 (full width)', value: '12' }
  ],
  defaultValue: '12',
  admin: {
    description: 'Set the width of the field in the 12 column grid layout.'
  }
};

/**
 * Extend the default form block fields with placeholder when it doesn't exist.
 *
 * Add the placeholder last on the row with a label field
 * and distribute the width evenly for all row fields.
 */
export const customizedFields = Object.keys(defaultFields).reduce(
  (acc, fieldName) => {
    const block = defaultFields[fieldName] as Block;

    // Ignore block fields that we don't want to customize at all
    if (['payment', 'state'].includes(fieldName)) {
      acc[fieldName] = block;
      return acc;
    }

    // Ignore checkbox since a placeholder makes no sense.
    if (fieldName !== 'checkbox') {
      // Check if a placeholder is already present as a field or row field.
      const phField = block.fields?.find(
        (f) => f.type === 'text' && f.name === 'placeholder'
      );
      const phRowField = block.fields?.find(
        (f) =>
          f.type === 'row' &&
          f.fields.some((f) => f.type === 'text' && f.name === 'placeholder')
      );

      if (phField || phRowField) {
        // Placeholder already present
        acc[fieldName] = block;
        return acc;
      }

      // Add placeholder field to the row with a label field
      const rowWithLabel = block.fields?.find(
        (fRow) =>
          fRow.type === 'row' &&
          fRow.fields.some((f) => f.type === 'text' && f.name === 'label')
      );

      // Add placeholder field to the row
      if (rowWithLabel && rowWithLabel.type === 'row') {
        rowWithLabel.fields.push({
          name: 'placeholder',
          type: 'text',
          label: 'Placeholder',
          localized: true,
          admin: {
            width: '' // Updated below...
          }
        });

        // Distribute width of row over all cells
        const fieldWidth = Math.floor(100 / rowWithLabel.fields.length);
        const restWidth = 100 - fieldWidth * rowWithLabel.fields.length;

        for (let i = 0; i < rowWithLabel.fields.length; i++) {
          const cell = rowWithLabel.fields[i];
          cell.admin = cell.admin || {};
          cell.admin.width = `${fieldWidth + (i === 0 ? restWidth : 0)}%`;
        }
      }
    }

    // Replace width field based on percentage (number) to a grid based with 12 columns

    // The width field can be located as a normal field or as a row field
    for (let index = 0; index < (block.fields ?? []).length; index++) {
      const lookupField = block.fields[index];

      if (lookupField.type === 'number' && lookupField.name === 'width') {
        // Found as normal field; replace it and stop looking for row fields
        block.fields[index] = widthSelect;
        break;
      }

      // Lookup within any row fields
      if (lookupField.type === 'row') {
        const rowFieldIndex = lookupField.fields.findIndex(
          (f) => f.type === 'number' && f.name === 'width'
        );
        if (rowFieldIndex >= 0) {
          // Found within row field; replace it and stop looking for more
          lookupField.fields[rowFieldIndex] = widthSelect;
          break;
        }
      }
    }

    // Set the possibly modified field
    acc[fieldName] = block;
    return acc;
  },
  {} as Record<string, Block>
);
