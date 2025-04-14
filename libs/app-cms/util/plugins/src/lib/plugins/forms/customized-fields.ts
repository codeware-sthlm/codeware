import { fields as defaultFields } from '@payloadcms/plugin-form-builder';
import { type Block, Field } from 'payload';

/**
 * Customized width field for form builder.
 *
 * Replace the default width field with a number field
 * to allow entering the width in number of columns 1-6.
 *
 * **Important!**
 *
 * This solution is proof-of-concept and could be subject to change.
 *
 * We avoid using a select field since this will create database enums and contraints,
 * which makes it harder to migrate in case this logic needs to be changed.
 */
const widthSelect: Field = {
  name: 'width',
  type: 'number',
  label: 'Field width',
  min: 1,
  max: 6,
  admin: {
    description:
      'Set number of columns the field should span (defaults to 6 = full width).'
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

    // Ignore elements where a placeholder makes no sense.
    if (['checkbox', 'radio'].includes(fieldName) === false) {
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
