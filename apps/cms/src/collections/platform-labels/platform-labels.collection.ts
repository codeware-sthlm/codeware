import { iconPickerField } from '@codeware/app-cms/ui/fields';
import {
  authenticatedAccess,
  systemUserAccess
} from '@codeware/app-cms/util/access';
import { enumName } from '@codeware/app-cms/util/db';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import { hasRole } from '@codeware/app-cms/util/misc';
import type { CollectionConfig, OptionObject } from 'payload';

import { ensureUniqueLabel } from './hooks/ensure-unique-label';

/**
 * The label taxonomies the platform offers. Adding one is a value on this
 * enum plus a `filterOptions` on the consuming field — no new collection,
 * table or migration.
 */
export const platformLabelTypes = ['place-kind', 'stock-subject'] as const;

export type PlatformLabelType = (typeof platformLabelTypes)[number];

/** Exhaustive, so a new type cannot ship without its labels */
const typeLabels: Record<PlatformLabelType, Record<'en' | 'sv', string>> = {
  'place-kind': { en: 'Kind of place', sv: 'Typ av plats' },
  'stock-subject': { en: 'Stock image subject', sv: 'Motiv för delad bild' }
};

const platformTypeOptions: OptionObject[] = platformLabelTypes.map((value) => ({
  label: typeLabels[value],
  value
}));

/**
 * Platform labels collection.
 *
 * One place for the short, shared vocabularies the platform maintains — the
 * kinds a place can be, the subjects a stock image shows. Kept as documents
 * rather than enums because these get renamed, merged and retired, and Postgres
 * cannot drop an enum value without swapping the column.
 *
 * Platform-owned, so deliberately not registered with the multi-tenant plugin.
 */
const platformLabels: CollectionConfig<'platform-labels'> = {
  slug: 'platform-labels',
  admin: {
    group: adminGroups.settings,
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'description', 'updatedAt'],
    description: {
      en: 'Shared vocabularies used across all workspaces, such as the kinds a place can be. Editors pick from these; only system users maintain them.',
      sv: 'Delade begrepp som används i alla arbetsytor, till exempel vilka typer en plats kan ha. Redaktörer väljer bland dem; endast systemanvändare underhåller dem.'
    },
    // Editors meet these through the pickers on the fields that use them
    hidden: ({ user }) => !hasRole(user, 'system-user')
  },
  access: {
    read: authenticatedAccess,
    create: systemUserAccess,
    update: systemUserAccess,
    delete: systemUserAccess
  },
  labels: {
    singular: { en: 'Platform label', sv: 'Plattformsetikett' },
    plural: { en: 'Platform labels', sv: 'Plattformsetiketter' }
  },
  hooks: {
    beforeValidate: [ensureUniqueLabel]
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      label: { en: 'Used for', sv: 'Används för' },
      enumName: enumName('platform_labels_type'),
      required: true,
      index: true,
      options: platformTypeOptions,
      admin: {
        description: {
          en: 'Which picker this label appears in.',
          sv: 'Vilken väljare etiketten visas i.'
        }
      }
    },
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', sv: 'Namn' },
      required: true,
      index: true,
      admin: {
        description: {
          en: 'Short and lower case, e.g. "winery", "river valley". Must be unique within its type.',
          sv: 'Kort och med små bokstäver, t.ex. "vingård", "flodlandskap". Måste vara unikt inom sin typ.'
        }
      }
    },
    iconPickerField({
      override: {
        // Required so consumers can render an icon without a fallback branch —
        // pick something generic when nothing fits
        required: true,
        admin: {
          description: {
            en: 'Shown wherever the label appears. Pick a generic icon if none fits.',
            sv: 'Visas där etiketten förekommer. Välj en generisk ikon om ingen passar.'
          }
        }
      }
    }),
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Notes', sv: 'Anteckningar' },
      admin: {
        description: {
          en: 'What this label is for and when to use it. Guidance for whoever maintains the list.',
          sv: 'Vad etiketten är till för och när den ska användas. Vägledning för den som underhåller listan.'
        }
      }
    }
  ]
};

export default platformLabels;
