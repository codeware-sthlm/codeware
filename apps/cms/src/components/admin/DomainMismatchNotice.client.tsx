'use client';

import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@codeware/shared/ui/shadcn/components/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@payloadcms/ui';
import React from 'react';

import { FORCE_LOGOUT_PATH } from '../../utils/force-logout';

type Props = {
  /** Origin the browser reached the admin on */
  origin: string;
  /** Origin this deployment answers as */
  expected: string;
};

/**
 * Explains a session that is being refused, and offers the way out of it.
 */
export const DomainMismatchNoticeClient: React.FC<Props> = ({
  origin,
  expected
}) => {
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();

  return (
    <Alert variant="destructive" className="codeware-admin twp mb-4">
      <ExclamationTriangleIcon className="size-4" />
      <AlertTitle>{t('domains:mismatchHeading')}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>{t('domains:mismatchBody', { expected, origin })}</span>
        <span className="flex flex-wrap gap-3">
          <a className="underline" href={expected}>
            {t('domains:mismatchOpenExpected')}
          </a>
          <a className="underline" href={FORCE_LOGOUT_PATH}>
            {t('domains:mismatchForceLogout')}
          </a>
        </span>
      </AlertDescription>
    </Alert>
  );
};
