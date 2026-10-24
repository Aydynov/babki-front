import {
  Popover,
  Radio,
  RadioGroup,
} from '@base-ui/react';
import { cn } from '@/shared/lib/shadcn-utils';
import { LucideCheck } from 'lucide-react';
import {
  type FC,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORY_COLORS } from '../model/constants';

interface ColorPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  onBlur: () => void;
  disabled: boolean;
  hasError: boolean;
  label: string;
  describedBy?: string;
}

export const ColorPicker: FC<ColorPickerProps> = ({
  value,
  onValueChange,
  onBlur,
  disabled,
  hasError,
  label,
  describedBy,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) return;
    setOpen(nextOpen);
    if (!nextOpen) onBlur();
  };

  const closeAfterSelection = () => {
    onBlur();
    setOpen(false);
  };

  return (
    <Popover.Root
      open={disabled ? false : open}
      onOpenChange={handleOpenChange}
      modal="trap-focus"
    >
      <Popover.Trigger
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        onBlur={onBlur}
        className={cn(
          `
            flex size-[38px] items-center justify-center rounded-lg border bg-background
            transition-colors outline-none
            hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
            disabled:cursor-not-allowed disabled:opacity-50
          `,
          hasError && [
            'border-destructive',
            'focus-visible:border-destructive focus-visible:ring-destructive/20',
          ],
        )}
      >
        <span
          className={cn(
            'size-5 rounded-full',
            !value && 'border border-dashed border-muted-foreground',
          )}
          style={value ? { backgroundColor: value } : undefined}
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={8}
          className="z-70"
        >
          <Popover.Popup
            className="
              rounded-xl border bg-popover p-3 text-popover-foreground shadow-md outline-none
              data-ending-style:scale-95 data-ending-style:opacity-0
              data-starting-style:scale-95 data-starting-style:opacity-0
              transition-all duration-150
            "
          >
            <Popover.Title className="sr-only">{label}</Popover.Title>
            <RadioGroup
              value={value.toUpperCase()}
              onValueChange={onValueChange}
              className="grid grid-cols-5 gap-2.5"
              aria-label={label}
            >
              {CATEGORY_COLORS.map((color) => (
                <Radio.Root
                  key={color.value}
                  value={color.value}
                  aria-label={t(color.nameKey)}
                  onClick={closeAfterSelection}
                  className="
                    flex size-5 items-center justify-center rounded-full text-white outline-none
                    ring-offset-2 ring-offset-popover
                    focus-visible:ring-2 focus-visible:ring-ring
                    data-checked:ring-2 data-checked:ring-foreground
                  "
                  style={{ backgroundColor: color.value }}
                >
                  <Radio.Indicator>
                    <LucideCheck className="size-3.5 stroke-[3] drop-shadow-[0_1px_1px_#000]" />
                  </Radio.Indicator>
                </Radio.Root>
              ))}
            </RadioGroup>
            <Popover.Close className="sr-only">{t('expenseCategories.management.close')}</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
