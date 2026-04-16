'use client';

/**
 * OpenSea OS - Register Salary Change Modal
 *
 * Wizard de 2 passos para registrar uma mudança salarial sensível:
 *  1) Detalhes da mudança (novo salário, motivo, data, notas)
 *  2) Confirmação + PIN de Ação (operação ultra-sensível CLT)
 *
 * Sempre requer PIN — alinhado à regra global de ações destrutivas
 * e à seção HR-specific "Sensitive operations (PIN required)".
 */

import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useVerifyActionPin } from '@/hooks/use-pins';
import { translateError } from '@/lib/error-messages';
import { cn } from '@/lib/utils';
import {
  calculateAbsoluteChange,
  calculatePercentChange,
  formatAbsoluteChange,
  formatPercentChange,
  getReasonDescription,
  getReasonLabel,
  type SalaryChangeReason,
} from '@/lib/hr/calculate-salary-change';
import {
  CheckCircle2,
  DollarSign,
  Loader2,
  Rocket,
  Shield,
  Sparkles,
  Sprout,
  UserCog,
  Wand2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const REASON_ORDER: SalaryChangeReason[] = [
  'ADJUSTMENT',
  'PROMOTION',
  'MERIT',
  'ROLE_CHANGE',
  'CORRECTION',
  'ADMISSION',
];

const REASON_ICON_MAP: Record<SalaryChangeReason, LucideIcon> = {
  ADMISSION: Sprout,
  ADJUSTMENT: Wand2,
  PROMOTION: Rocket,
  MERIT: Sparkles,
  ROLE_CHANGE: UserCog,
  CORRECTION: Wrench,
};

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return BRL_FORMATTER.format(value);
}

function toIsoDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface RegisterSalaryChangePayload {
  newSalary: number;
  reason: SalaryChangeReason;
  notes?: string;
  effectiveDate: string;
  pin: string;
}

interface RegisterSalaryChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  currentSalary: number | null;
  isSubmitting?: boolean;
  /** Lista de motivos disponíveis. Default: todos exceto ADMISSION. */
  availableReasons?: SalaryChangeReason[];
  onSubmit: (payload: RegisterSalaryChangePayload) => Promise<void>;
}

export function RegisterSalaryChangeModal({
  open,
  onOpenChange,
  employeeName,
  currentSalary,
  isSubmitting = false,
  availableReasons = REASON_ORDER.filter(reason => reason !== 'ADMISSION'),
  onSubmit,
}: RegisterSalaryChangeModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [newSalary, setNewSalary] = useState<number | null>(null);
  const [reason, setReason] = useState<SalaryChangeReason>(availableReasons[0]);
  const [effectiveDate, setEffectiveDate] = useState<string>(() =>
    toIsoDateInput(new Date())
  );
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState('');

  const verifyPin = useVerifyActionPin();

  // Reset state every time modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setNewSalary(null);
      setReason(availableReasons[0]);
      setEffectiveDate(toIsoDateInput(new Date()));
      setNotes('');
      setPin('');
    }
  }, [open, availableReasons]);

  const percentChange = useMemo(
    () =>
      newSalary !== null ? calculatePercentChange(currentSalary, newSalary) : 0,
    [currentSalary, newSalary]
  );

  const absoluteChange = useMemo(
    () =>
      newSalary !== null
        ? calculateAbsoluteChange(currentSalary, newSalary)
        : 0,
    [currentSalary, newSalary]
  );

  const direction =
    newSalary === null || currentSalary === null
      ? 'initial'
      : newSalary > currentSalary
        ? 'increase'
        : newSalary < currentSalary
          ? 'decrease'
          : 'unchanged';

  const directionBadgeClass =
    direction === 'increase'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300'
      : direction === 'decrease'
        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300';

  const isStep1Valid =
    newSalary !== null && newSalary > 0 && !!reason && !!effectiveDate;

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!newSalary || pin.length !== 4) return;

    try {
      const verification = await verifyPin.mutateAsync({ actionPin: pin });
      if (!verification.valid) {
        toast.error('PIN incorreto. Tente novamente.');
        setPin('');
        return;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao verificar PIN';
      toast.error(translateError(message));
      setPin('');
      return;
    }

    try {
      await onSubmit({
        newSalary,
        reason,
        notes: notes.trim() ? notes.trim() : undefined,
        effectiveDate: new Date(`${effectiveDate}T12:00:00`).toISOString(),
        pin,
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao registrar mudança salarial';
      toast.error(translateError(message));
    }
  };

  const stepDetails: WizardStep = {
    title: 'Detalhes da mudança',
    description: `Funcionário: ${employeeName}`,
    icon: (
      <DollarSign className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
    ),
    isValid: isStep1Valid,
    content: (
      <div className="space-y-5" data-testid="salary-change-step-details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Salário atual</Label>
            <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 font-mono text-sm">
              {formatBRL(currentSalary)}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary-change-new">
              Novo salário <span className="text-rose-500">*</span>
            </Label>
            <CurrencyInput
              id="salary-change-new"
              value={newSalary}
              onChange={setNewSalary}
              data-testid="salary-change-new-salary"
              autoFocus
              allowNegative={false}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Motivo <span className="text-rose-500">*</span>
          </Label>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            data-testid="salary-change-reason-grid"
          >
            {availableReasons.map(reasonOption => {
              const Icon = REASON_ICON_MAP[reasonOption];
              const isActive = reason === reasonOption;
              return (
                <button
                  key={reasonOption}
                  type="button"
                  onClick={() => setReason(reasonOption)}
                  data-testid={`salary-change-reason-${reasonOption.toLowerCase()}`}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                    'hover:border-emerald-400/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                    isActive
                      ? 'border-emerald-500 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                      : 'border-border bg-white dark:bg-slate-900/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-muted-foreground'
                      )}
                    />
                    <span className="text-sm font-medium">
                      {getReasonLabel(reasonOption)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {getReasonDescription(reason)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary-change-effective-date">
            Data efetiva <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="salary-change-effective-date"
            type="date"
            value={effectiveDate}
            onChange={event => setEffectiveDate(event.target.value)}
            data-testid="salary-change-effective-date"
          />
          <p className="text-xs text-muted-foreground">
            Quando a vigência é hoje ou anterior, o salário base do funcionário
            é atualizado automaticamente.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary-change-notes">Notas (opcional)</Label>
          <Textarea
            id="salary-change-notes"
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Justifique a mudança, cite acordo coletivo, decisão de comitê, etc."
            rows={3}
            maxLength={2048}
            data-testid="salary-change-notes"
          />
          <p className="text-right text-xs text-muted-foreground">
            {notes.length}/2048
          </p>
        </div>
      </div>
    ),
  };

  const stepConfirmation: WizardStep = {
    title: 'Confirmação e PIN',
    description: 'Revise os dados e confirme com o PIN de Ação.',
    icon: <Shield className="h-16 w-16 text-amber-500" strokeWidth={1.2} />,
    onBack: () => setCurrentStep(1),
    content: (
      <div className="space-y-5" data-testid="salary-change-step-confirmation">
        <div className="rounded-xl border border-border bg-slate-50 p-5 dark:bg-slate-900/40">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Resumo da mudança
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                directionBadgeClass
              )}
            >
              {getReasonLabel(reason)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Salário atual
              </p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {formatBRL(currentSalary)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Novo salário
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                {formatBRL(newSalary)}
              </p>
            </div>
          </div>

          {direction !== 'initial' && direction !== 'unchanged' && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-sm font-semibold',
                  directionBadgeClass
                )}
                data-testid="salary-change-percent"
              >
                {formatPercentChange(percentChange)}
              </span>
              <span
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-sm',
                  directionBadgeClass
                )}
              >
                {formatAbsoluteChange(absoluteChange)}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                Vigência:{' '}
                {new Date(`${effectiveDate}T12:00:00`).toLocaleDateString(
                  'pt-BR'
                )}
              </span>
            </div>
          )}

          {notes.trim() && (
            <p className="mt-4 rounded-lg border border-border bg-white p-3 text-sm text-foreground/80 dark:bg-slate-800/40">
              {notes.trim()}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/5 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Operação sensível (CLT). O registro será auditado e o PIN de Ação
              é obrigatório.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-center block">
            PIN de Ação <span className="text-rose-500">*</span>
          </Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={setPin}
              data-testid="salary-change-pin"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} masked />
                <InputOTPSlot index={1} masked />
                <InputOTPSlot index={2} masked />
                <InputOTPSlot index={3} masked />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
      </div>
    ),
    isValid: pin.length === 4,
    footer: (
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={
          isSubmitting ||
          verifyPin.isPending ||
          pin.length !== 4 ||
          !isStep1Valid
        }
        data-testid="salary-change-submit"
      >
        {isSubmitting || verifyPin.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        Registrar mudança
      </Button>
    ),
  };

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={handleClose}
      steps={[stepDetails, stepConfirmation]}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
