import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/shadcn-utils';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { LucideX } from 'lucide-react';
import type {
  ComponentProps, FC, ReactNode, Ref,
} from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

export const ScrollDialogBase = Dialog.Base;

export const ScrollDialogContent: FC<ComponentProps<typeof Dialog.Content>> = ({ className, ...props }) => (
  <Dialog.Content
    className={cn('relative flex max-w-2xl flex-col overflow-hidden', className)}
    {...props}
  />
);

export interface ScrollDialogLayoutProps {
  title: ReactNode;
  closeLabel: string;
  onClose: () => void;
  closeRef?: Ref<HTMLButtonElement>;
  closeDisabled?: boolean;
  actions?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
}

export const ScrollDialogLayout: FC<ScrollDialogLayoutProps> = ({
  title,
  closeLabel,
  onClose,
  closeRef,
  closeDisabled = false,
  actions,
  headerActions,
  children,
}) => {
  const hasActions = Boolean(actions);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerOverlap, setHeaderOverlap] = useState(32);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    const updateOverlap = () => {
      const topPadding = Number.parseFloat(getComputedStyle(header).paddingTop);
      setHeaderOverlap(Math.ceil(header.getBoundingClientRect().height - topPadding));
    };
    updateOverlap();
    const observer = new ResizeObserver(updateOverlap);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Dialog.Header
        ref={headerRef}
        className="
          absolute inset-x-0 top-0 z-10 flex-wrap pt-4 pr-14 pb-1 pl-4
          backdrop-blur-[2px] sm:flex-nowrap sm:pt-5 sm:pr-15 sm:pl-5
        "
      >
        <Dialog.Title>{title}</Dialog.Title>
        {headerActions}
        <Button.Icon
          type="button"
          className="absolute top-4 right-4 sm:top-5 sm:right-5"
          ref={closeRef}
          onClick={onClose}
          aria-label={closeLabel}
          disabled={closeDisabled}
        >
          <LucideX />
        </Button.Icon>
      </Dialog.Header>
      <ScrollArea.Root className="-mx-1 -mb-1 flex min-h-0 flex-1 flex-col">
        <ScrollArea.Viewport
          className={`min-h-0 flex-1 scroll-py-1 p-1 outline-none ${hasActions ? 'scroll-pb-11 pb-11' : ''}`}
          style={{
            overflowX: 'hidden',
            overflowY: 'auto',
            paddingTop: headerOverlap + 16,
            scrollPaddingTop: headerOverlap + 4,
          }}
        >
          <ScrollArea.Content render={<Dialog.Body className="mt-0 break-words" />} style={{ minWidth: 0 }}>
            {children}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex w-1.5 rounded-full"
          style={{ top: headerOverlap + 4, bottom: hasActions ? 44 : 4, insetInlineEnd: -8 }}
        >
          <ScrollArea.Thumb className="w-full rounded-full bg-foreground/25" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      {hasActions && (
        <Dialog.Footer className="
          absolute inset-x-0 bottom-0 z-10 mt-0
          px-4 pt-1 pb-4 backdrop-blur-[2px] sm:px-5
        "
        >
          {actions}
        </Dialog.Footer>
      )}
    </>
  );
};
