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
  /** Optional badge rendered to the right of the label (e.g., permission counts) */
  badge?: ReactNode;
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
  /** Extra class names merged into DialogContent (e.g. for responsive max-width overrides) */
  contentClassName?: string;
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
  contentClassName,
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
        fullscreenOnMobile
        className={cn(
          'p-0 gap-0 overflow-hidden flex flex-col',
          // Desktop: 1000x600 fixed, horizontal layout
          'sm:w-[1000px] sm:max-w-[1000px] sm:h-[600px] sm:flex-row',
          contentClassName
        )}
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

        {/* Mobile header — title + close button (sidebar replaced by chip nav below) */}
        <div className="sm:hidden flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleClose}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md opacity-70 hover:opacity-100 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
        </div>

        {/* Mobile horizontal section nav (chips) */}
        <div className="sm:hidden border-b border-border/50 shrink-0 overflow-x-auto">
          <div className="flex gap-2 px-4 py-3 min-w-max">
            {visibleSections.map(section => {
              const isActive = section.id === activeSection;
              const hasError = sectionErrors?.[section.id];
              return (
                <button
                  key={section.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    'disabled:pointer-events-none disabled:opacity-50',
                    isActive
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-gray-600 dark:text-white/60'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-5 h-5 shrink-0 [&>*]:!h-4 [&>*]:!w-4',
                      isActive ? 'text-blue-600 dark:text-blue-400' : ''
                    )}
                  >
                    {section.icon}
                  </span>
                  {section.label}
                  {hasError && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Left column — full height, distinct background (DESKTOP ONLY) */}
        <div
          className={cn(
            'hidden sm:flex shrink-0 flex-col border-r border-border/50',
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
                  {section.badge && (
                    <span className="shrink-0">{section.badge}</span>
                  )}
                  {hasError && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right column — header + content + footer */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Desktop-only header — active section title */}
          {(() => {
            const active = visibleSections.find(s => s.id === activeSection);
            return (
              <div className="hidden sm:flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
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
          <ScrollArea className="flex-1 min-w-0 min-h-0">
            <div className="p-4 sm:p-6">{children}</div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 flex-wrap px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4">
            {footer}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
