import {
  BlockquoteFeature,
  BoldFeature,
  HeadingFeature,
  InlineCodeFeature,
  ItalicFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor
} from '@payloadcms/richtext-lexical';
import type { Config } from 'payload';

/**
 * Restricted editor for a form's notification email message.
 *
 * The form-builder plugin serializes this field's own Lexical tree straight
 * into the email's HTML, through a fixed set of eight converters — paragraph,
 * text, linebreak, link, heading, quote, list, list item (see
 * `serializeLexical.js` in `@payloadcms/plugin-form-builder`). Left on the
 * project's default editor, an editor can reach for a feature outside that
 * set — a horizontal rule, say — and the plugin renders it as the literal
 * string "unknown node" in the sent email, with no warning at save time.
 *
 * Scoped to exactly what those eight converters render: the text formats
 * `TextHTMLConverter` reads off a text node's format bitmask, plus paragraph,
 * heading, blockquote (→ "quote"), and both list types. Link is left out
 * rather than duplicated unscoped — the project's own link feature
 * (`multiTenantLinkFeature`) lives in a `ui` lib that `type:util` code
 * cannot depend on, and an unscoped one would let an editor link to another
 * tenant's page.
 */
export const messageEditor: Config['editor'] = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    SubscriptFeature(),
    SuperscriptFeature(),
    InlineCodeFeature(),
    BlockquoteFeature(),
    UnorderedListFeature(),
    OrderedListFeature()
  ]
});
