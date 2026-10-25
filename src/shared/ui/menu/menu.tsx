import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/shadcn-utils';

export function Content({
  align = 'start', side = 'bottom', sideOffset = 8, anchor, className, ...props
}: ComponentProps<typeof MenuPrimitive.Popup>
  & Pick<MenuPrimitive.Positioner.Props, 'align' | 'side' | 'sideOffset' | 'anchor'>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
        collisionPadding={12}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          className={cn(
            `max-h-[min(32rem,var(--available-height))] w-72 max-w-[calc(100vw-1.5rem)]
            overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg
            outline-none transition-opacity duration-150
            data-starting-style:opacity-0 data-ending-style:opacity-0`,
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

const itemClassName = `flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none
  data-highlighted:bg-muted data-disabled:cursor-not-allowed data-disabled:opacity-50
  [&_svg]:size-4 [&_svg]:shrink-0`;

export function Item({ className, ...props }: ComponentProps<typeof MenuPrimitive.Item>) {
  return <MenuPrimitive.Item className={cn(itemClassName, className)} {...props} />;
}

export function SubmenuTrigger({ className, ...props }: ComponentProps<typeof MenuPrimitive.SubmenuTrigger>) {
  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(itemClassName, className)}
      openOnHover
      {...props}
    />
  );
}

export function LinkItem({ className, ...props }: ComponentProps<typeof MenuPrimitive.LinkItem>) {
  return (
    <MenuPrimitive.LinkItem
      className={cn(itemClassName, className)}
      closeOnClick
      {...props}
    />
  );
}

export function RadioItem({ className, ...props }: ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(itemClassName, className)}
      closeOnClick
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<typeof MenuPrimitive.GroupLabel>) {
  return <MenuPrimitive.GroupLabel className={cn('px-3 py-2 text-xs text-muted-foreground', className)} {...props} />;
}

export function Separator() {
  return <MenuPrimitive.Separator className="mx-2 my-1 h-px bg-border" />;
}
