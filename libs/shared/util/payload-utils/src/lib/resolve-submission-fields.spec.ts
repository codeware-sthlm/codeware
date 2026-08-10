import type { Form } from '@codeware/shared/util/payload-types';
import { describe, expect, it } from 'vitest';

import { resolveSubmissionFields } from './resolve-submission-fields';

const form = (fields: Form['fields']): Form =>
  ({
    id: 1,
    title: 'Booking',
    fields,
    updatedAt: '',
    createdAt: ''
  }) as Form;

describe('resolveSubmissionFields', () => {
  it('should label and order values by the form definition', () => {
    const result = resolveSubmissionFields(
      form([
        { blockType: 'text', name: 'name', label: 'Your name' },
        {
          blockType: 'number',
          name: 'travellers',
          label: 'Number of travellers'
        }
      ]),
      [
        { field: 'travellers', value: '4' },
        { field: 'name', value: 'Anna' }
      ]
    );

    expect(result).toEqual([
      { name: 'name', label: 'Your name', value: 'Anna', orphaned: false },
      {
        name: 'travellers',
        label: 'Number of travellers',
        value: '4',
        orphaned: false
      }
    ]);
  });

  it('should fall back to the field name when the form gives no label', () => {
    const result = resolveSubmissionFields(
      form([{ blockType: 'text', name: 'note' }]),
      [{ field: 'note', value: 'Hi' }]
    );

    expect(result[0]).toMatchObject({ label: 'note', orphaned: false });
  });

  it('should resolve a select value to its option label', () => {
    const result = resolveSubmissionFields(
      form([
        {
          blockType: 'select',
          name: 'tour',
          label: 'Tour',
          options: [
            { label: 'Sunset tasting', value: 'sunset' },
            { label: 'Full day', value: 'full-day' }
          ]
        }
      ]),
      [{ field: 'tour', value: 'sunset' }]
    );

    expect(result[0]?.value).toBe('Sunset tasting');
  });

  it('should resolve a radio value to its option label', () => {
    const result = resolveSubmissionFields(
      form([
        {
          blockType: 'radio',
          name: 'contactBy',
          label: 'Contact me by',
          options: [
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' }
          ]
        }
      ]),
      [{ field: 'contactBy', value: 'phone' }]
    );

    expect(result[0]?.value).toBe('Phone');
  });

  it('should keep a select value that matches no option', () => {
    const result = resolveSubmissionFields(
      form([
        {
          blockType: 'select',
          name: 'tour',
          label: 'Tour',
          options: [{ label: 'Full day', value: 'full-day' }]
        }
      ]),
      [{ field: 'tour', value: 'retired-option' }]
    );

    expect(result[0]?.value).toBe('retired-option');
  });

  it('should append values whose field the form no longer defines', () => {
    const result = resolveSubmissionFields(
      form([{ blockType: 'text', name: 'name', label: 'Your name' }]),
      [
        { field: 'phone', value: '070-1234567' },
        { field: 'name', value: 'Anna' }
      ]
    );

    expect(result).toEqual([
      { name: 'name', label: 'Your name', value: 'Anna', orphaned: false },
      { name: 'phone', label: 'phone', value: '070-1234567', orphaned: true }
    ]);
  });

  it('should skip form fields the submission has no value for', () => {
    const result = resolveSubmissionFields(
      form([
        { blockType: 'text', name: 'name', label: 'Your name' },
        { blockType: 'text', name: 'company', label: 'Company' }
      ]),
      [{ field: 'name', value: 'Anna' }]
    );

    expect(result).toHaveLength(1);
  });

  it('should skip presentational blocks that carry no value', () => {
    const result = resolveSubmissionFields(
      form([
        { blockType: 'message', message: null },
        { blockType: 'text', name: 'name', label: 'Your name' }
      ]),
      [{ field: 'name', value: 'Anna' }]
    );

    expect(result).toEqual([
      { name: 'name', label: 'Your name', value: 'Anna', orphaned: false }
    ]);
  });

  it('should treat every value as orphaned when the form is unavailable', () => {
    const result = resolveSubmissionFields(null, [
      { field: 'name', value: 'Anna' }
    ]);

    expect(result).toEqual([
      { name: 'name', label: 'name', value: 'Anna', orphaned: true }
    ]);
  });

  it('should return nothing for an empty submission', () => {
    expect(resolveSubmissionFields(form([]), null)).toEqual([]);
  });
});
