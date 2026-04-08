'use client';

import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import type { CardBlockCard } from '@codeware/shared/util/payload-types';
import {
  type RowLabelProps,
  useRowLabel,
  useTranslation
} from '@payloadcms/ui';

/**
 * Custom array row label for CardBlock cards array field.
 *
 * Displays the card title instead of the default row number.
 */
export const CardBlockArrayRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<CardBlockCard>();
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const { title } = data ?? {};

  return (
    title ??
    t('collection:cardWithSuffix', {
      suffix: String(rowNumber).padStart(2, '0')
    })
  );
};

export default CardBlockArrayRowLabel;
