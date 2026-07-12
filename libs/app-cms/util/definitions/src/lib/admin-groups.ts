/**
 * Admin groups for rendering payload collections and globals together in the admin UI.
 *
 * @see https://payloadcms.com/docs/configuration/collections#admin-options
 */
export const adminGroups: Record<string, { en: string; sv: string }> = {
  content: { en: 'Your Content', sv: 'Ditt Innehåll' },
  fileArea: { en: 'Photos & Files', sv: 'Bilder & Filer' },
  forms: { en: 'Forms & Messages', sv: 'Formulär & Meddelanden' },
  settings: { en: 'Site Setup', sv: 'Inställningar' }
};
