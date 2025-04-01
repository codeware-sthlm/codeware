/**
 * Admin groups for rendering payload collections and globals together in the admin UI.
 *
 * @see https://payloadcms.com/docs/configuration/collections#admin-options
 */
export const adminGroups: Record<string, { en: string; sv: string }> = {
  content: { en: 'Content', sv: 'Innehåll' },
  fileArea: { en: 'File Area', sv: 'Filarea' },
  forms: { en: 'Form Builder', sv: 'Formulärbyggare' },
  settings: { en: 'Settings', sv: 'Inställningar' }
};
