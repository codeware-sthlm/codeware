/** A label/value pair rendered as a row in the details table */
export type DetailRow = [label: string, value: string];

export type EmailLayout = {
  /** Preheader and `<title>`; usually the same as the subject */
  title: string;
  /** Leading paragraphs, plain text — escaped and wrapped here */
  paragraphs: Array<string>;
  /** Optional labelled details, rendered as a simple table */
  detailsHeading?: string;
  details?: Array<DetailRow>;
  /** Optional closing links, e.g. privacy and terms */
  links?: Array<{ label: string; url: string }>;
  /** Sender name, shown as the sign-off */
  from: string;
};

/**
 * Escape text destined for the html body.
 *
 * Every value here is either editor content or something a customer typed, so
 * none of it can be trusted into markup — a name containing `<` must arrive as
 * a name, not as a tag.
 *
 * Takes `unknown` and coerces: a localized field with no value in the mail's
 * locale arrives as `undefined`, and a confirmation with a blank line in it
 * beats one that never sends because a template threw.
 */
const escape = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * The shared shell every platform email is rendered into.
 *
 * Deliberately plain: a table-free single column with inline styles, which is
 * what survives contact with the range of clients people actually read mail
 * in. Each template supplies content, never markup.
 *
 * Returns both representations — a text part is what keeps a mail out of the
 * spam folder and readable in a client that refuses html.
 */
export function renderEmailLayout(layout: EmailLayout): {
  html: string;
  text: string;
} {
  const { details, detailsHeading, from, links, paragraphs, title } = layout;

  const htmlParagraphs = paragraphs
    .map(
      (text) => `<p style="margin:0 0 16px;line-height:1.6">${escape(text)}</p>`
    )
    .join('');

  const htmlDetails = details?.length
    ? `${
        detailsHeading
          ? `<h2 style="margin:24px 0 8px;font-size:16px">${escape(
              detailsHeading
            )}</h2>`
          : ''
      }<table style="border-collapse:collapse;margin:0 0 16px" role="presentation">${details
        .map(
          ([label, value]) =>
            `<tr><td style="padding:4px 16px 4px 0;color:#666">${escape(
              label
            )}</td><td style="padding:4px 0">${escape(value)}</td></tr>`
        )
        .join('')}</table>`
    : '';

  const htmlLinks = links?.length
    ? `<p style="margin:24px 0 0;font-size:12px;color:#666">${links
        .map(
          ({ label, url }) =>
            `<a href="${escape(url)}" style="color:#666">${escape(label)}</a>`
        )
        .join(' · ')}</p>`
    : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(
    title
  )}</title></head><body style="margin:0;padding:24px;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">${htmlParagraphs}${htmlDetails}<p style="margin:24px 0 0">${escape(
    from
  )}</p>${htmlLinks}</div></body></html>`;

  const text = [
    ...paragraphs,
    ...(details?.length
      ? [
          '',
          ...(detailsHeading ? [detailsHeading] : []),
          ...details.map(([label, value]) => `${label}: ${value}`)
        ]
      : []),
    '',
    from,
    ...(links?.length ? ['', ...links.map((l) => `${l.label}: ${l.url}`)] : [])
  ].join('\n');

  return { html, text };
}
