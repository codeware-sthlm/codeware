'use client';

import { useConfig, useTranslation } from '@payloadcms/ui';
import type { CollectionSlug } from 'payload';
import { useCallback } from 'react';

import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';

import { localize } from './localize';

/**
 * Memoized label lookup for a collection's plural label in the current language.
 *
 * Shared by the palette dialog (result/recent group headings) and the
 * navigation command builder, so the localization logic lives in one place.
 */
export function useCollectionLabel(): (slug: CollectionSlug) => string {
  const { config } = useConfig();
  const { i18n } = useTranslation<TranslationsObject, TranslationsKeys>();
  const language = i18n.language;

  return useCallback(
    (slug) =>
      localize(
        config.collections.find((c) => c.slug === slug)?.labels.plural,
        language,
        slug
      ),
    [config.collections, language]
  );
}
