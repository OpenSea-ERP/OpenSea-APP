'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ArrowLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface WizardStep {
  title: ReactNode;
  description?: string;
  /** Icon rendered centered in the left 200px column */
  icon: ReactNode;
  /** Step body content */
  content: ReactNode;
  /** Whether "Avançar" is enabled. Defaults to true. */
  isValid?: boolean;
  /** Custom footer replacing default back/next. Pass `<></>` for empty footer. */
  footer?: ReactNode;
  /** When set, renders a back arrow before the title in the header */
  onBack?: () => void;
}

interface StepWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: WizardStep[];
  /** 1-indexed current step */
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  cancelLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  /** Custom height class (default: "h-[490px]") */
  heightClass?: string;
}

export function StepWizardDialog({
  open,
  onOpenChange,
  steps,
  currentStep,
  onStepChange,
  onClose,
  cancelLabel = 'Cancelar',
  nextLabel = 'Avançar',
  backLabel = 'Voltar',
  heightClass = 'h-[490px]',
}: StepWizardDialogProps) {
  const stepIndex = currentStep - 1;
  const step = steps[stepIndex];
  if (!step) return null;

  const isFirst = currentStep === 1;
  const isLast = currentStep === steps.length;
  const canAdvance = step.isValid !== false;

  // Extract height value (e.g. "h-[490px]" -> "490px") so we can apply it on
  // desktop only via a CSS variable, while keeping mobile fullscreen.
  const heightMatch = heightClass.match(/h-\[(.+?)\]/);
  const desktopHeight = heightMatch?.[1] ?? '490px';

  return (
    <Dialog
      open={open}
      onOpenChange={val => {
        if (!val) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        fullscreenOnMobile
        style={{ '--wizard-h': desktopHeight } as React.CSSProperties}
        className="p-0 gap-0 overflow-hidden flex flex-col sm:w-[800px] sm:max-w-[800px] sm:flex-row sm:h-[var(--wizard-h)]"
        data-testid="email-account-wizard"
      >
        <VisuallyHidden>
          <DialogTitle>{step.title}</DialogTitle>
        </VisuallyHidden>

        {/* Left icon column — desktop only (hidden on mobile to free real estate) */}
        <div className="hidden sm:flex w-[200px] shrink-0 bg-slate-50 dark:bg-white/5 items-center justify-center border-r border-border/50">
          {step.icon}
        </div>

        {/* Right content column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-border/50 sm:border-b-0">
            {/* Mobile-only compact icon */}
            <div className="sm:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 [&>*]:!h-5 [&>*]:!w-5">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold leading-tight truncate">
                {step.title}
              </h2>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 -mr-1 -mt-1 h-8 w-8 flex items-center justify-center rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-2">
            {step.content}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4">
            {step.onBack && (
              <Button
                type="button"
                variant="ghost"
                onClick={step.onBack}
                className="mr-auto gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            )}
            <div
              className={
                step.onBack
                  ? 'flex items-center gap-2'
                  : 'flex items-center gap-2 w-full justify-end'
              }
            >
              {step.footer ?? (
                <>
                  {!step.onBack &&
                    (isFirst ? (
                      <Button type="button" variant="outline" onClick={onClose}>
                        {cancelLabel}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onStepChange(currentStep - 1)}
                      >
                        ← {backLabel}
                      </Button>
                    ))}
                  {!isLast && (
                    <Button
                      type="button"
                      disabled={!canAdvance}
                      onClick={() => onStepChange(currentStep + 1)}
                    >
                      {nextLabel} →
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
