'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavigationSection {
  id: string;
  label: string;
  icon: ReactNode;
  description?: string;
  hidden?: boolean;
}

export interface NavigationWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  variant?: 'compact' | 'detailed';
  children: ReactNode;
  footer: ReactNode;
  sectionErrors?: Record<string, boolean>;
  isPending?: boolean;
}

export function NavigationWizardDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  sections,
  activeSection,
  onSectionChange,
  variant = 'detailed',
  children,
  footer,
  sectionErrors,
  isPending,
}: NavigationWizardDialogProps) {
  const visibleSections = sections.filter(s => !s.hidden);

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={val => {
        if (!val) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[1000px] max-w-[1000px] h-[600px] p-0 gap-0 overflow-hidden flex flex-col"
        onPointerDownOutside={e => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (isPending) e.preventDefault();
        }}
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-lg font-semibold leading-none">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <nav
            className={cn(
              'shrink-0 border-r border-border/50 py-2 flex flex-col gap-0.5 overflow-y-auto',
              variant === 'compact' ? 'w-[140px] px-2' : 'w-[180px] px-2'
            )}
          >
            {visibleSections.map(section => {
              const isActive = section.id === activeSection;
              const hasError = sectionErrors?.[section.id];

              if (variant === 'compact') {
                return (
                  <button
                    key={section.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => onSectionChange(section.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors w-full disabled:pointer-events-none',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5'
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center p-1 rounded-md shrink-0',
                        isActive ? 'bg-blue-500/10' : 'text-muted-foreground'
                      )}
                    >
                      {section.icon}
                    </span>
                    <span className="truncate font-medium">
                      {section.label}
                    </span>
                    {hasError && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              }

              // detailed variant
              return (
                <button
                  key={section.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    'relative flex items-center gap-2.5 px-2 py-2 rounded-md text-left text-xs transition-colors w-full border-l-2 disabled:pointer-events-none',
                    isActive
                      ? 'border-l-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                      : 'border-l-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-white/60'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center p-1.5 rounded-md shrink-0',
                      isActive ? 'bg-blue-500/10' : 'text-muted-foreground'
                    )}
                  >
                    {section.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {section.label}
                    </span>
                    {section.description && (
                      <span className="block truncate text-[10px] text-muted-foreground mt-0.5">
                        {section.description}
                      </span>
                    )}
                  </div>
                  {hasError && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <ScrollArea className="flex-1 min-w-0">
            <div className="p-6">{children}</div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 shrink-0">
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}
