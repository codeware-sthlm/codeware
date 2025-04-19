import {
  HeroIcon,
  type HeroIconName,
  heroIconMap
} from '@codeware/shared/ui/react-universal-components';
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
import type { TailwindColor } from '@codeware/shared/util/tailwind';
import { cn } from '@codeware/shared/util/ui';
import type { VariantProps } from 'class-variance-authority';
import { useState } from 'react';

import { useIconPicker } from './useIconPicker';

/** Icon picker heroicon name type */
export type IconPickerIcon = HeroIconName;

type DialogLabels = {
  dialogDescription?: string;
  dialogTitle?: string;
  noIconsFound?: string;
  searchClearButton?: string;
  searchFieldPlaceholder?: string;
};

type TriggerLabels = {
  labelChange?: (icon: {
    name: IconPickerIcon;
    friendlyName: string;
  }) => string;
  labelSelect?: string;
};

type Props = {
  /**
   * Custom dialog labels.
   */
  labels?: DialogLabels;

  /**
   * Custom dialog trigger element and options.
   */
  trigger?: {
    onClick?: () => void;
  } & (
    | { element: (icon: IconPickerIcon | null) => React.ReactNode }
    | (TriggerLabels & {
        buttonClassName?: string;
        buttonVariant?: VariantProps<typeof Button>['variant'];
      })
  );

  /**
   * A callback function that is called when an icon is selected.
   */
  onChange?: (icon: IconPickerIcon) => void;

  /**
   * The initial value of the icon picker.
   */
  value?: IconPickerIcon;

  /**
   * The Tailwind color name of the icon.
   */
  color?: TailwindColor;
};

const defaultLabels: Required<DialogLabels & TriggerLabels> = {
  // Dialog labels
  dialogDescription: 'Choose the best suited icon',
  dialogTitle: 'Select an Icon',
  noIconsFound: 'No icons found...',
  searchClearButton: 'Clear search',
  searchFieldPlaceholder: 'Search icon...',
  // Trigger labels
  labelChange: (icon) => icon.friendlyName,
  labelSelect: 'Select icon'
};

/**
 * A client-side component for selecting a heroicon from a dialog.
 *
 * @param onChange - A callback function that is called when an icon is selected.
 * @param trigger - Custom dialog trigger element and options.
 */
export const IconPicker: React.FC<Props> = ({
  labels,
  onChange,
  trigger,
  value,
  color
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<null | IconPickerIcon>(
    value ?? null
  );

  const {
    dialogDescription = defaultLabels.dialogDescription,
    dialogTitle = defaultLabels.dialogTitle,
    noIconsFound = defaultLabels.noIconsFound,
    searchClearButton = defaultLabels.searchClearButton,
    searchFieldPlaceholder = defaultLabels.searchFieldPlaceholder
  } = labels ?? {};

  const { onClick = () => void 0 } = trigger ?? {};

  let triggerElement: (icon: IconPickerIcon | null) => React.ReactNode;
  if (trigger && 'element' in trigger) {
    triggerElement = trigger.element;
  } else {
    const {
      buttonClassName = '',
      buttonVariant = 'outline',
      labelChange = defaultLabels.labelChange,
      labelSelect = defaultLabels.labelSelect
    } = trigger ?? {};
    triggerElement = (icon) => (
      <Button
        size={'lg'}
        variant={buttonVariant}
        className={cn('hover:cursor-pointer', buttonClassName)}
        onClick={onClick}
      >
        {icon ? (
          <>
            <HeroIcon className="size-6" icon={icon} color={color} />
            {labelChange({
              name: icon,
              friendlyName: heroIconMap[icon].friendlyName
            })}
          </>
        ) : (
          labelSelect
        )}
      </Button>
    );
  }

  return (
    <div className="twp">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerElement(selected)}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          {/* Render a searchable icon grid */}
          <IconSelectGrid
            labels={{
              noIconsFound,
              searchClearButton,
              searchFieldPlaceholder
            }}
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

/**
 * A searchable icon grid for selecting a heroicon.
 *
 * @param onChange - A callback function that is called when an icon is selected.
 */
const IconSelectGrid: React.FC<{
  labels: Required<
    Pick<
      DialogLabels,
      'noIconsFound' | 'searchClearButton' | 'searchFieldPlaceholder'
    >
  >;
  onChange: (icon: HeroIconName) => void;
}> = ({
  labels: { noIconsFound, searchClearButton, searchFieldPlaceholder },
  onChange
}) => {
  const { search, setSearch, icons } = useIconPicker();

  return (
    <div className="flex flex-col">
      <Input
        placeholder={searchFieldPlaceholder}
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mt-2 flex max-h-[400px] flex-wrap justify-between gap-2 overflow-y-auto py-4 pb-12">
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
            <p>{noIconsFound}</p>
            <Button
              onClick={() => setSearch('')}
              variant="outline"
              className="hover:cursor-pointer"
            >
              {searchClearButton}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
