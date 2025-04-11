import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@codeware/shared/ui/shadcn/components/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@codeware/shared/ui/shadcn/components/popover';
import {
  Color,
  type TailwindColor,
  tailwind
} from '@codeware/shared/util/tailwind';
import { cn } from '@codeware/shared/util/ui';
import { VariantProps } from 'class-variance-authority';
import { Paintbrush } from 'lucide-react';
import { useEffect, useState } from 'react';

type PopoverLabels = {
  noColorsFound?: string;
  searchFieldPlaceholder?: string;
};

type TriggerLabels = {
  labelChange?: (color: Color | null) => string;
  labelSelect?: string;
};

type Props = {
  /**
   * Custom popover labels.
   */
  labels?: PopoverLabels;

  /**
   * Custom popover trigger element and options.
   */
  trigger?: {
    onClick?: () => void;
  } & (
    | { element: (color: TailwindColor | null) => React.ReactNode }
    | (TriggerLabels & {
        buttonClassName?: string;
        buttonSize?: VariantProps<typeof Button>['size'];
        buttonVariant?: VariantProps<typeof Button>['variant'];
      })
  );

  /**
   * A callback function that is called when a color is selected.
   */
  onChange?: (color: TailwindColor | null) => void;

  /**
   * The initial color value of the color picker.
   */
  value?: TailwindColor | null;
};

const defaultLabels: Required<PopoverLabels & TriggerLabels> = {
  // Popover labels
  noColorsFound: 'No colors found...',
  searchFieldPlaceholder: 'Search color...',
  // Trigger labels
  labelChange: (color) => color?.name ?? defaultLabels.labelSelect,
  labelSelect: 'Pick a color'
};

export const ColorPicker: React.FC<Props> = ({
  labels,
  onChange,
  trigger,
  value
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TailwindColor | null>(value ?? null);

  useEffect(() => {
    setSelected(value ?? null);
  }, [value]);

  const {
    noColorsFound = defaultLabels.noColorsFound,
    searchFieldPlaceholder = defaultLabels.searchFieldPlaceholder
  } = labels ?? {};

  const { onClick = () => void 0 } = trigger ?? {};

  let triggerElement: (color: TailwindColor | null) => React.ReactNode;
  if (trigger && 'element' in trigger) {
    triggerElement = trigger.element;
  } else {
    const {
      buttonClassName = '',
      buttonSize = 'lg',
      buttonVariant = 'outline',
      labelChange = defaultLabels.labelChange,
      labelSelect = defaultLabels.labelSelect
    } = trigger ?? {};
    triggerElement = (color) => (
      <Button
        size={buttonSize}
        variant={buttonVariant}
        className={cn('hover:cursor-pointer', buttonClassName)}
        onClick={onClick}
      >
        <div className="flex w-full items-center gap-2">
          {color ? (
            <>
              <div
                className="h-4 w-4 rounded !bg-cover !bg-center transition-all"
                style={{ backgroundColor: tailwind.color(color) }}
              />
              <div className="flex-1 truncate">
                {labelChange({ code: tailwind.color(color), name: color })}
              </div>
            </>
          ) : (
            <>
              <Paintbrush className="size-4" />
              {labelSelect}
            </>
          )}
        </div>
      </Button>
    );
  }

  return (
    <div className="twp">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{triggerElement(selected)}</PopoverTrigger>

        {/* Render a searchable color grid */}
        <PopoverContent className="mb-[10px] p-0" side="right" align="start">
          <Command>
            <CommandInput
              placeholder={searchFieldPlaceholder}
              autoFocus={false}
            />
            <CommandList>
              <CommandEmpty>{noColorsFound}</CommandEmpty>
              <CommandGroup>
                <div className="grid grid-cols-11 gap-2">
                  {Object.entries(tailwind.colorMapRangeOnly).map(
                    ([name, code]) => (
                      <CommandItem
                        key={name}
                        value={name}
                        style={{ background: code }}
                        className={cn(
                          'size-6 cursor-pointer rounded-md hover:z-10 hover:scale-150',
                          {
                            'z-20 scale-150 border border-black':
                              name === selected
                          }
                        )}
                        onSelect={(name) => {
                          setSelected(name as TailwindColor);
                          setOpen(false);
                          onChange?.(name as TailwindColor);
                        }}
                      />
                    )
                  )}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
