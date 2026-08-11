import { privacyEn } from './privacy.en';
import { privacySv } from './privacy.sv';
import { termsEn } from './terms.en';
import { termsSv } from './terms.sv';

export type LegalTemplateKind = 'privacy' | 'terms';

export type LegalTemplateVars = {
  /** Workspace name, as the customer knows it */
  tenantName: string;
  /** Address a customer writes to about their data */
  contactEmail: string;
  /** Days signup details are kept after departure */
  retentionDays: number;
};

const templates: Record<LegalTemplateKind, Record<'en' | 'sv', string>> = {
  privacy: { en: privacyEn, sv: privacySv },
  terms: { en: termsEn, sv: termsSv }
};

/** Page titles, so a created draft is recognisable in the pages list */
const titles: Record<LegalTemplateKind, Record<'en' | 'sv', string>> = {
  privacy: { en: 'Privacy', sv: 'Integritet' },
  terms: { en: 'Terms', sv: 'Villkor' }
};

/**
 * Fill a legal starter template with the workspace's own details.
 *
 * Generic text is text nobody reads: a page that names the workspace, its
 * contact address and its actual retention period is one an editor can correct
 * rather than one they have to write. Unknown placeholders are left in place so
 * a missing value is visible in the draft instead of silently blank.
 */
export function renderLegalTemplate(
  kind: LegalTemplateKind,
  locale: string,
  vars: LegalTemplateVars
): { markdown: string; title: string } {
  const lang = locale === 'sv' ? 'sv' : 'en';

  const markdown = Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    templates[kind][lang]
  );

  return { markdown, title: titles[kind][lang] };
}
