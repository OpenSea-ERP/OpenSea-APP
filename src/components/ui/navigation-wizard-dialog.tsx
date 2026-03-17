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
        className="sm:max-w-[1000px] max-w-[1000px] h-[600px] p-0 gap-0 overflow-hidden flex flex-row"
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

        {/* Left column — full height, distinct background */}
        <div
          className={cn(
            'shrink-0 flex flex-col border-r border-border/50',
            'bg-slate-50 dark:bg-white/[0.03]',
            variant === 'compact' ? 'w-[210px]' : 'w-[270px]'
          )}
        >
          {/* Nav header area */}
          <div className="px-4 pt-5 pb-3">
            <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
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
                      'relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                      'disabled:pointer-events-none disabled:opacity-50',
                      isActive
                        ? 'bg-white dark:bg-white/10 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08] text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/[0.06]'
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors',
                        isActive
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-200/60 dark:bg-white/10 text-gray-500 dark:text-white/50'
                      )}
                    >
                      {section.icon}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-white/80'
                      )}
                    >
                      {section.label}
                    </span>
                    {hasError && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              }

              // detailed variant — card-like items
              return (
                <button
                  key={section.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    'relative flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-left transition-all duration-200',
                    'disabled:pointer-events-none disabled:opacity-50',
                    isActive
                      ? 'bg-white dark:bg-white/10 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08] text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/[0.06]'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors',
                      isActive
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-200/60 dark:bg-white/10 text-gray-500 dark:text-white/50'
                    )}
                  >
                    {section.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block text-sm font-medium truncate',
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-white/80'
                      )}
                    >
                      {section.label}
                    </span>
                    {section.description && (
                      <span className="block text-[11px] text-muted-foreground truncate mt-0.5">
                        {section.description}
                      </span>
                    )}
                  </div>
                  {hasError && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right column — header + content + footer */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header — active section title */}
          {(() => {
            const active = visibleSections.find(s => s.id === activeSection);
            return (
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-3">
                  {active && (
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      {active.icon}
                    </span>
                  )}
                  <div>
                    <h3 className="text-base font-semibold leading-none">
                      {active?.label ?? ''}
                    </h3>
                    {active?.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {active.description}
                      </p>
                    )}
                  </div>
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
            );
          })()}

          {/* Content */}
          <ScrollArea className="flex-1 min-w-0">
            <div className="p-6">{children}</div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 shrink-0">
            {footer}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
