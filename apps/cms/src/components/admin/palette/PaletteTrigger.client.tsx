'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@payloadcms/ui';
import React from 'react';

import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import { Button } from '@codeware/shared/ui/shadcn/components/button';

import { paletteShortcutLabel } from './palette-shortcut-label';
import { PaletteDialogHost } from './PaletteDialog.client';
import { usePalette } from './PaletteProvider.client';

/**
 * Toolbar trigger for the command palette (`admin.components.actions`),
 * mirroring the theme switch pill.
 *
 * Also mounts the palette dialog itself: actions render inside Payload's
 * default template where per-user contexts (entity visibility, tenant
 * selection) exist, unlike the globally mounted `PaletteProvider`.
 */
export function PaletteTrigger() {
  const { openPalette } = usePalette();
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();

  return (
    <div className="codeware-admin twp">
      <Button
        onClick={openPalette}
        variant="outline"
        size="sm"
        className="text-muted-foreground hover:text-foreground gap-2 rounded-full font-normal"
        title={t('palette:openPalette')}
        aria-label={t('palette:dialogTitle')}
      >
        <MagnifyingGlassIcon className="size-3.5" />
        <span className="max-sm:hidden">{t('palette:openPalette')}</span>
        <kbd className="border-border bg-muted text-muted-foreground rounded border px-1 py-px font-sans text-[10px] max-sm:hidden">
          {paletteShortcutLabel()}
        </kbd>
      </Button>
      <PaletteDialogHost />
    </div>
  );
}

export default PaletteTrigger;
