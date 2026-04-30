'use client';

import * as React from 'react';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className
      )}
      style={{ backgroundColor: 'var(--modal-overlay)' }}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  fullscreenOnMobile = false,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  /**
   * When true, the dialog renders truly fullscreen on mobile (< sm) — no
   * margins, no rounded corners, no border. On sm+ the caller's className
   * (max-width / rounded / border / etc.) takes over normally.
   */
  fullscreenOnMobile?: boolean;
}) {
  // CRITICAL: borderRadius/borderColor are intentionally OMITTED from inline
  // style when fullscreenOnMobile, otherwise they would override the
  // `rounded-none`/`border-0` Tailwind classes (inline styles beat classes).
  // For sm+ we re-apply them via arbitrary-value Tailwind classes.
  const baseStyle: React.CSSProperties = fullscreenOnMobile
    ? {
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--modal-text)',
      }
    : {
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--modal-text)',
        borderColor: 'var(--modal-border)',
        borderRadius: 'var(--modal-radius)',
      };

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Base layout (positioning + animations)
          'fixed top-[50%] left-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          // Default dialog look (margins, rounded, border, padding) — only when NOT fullscreen-on-mobile
          !fullscreenOnMobile &&
            'w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 sm:max-w-lg',
          // Fullscreen-on-mobile look. Border + radius come from arbitrary
          // Tailwind classes only on sm+, so the mobile fullscreen state
          // never has them and inline styles don't fight class overrides.
          fullscreenOnMobile && [
            'w-screen h-[100dvh] max-w-none rounded-none border-0',
            'sm:h-auto sm:border sm:[border-color:var(--modal-border)] sm:[border-radius:var(--modal-radius)]',
          ],
          className
        )}
        style={{
          ...baseStyle,
          ...style,
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Fechar</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
