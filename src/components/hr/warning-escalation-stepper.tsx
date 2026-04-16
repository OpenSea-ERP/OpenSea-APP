'use client';

/**
 * WarningEscalationStepper
 *
 * Visualização horizontal da escala disciplinar progressiva (CLT) para a página
 * de detalhe de advertência. Renderiza quatro passos em sequência, conectados
 * por uma linha contínua, evidenciando ao gestor:
 *
 *   - Passos já alcançados pelo funcionário (check em emerald)
 *   - O passo correspondente à advertência atual em foco (gradient indigo->violet)
 *   - Passos futuros ainda não atingidos (cinza desabilitado)
 *
 * Inspirações: Lattice (review cycle stages), Stripe (onboarding stepper),
 * Linear (cycle progress), BambooHR (PTO approval flow).
 *
 * Acessibilidade: cada passo carrega `aria-current="step"` quando ativo e
 * `data-testid` estável (`warning-step-{TYPE}`) para uso em testes E2E.
 */

import { cn } from '@/lib/utils';
import {
  WARNING_ESCALATION_ORDER,
  getEscalationStepDescription,
  getEscalationStepIndex,
  getEscalationStepLabel,
  getHighestEscalationReached,
} from '@/lib/hr/warning-escalation';
import type { EmployeeWarning, WarningType } from '@/types/hr';
import {
  Check,
  FileText,
  MessageCircle,
  Pause,
  XOctagon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

const STEP_ICONS: Record<WarningType, LucideIcon> = {
  VERBAL: MessageCircle,
  WRITTEN: FileText,
  SUSPENSION: Pause,
  TERMINATION_WARNING: XOctagon,
};

type StepStatus = 'completed' | 'current' | 'pending';

interface StepDescriptor {
  type: WarningType;
  label: string;
  description: string;
  icon: LucideIcon;
  status: StepStatus;
  occurredAt?: string;
}

interface WarningEscalationStepperProps {
  /** Tipo da advertência atual em foco no detalhe (passo destacado). */
  currentType: WarningType;
  /**
   * Histórico completo de advertências do funcionário. Usado para marcar
   * passos anteriores como concluídos e exibir a data em que ocorreram.
   */
  previousWarnings: EmployeeWarning[];
  className?: string;
}

function formatStepDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Devolve a data mais recente em que o funcionário recebeu uma advertência
 * de determinado tipo (entre as ATIVAS), ou `undefined` se nunca ocorreu.
 */
function findMostRecentOccurrence(
  warnings: EmployeeWarning[],
  type: WarningType
): string | undefined {
  const matchingWarnings = warnings
    .filter(warning => warning.type === type && warning.status !== 'REVOKED')
    .map(warning => warning.incidentDate)
    .sort((firstDate, secondDate) => secondDate.localeCompare(firstDate));
  return matchingWarnings[0];
}

export function WarningEscalationStepper({
  currentType,
  previousWarnings,
  className,
}: WarningEscalationStepperProps) {
  const currentIndex = getEscalationStepIndex(currentType);
  const highestReached = useMemo(
    () => getHighestEscalationReached(previousWarnings),
    [previousWarnings]
  );
  const highestReachedIndex = highestReached
    ? getEscalationStepIndex(highestReached)
    : -1;

  const steps: StepDescriptor[] = useMemo(() => {
    return WARNING_ESCALATION_ORDER.map(type => {
      const stepIndex = getEscalationStepIndex(type);
      let status: StepStatus;
      if (stepIndex === currentIndex) {
        status = 'current';
      } else if (
        stepIndex < currentIndex ||
        stepIndex <= highestReachedIndex
      ) {
        status = 'completed';
      } else {
        status = 'pending';
      }
      return {
        type,
        label: getEscalationStepLabel(type),
        description: getEscalationStepDescription(type),
        icon: STEP_ICONS[type],
        status,
        occurredAt: findMostRecentOccurrence(previousWarnings, type),
      };
    });
  }, [currentIndex, highestReachedIndex, previousWarnings]);

  // Progresso da linha conectora: 0 a 100, baseado no passo atual.
  const totalSegments = WARNING_ESCALATION_ORDER.length - 1;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentIndex / totalSegments) * 100)
  );

  return (
    <div
      data-testid="warning-stepper"
      className={cn('w-full', className)}
      role="group"
      aria-label="Escala disciplinar progressiva"
    >
      <div className="relative">
        {/* Linha conectora de fundo (cinza) */}
        <div
          className="absolute top-6 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700"
          aria-hidden="true"
        />
        {/* Linha conectora de progresso (gradient) */}
        <div
          className="absolute top-6 left-6 h-0.5 bg-linear-to-r from-emerald-500 via-indigo-500 to-violet-500 transition-all duration-500"
          style={{
            width: `calc((100% - 3rem) * ${progressPercent / 100})`,
          }}
          aria-hidden="true"
        />

        <ol className="relative grid grid-cols-4 gap-2">
          {steps.map(step => (
            <StepNode key={step.type} step={step} />
          ))}
        </ol>
      </div>
    </div>
  );
}

interface StepNodeProps {
  step: StepDescriptor;
}

function StepNode({ step }: StepNodeProps) {
  const Icon = step.icon;
  const isCurrent = step.status === 'current';
  const isCompleted = step.status === 'completed';

  return (
    <li
      data-testid={`warning-step-${step.type}`}
      aria-current={isCurrent ? 'step' : undefined}
      className="flex flex-col items-center text-center"
    >
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
          isCurrent &&
            'bg-linear-to-br from-indigo-500 to-violet-600 border-violet-600 text-white shadow-md ring-4 ring-violet-500/15',
          isCompleted &&
            'bg-emerald-500 border-emerald-600 text-white shadow-sm',
          !isCurrent &&
            !isCompleted &&
            'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'
        )}
      >
        {isCompleted ? (
          <Check className="h-5 w-5" strokeWidth={3} />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      <div className="mt-3 px-1">
        <p
          className={cn(
            'text-sm font-semibold',
            isCurrent && 'text-violet-700 dark:text-violet-300',
            isCompleted && 'text-emerald-700 dark:text-emerald-300',
            !isCurrent &&
              !isCompleted &&
              'text-slate-500 dark:text-slate-400'
          )}
        >
          {step.label}
        </p>
        {step.occurredAt && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatStepDate(step.occurredAt)}
          </p>
        )}
        <p
          className={cn(
            'mt-1 text-xs leading-snug',
            isCurrent || isCompleted
              ? 'text-muted-foreground'
              : 'text-slate-400 dark:text-slate-500'
          )}
        >
          {step.description}
        </p>
      </div>
    </li>
  );
}

export default WarningEscalationStepper;
