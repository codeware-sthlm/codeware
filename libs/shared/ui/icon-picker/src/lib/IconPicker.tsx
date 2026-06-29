'use client';
import {
  HeroIcon,
  type HeroIconName,
  heroIconMap
} from '@codeware/shared/ui/primitives';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@codeware/shared/ui/shadcn/components/dialog';
import { Input } from '@codeware/shared/ui/shadcn/components/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@codeware/shared/ui/shadcn/components/tooltip';
import { t } from '@codeware/shared/util/i18n';
import type { TailwindColor } from '@codeware/shared/util/tailwind';
import { useState } from 'react';

import { useIconPicker } from './useIconPicker';

/** Icon picker heroicon name type */
export type IconPickerIcon = HeroIconName;

type Props = {
  /** Locale for UI strings. Defaults to 'en'. */
  locale?: string;

  /** A callback function that is called when an icon is selected. */
  onChange?: (icon: IconPickerIcon) => void;

  /** The initial value of the icon picker. */
  value?: IconPickerIcon;

  /** The Tailwind color name of the icon. */
  color?: TailwindColor;
};

export const IconPicker: React.FC<Props> = ({
  locale = 'en',
  onChange,
  value,
  color
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<null | IconPickerIcon>(
    value ?? null
  );

  const triggerElement = (icon: IconPickerIcon | null) => (
    <Button size="lg" variant="outline" className="hover:cursor-pointer">
      {icon ? (
        <>
          <HeroIcon className="size-6" icon={icon} color={color} />
          {heroIconMap[icon].friendlyName}
        </>
      ) : (
        t(locale, 'iconPicker.labelSelect')
      )}
    </Button>
  );

  return (
    <div className="twp">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerElement(selected)}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(locale, 'iconPicker.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t(locale, 'iconPicker.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <IconSelectGrid
            locale={locale}
            onChange={(icon) => {
              setSelected(icon);
              setOpen(false);
              onChange?.(icon);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const IconSelectGrid: React.FC<{
  locale: string;
  onChange: (icon: HeroIconName) => void;
}> = ({ locale, onChange }) => {
  const { search, setSearch, icons } = useIconPicker();

  return (
    <div className="flex flex-col">
      <Input
        placeholder={t(locale, 'iconPicker.searchFieldPlaceholder')}
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mt-2 flex max-h-100 flex-wrap justify-between gap-2 overflow-y-auto py-4 pb-12">
        {icons.map(({ name, Component }) => (
          <TooltipProvider key={name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  role="button"
                  variant="secondary"
                  onClick={() => onChange(name)}
                  className="h-11 hover:cursor-pointer"
                >
                  <Component className="size-6 shrink-0" />
                  <span className="sr-only">{name}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {icons.length === 0 && (
          <div className="flex grow flex-col items-center justify-center gap-2 text-center">
            <p>{t(locale, 'iconPicker.noIconsFound')}</p>
            <Button
              onClick={() => setSearch('')}
              variant="outline"
              className="hover:cursor-pointer"
            >
              {t(locale, 'iconPicker.searchClearButton')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
