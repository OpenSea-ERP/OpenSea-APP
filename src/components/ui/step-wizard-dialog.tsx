'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface WizardStep {
  title: string;
  description?: string;
  /** Icon rendered centered in the left 200px column */
  icon: ReactNode;
  /** Step body content */
  content: ReactNode;
  /** Whether "Avançar" is enabled. Defaults to true. */
  isValid?: boolean;
  /** Custom footer replacing default back/next. Pass `<></>` for empty footer. */
  footer?: ReactNode;
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
}: StepWizardDialogProps) {
  const stepIndex = currentStep - 1;
  const step = steps[stepIndex];
  if (!step) return null;

  const isFirst = currentStep === 1;
  const isLast = currentStep === steps.length;
  const canAdvance = step.isValid !== false;

  return (
    <Dialog
      open={open}
      onOpenChange={val => {
        if (!val) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[800px] max-w-[800px] h-[420px] p-0 gap-0 overflow-hidden flex flex-row"
        data-testid="email-account-wizard"
      >
        {/* Left icon column */}
        <div className="w-[200px] shrink-0 bg-white/5 flex items-center justify-center border-r border-border/50">
          {step.icon}
        </div>

        {/* Right content column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h2 className="text-lg font-semibold leading-none">
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
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-2">{step.content}</div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50">
            {step.footer ?? (
              <>
                {isFirst ? (
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
                )}
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
      </DialogContent>
    </Dialog>
  );
}
