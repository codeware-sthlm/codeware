import { linkGroupField, socialLinksField } from '@codeware/app-cms/ui/fields';
import { enumName } from '@codeware/app-cms/util/db';
import type { Condition, Tab, TypeWithID } from 'payload';

/**
 * Shape of the footer tab data needed by the field conditions.
 *
 * Declared locally since the generated types are derived from this tab.
 */
type FooterData = {
  enabled?: boolean | null;
  linkSource?: ('navigation' | 'custom' | 'none') | null;
};

// Footer is enabled unless explicitly turned off, so documents
// created before the footer existed keep rendering one
const isEnabled: Condition<TypeWithID, FooterData> = (_, siblingData) =>
  siblingData?.enabled !== false;

const isCustomLinks: Condition<TypeWithID, FooterData> = (_, siblingData) =>
  siblingData?.enabled !== false && siblingData?.linkSource === 'custom';

/**
 * Footer tab for site settings.
 *
 * Everything is optional — an untouched footer renders the navigation links
 * and a copyright line based on the application name.
 */
export const footerTab: Tab = {
  name: 'footer',
  interfaceName: 'SiteSettingsFooter',
  label: { en: 'Footer', sv: 'Sidfot' },
  admin: {
    description: {
      en: 'Control what the site footer displays.',
      sv: 'Bestäm vad som visas i webbplatsens sidfot.'
    }
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: { en: 'Show footer', sv: 'Visa sidfot' },
      defaultValue: true,
      admin: {
        description: {
          en: 'Uncheck to hide the footer on all pages.',
          sv: 'Avmarkera för att dölja sidfoten på alla sidor.'
        }
      }
    },
    {
      name: 'linkSource',
      type: 'radio',
      label: { en: 'Links', sv: 'Länkar' },
      defaultValue: 'navigation',
      enumName: enumName('footer_link_source'),
      admin: {
        condition: isEnabled,
        layout: 'horizontal'
      },
      options: [
        {
          label: {
            en: 'Same as top navigation',
            sv: 'Samma som toppnavigeringen'
          },
          value: 'navigation'
        },
        {
          label: { en: 'Custom links', sv: 'Anpassade länkar' },
          value: 'custom'
        },
        {
          label: { en: 'No links', sv: 'Inga länkar' },
          value: 'none'
        }
      ]
    },
    {
      name: 'links',
      type: 'array',
      label: { en: 'Footer links', sv: 'Länkar i sidfoten' },
      labels: {
        singular: { en: 'Link', sv: 'Länk' },
        plural: { en: 'Links', sv: 'Länkar' }
      },
      admin: {
        condition: isCustomLinks,
        description: {
          en: 'Pick the pages worth a footer link — usually fewer than the top navigation.',
          sv: 'Välj de sidor som är värda en länk i sidfoten - vanligtvis färre än i toppnavigeringen.'
        },
        components: {
          RowLabel: '@codeware/apps/cms/components/FooterLinkArrayRowLabel'
        },
        initCollapsed: true
      },
      fields: [linkGroupField({ localizedLabel: true })]
    },
    {
      name: 'tagline',
      type: 'textarea',
      label: { en: 'Tagline', sv: 'Slogan' },
      localized: true,
      admin: {
        condition: isEnabled,
        description: {
          en: 'Short text above the footer links, e.g. a one-line description of the business.',
          sv: 'Kort text ovanför länkarna, t.ex. en enradig beskrivning av verksamheten.'
        }
      }
    },
    socialLinksField({
      name: 'contact',
      platformEnum: 'footer_contact_platform',
      overrides: {
        label: { en: 'Contact', sv: 'Kontakt' },
        labels: {
          singular: { en: 'Contact', sv: 'Kontaktuppgift' },
          plural: { en: 'Contacts', sv: 'Kontaktuppgifter' }
        },
        admin: {
          condition: isEnabled,
          description: {
            en: 'Email, phone and social media to display in the footer.',
            sv: 'E-post, telefon och sociala medier som visas i sidfoten.'
          }
        }
      }
    }),
    {
      name: 'copyright',
      type: 'text',
      label: { en: 'Copyright', sv: 'Upphovsrätt' },
      localized: true,
      admin: {
        condition: isEnabled,
        description: {
          en: 'Use {year} for the current year. Defaults to "© {year} <application name>" when empty.',
          sv: 'Använd {year} för innevarande år. Standard är "© {year} <applikationens namn>" när fältet är tomt.'
        },
        placeholder: '© {year} Acme AB'
      }
    },
    {
      name: 'showVersion',
      type: 'checkbox',
      label: {
        en: 'Show application version',
        sv: 'Visa applikationens version'
      },
      admin: {
        condition: isEnabled,
        description: {
          en: 'Display the running release, e.g. web@1.4.0+ab12cd3.',
          sv: 'Visa den körande utgåvan, t.ex. web@1.4.0+ab12cd3.'
        }
      }
    }
  ]
};
