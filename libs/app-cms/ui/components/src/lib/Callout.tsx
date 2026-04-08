import { type TranslationsKeys, customT } from '@codeware/app-cms/util/i18n';
import {
  Callout as CalloutComponent,
  type CalloutProps
} from '@codeware/shared/ui/primitives';
import type { ServerProps } from 'payload';

type Props = ServerProps & {
  kind?: CalloutProps['kind'];
  /** Plain string title (untranslated). */
  title?: string;
  /** Translation key for the title — resolved via Payload i18n. */
  titleKey?: TranslationsKeys;
  /** One or more description lines. A plain string is treated as a single line. */
  description?: string | Array<string>;
  /** Translation key for an array-typed description — resolved via Payload i18n. */
  descriptionKey?: TranslationsKeys;
};

/**
 * Server component to display a callout.
 *
 * Accepts either plain strings or translation references resolved via
 * Payload i18n. Description accepts a plain string, string array, or a
 * `TranslationsKeys` pointing to a translation.
 */
export function Callout({
  kind,
  description,
  descriptionKey,
  i18n,
  title,
  titleKey
}: Props) {
  // Cast required: ServerProps.i18n.t has a broader key union than the
  // @payloadcms/translations I18n['t'] that customT expects.
  const t = customT(i18n.t as Parameters<typeof customT>[0]);

  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedDescription = descriptionKey ? t(descriptionKey) : description;
  const resolvedDescriptionArr =
    resolvedDescription && Array.isArray(resolvedDescription)
      ? resolvedDescription
      : resolvedDescription
        ? [resolvedDescription]
        : [];

  if (!resolvedDescriptionArr.length) {
    console.warn('Callout: No description provided');
    return null;
  }

  return (
    <CalloutComponent
      kind={kind}
      description={resolvedDescriptionArr}
      title={resolvedTitle}
    />
  );
}

export default Callout;
