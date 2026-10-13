import { Dialog as DialogPrimitive } from '@base-ui/react';
import { cn } from '@/shared/lib/shadcn-utils';
import { Typography } from '@/shared/ui/typography';
import type { ComponentProps, FC } from 'react';

const DialogBase = DialogPrimitive.Root;

const DialogContent: FC<ComponentProps<typeof DialogPrimitive.Popup>> = ({
  className,
  children,
  ...props
}) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Backdrop
      forceRender
      className={cn(
        `
          fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[2px]
          data-ending-style:opacity-0 data-starting-style:opacity-0
          transition-opacity duration-200
        `,
      )}
    />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <DialogPrimitive.Popup
        className={cn(
          `
            pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto
            rounded-xl border bg-card p-4 shadow-xl sm:p-5
            data-ending-style:scale-95 data-ending-style:opacity-0
            data-starting-style:scale-95 data-starting-style:opacity-0
            transition-all duration-200
          `,
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </div>
  </DialogPrimitive.Portal>
);

const DialogHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex items-start justify-between gap-4', className)} {...props} />
);

const DialogBody = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('mt-5 flex flex-col gap-4', className)} {...props} />
);

const DialogFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('mt-6 flex flex-wrap items-center justify-end gap-3', className)} {...props} />
);

const DialogTitle = (props: Typography.IVariantProps) => (
  <DialogPrimitive.Title
    render={<Typography.Title1 {...props} />}
  />
);

const DialogDescription = ({ className, ...props }: ComponentProps<'p'>) => (
  <DialogPrimitive.Description
    render={<Typography.Body3 className={cn('text-muted-foreground', className)} {...props} />}
  />
);

export {
  DialogBase,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
