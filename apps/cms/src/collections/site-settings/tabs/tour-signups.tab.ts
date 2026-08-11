import { filterByTenantScope } from '@codeware/app-cms/util/filters';
import type { Tab } from 'payload';

/** Kept in step with the copy the signup form shows the customer */
const DEFAULT_RETENTION_DAYS = 365;

/**
 * Tour signups tab for site settings.
 *
 * Signups are personal data, which brings two obligations the platform cannot
 * meet on a tenant's behalf: telling the customer what happens to their
 * details at the moment they hand them over, and not keeping those details
 * longer than the tour needs them. Both are configured once here rather than
 * per tour, since they describe the workspace and not a departure.
 */
export const tourSignupsTab: Tab = {
  name: 'tourSignups',
  interfaceName: 'SiteSettingsTourSignups',
  label: { en: 'Tour signups', sv: 'Reseanmälningar' },
  admin: {
    description: {
      en: 'What customers are told when they sign up for a tour, and how long their details are kept.',
      sv: 'Vad kunder får veta när de anmäler sig till en resa, och hur länge deras uppgifter sparas.'
    }
  },
  fields: [
    {
      name: 'privacyPage',
      type: 'relationship',
      relationTo: 'pages',
      label: { en: 'Privacy page', sv: 'Integritetssida' },
      filterOptions: ({ req }) => filterByTenantScope(req, 'pages'),
      admin: {
        description: {
          en: 'Linked from the signup form and the confirmation email. No page yet? Create a starter one below.',
          sv: 'Länkas från anmälningsformuläret och bekräftelsemejlet. Saknar du sida? Skapa ett utkast nedan.'
        }
      }
    },
    {
      name: 'termsPage',
      type: 'relationship',
      relationTo: 'pages',
      label: { en: 'Terms page', sv: 'Villkorssida' },
      filterOptions: ({ req }) => filterByTenantScope(req, 'pages'),
      admin: {
        description: {
          en: 'When set, customers must accept these terms before they can sign up.',
          sv: 'När den är vald måste kunder godkänna villkoren innan de kan anmäla sig.'
        }
      }
    },
    {
      name: 'retentionDays',
      type: 'number',
      label: {
        en: 'Keep signup details for (days after departure)',
        sv: 'Spara anmälningsuppgifter i (dagar efter avresa)'
      },
      min: 1,
      defaultValue: DEFAULT_RETENTION_DAYS,
      admin: {
        description: {
          en: 'Names, emails and phone numbers are cleared this long after the tour departs. Party sizes and statuses are kept. This number is also what customers are told on the signup form.',
          sv: 'Namn, e-post och telefonnummer rensas så här lång tid efter avresan. Antal personer och status behålls. Siffran är också det kunderna får veta i anmälningsformuläret.'
        }
      }
    }
  ]
};
