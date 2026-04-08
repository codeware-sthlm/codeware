import type { CollectionConfig } from 'payload';

import { slugField } from '@codeware/app-cms/ui/fields';
import { seoTab } from '@codeware/app-cms/ui/tabs';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import { BlockSlug } from '@codeware/shared/util/payload-types';
import { getActiveKeys } from '@codeware/shared/util/pure';

import { userOrApiKeyAccess } from '../../security/user-or-api-key-access';

/**
 * Define which blocks are available for the layout builder.
 */
// Using a record to make sure all blocks are included and not forgotten
const blocks: Record<BlockSlug, boolean> = {
  content: true,
  card: true,
  'file-area': true,
  form: true,
  image: true,
  media: true,
  code: true,
  'reusable-content': true,
  'social-media': true,
  spacing: true,
  // Unsupported blocks
  video: false
};

/**
 * Pages collection
 */
const pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  admin: {
    group: adminGroups.content,
    defaultColumns: ['name', 'slug', 'updatedAt'],
    useAsTitle: 'name',
    description: {
      en: 'Pages are the building blocks of the site and are used to create menus and navigation.',
      sv: 'Sidor är webbsidans byggstenar och används för att skapa menyer och navigering.'
    }
  },
  access: {
    read: userOrApiKeyAccess()
  },
  labels: {
    singular: { en: 'Page', sv: 'Sida' },
    plural: { en: 'Pages', sv: 'Sidor' }
  },
  fields: [
    {
      name: 'name',
      label: { en: 'Name', sv: 'Namn' },
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: {
          en: 'The name of the page used for navigation links.',
          sv: 'Sidans namn som används för navigeringslänkar.'
        }
      }
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'Content', sv: 'Innehåll' },
          fields: [
            {
              name: 'header',
              type: 'text',
              label: { en: 'Header', sv: 'Rubrik' },
              required: false,
              localized: true,
              admin: {
                description: {
                  en: 'A pre-designed header on top of the page. Provide for a consistent look and feel or customize everything in layout builder.',
                  sv: 'En fördefinierad rubrik längst upp på sidan. Använd för att skapa ett konsekvent utseende, alternativt anpassa allt i innehållsbyggaren.'
                }
              },
              defaultValue: ''
            },
            {
              name: 'layout',
              type: 'blocks',
              label: { en: 'Layout builder', sv: 'Innehållsbyggaren' },
              labels: {
                singular: { en: 'block', sv: 'block' },
                plural: { en: 'blocks', sv: 'block' }
              },
              blockReferences: getActiveKeys<BlockSlug>(blocks),
              blocks: [],
              required: true,
              admin: {
                description: {
                  en: 'Build your page by adding the content you need. E.g. choose "Content" to create one or more columns. Then use the text editor and add more blocks if needed in each column.',
                  sv: 'Bygg din sida genom att lägga till det innehåll du behöver. Välj t.ex. "Innehåll" för att skapa en eller flera kolumner. Skriv sedan i texteditorn och lägg till fler block om det behövs i varje kolumn.'
                },
                disableListColumn: true,
                initCollapsed: true
              }
            }
          ]
        },
        seoTab
      ]
    },
    slugField({ sourceField: 'name' })
  ]
};

export default pages;
