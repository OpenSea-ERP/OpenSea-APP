import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Mail,
  MessageCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  TIMELINE_STATUS_LABELS,
  type EscalationTimelineStep,
  type EscalationTimelineStepStatus,
} from '@/types/finance';
import { EscalationTimeline } from './escalation-timeline';

// ============================================================================
// VISUAL REPLICA
// ----------------------------------------------------------------------------
// O componente real consome `useEscalationTimeline(entryId, isOverdue)` que
// dispara TanStack Query. Em Storybook a query não resolve, então as stories
// abaixo usam uma réplica visual que aceita os steps via prop e renderiza
// exatamente o mesmo layout (Card colapsável + linha do tempo vertical).
// ============================================================================

function getChannelIcon(channel: string) {
  switch (channel) {
    case 'E-mail':
      return Mail;
    case 'WhatsApp':
      return MessageCircle;
    case 'Nota Interna':
      return FileText;
    default:
      return Bell;
  }
}

function getStatusDotClasses(status: EscalationTimelineStepStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500 ring-emerald-500/20';
    case 'FAILED':
      return 'bg-rose-500 ring-rose-500/20';
    case 'PENDING':
      return 'bg-amber-500 ring-amber-500/20';
    case 'SCHEDULED':
      return 'bg-slate-400 dark:bg-slate-500 ring-slate-400/20 dark:ring-slate-500/20';
  }
}

function getStatusBadgeClasses(status: EscalationTimelineStepStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20';
    case 'FAILED':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 border-rose-200 dark:border-rose-500/20';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300 border-amber-200 dark:border-amber-500/20';
    case 'SCHEDULED':
      return 'bg-slate-50 text-slate-600 dark:bg-slate-500/8 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
  }
}

function getStatusIcon(status: EscalationTimelineStepStatus) {
  switch (status) {
    case 'COMPLETED':
      return CheckCircle2;
    case 'FAILED':
      return XCircle;
    case 'PENDING':
      return Clock;
    case 'SCHEDULED':
      return Clock;
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function TimelineStepItem({
  step,
  isLast,
  isCurrent,
}: {
  step: EscalationTimelineStep;
  isLast: boolean;
  isCurrent: boolean;
}) {
  const ChannelIcon = getChannelIcon(step.channel);
  const StatusIcon = getStatusIcon(step.status);
  const isFuture = step.status === 'SCHEDULED';

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4',
            getStatusDotClasses(step.status),
            isCurrent && 'ring-8'
          )}
        >
          <StatusIcon className="h-4 w-4 text-white" aria-hidden />
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-8',
              isFuture
                ? 'border-l-2 border-dashed border-slate-300 dark:border-slate-600'
                : 'bg-slate-200 dark:bg-slate-700'
            )}
          />
        )}
      </div>

      <div
        className={cn(
          'flex-1 mb-6 rounded-lg border p-4 transition-colors',
          isCurrent
            ? 'border-primary/30 bg-primary/5 dark:bg-primary/5'
            : isFuture
              ? 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
              : 'border-border bg-white dark:bg-slate-800/60'
        )}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                isFuture
                  ? 'bg-slate-100 dark:bg-slate-700/50'
                  : 'bg-slate-100 dark:bg-slate-700'
              )}
            >
              <ChannelIcon
                className={cn(
                  'h-4 w-4',
                  isFuture
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-600 dark:text-slate-300'
                )}
                aria-hidden
              />
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  isFuture && 'text-muted-foreground'
                )}
              >
                {step.channel}
              </p>
              <p className="text-xs text-muted-foreground">
                Etapa {step.stepNumber}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn('text-xs', getStatusBadgeClasses(step.status))}
            aria-label={`Status: ${TIMELINE_STATUS_LABELS[step.status]}`}
          >
            {TIMELINE_STATUS_LABELS[step.status]}
          </Badge>
        </div>

        <p
          className={cn(
            'mt-2.5 text-sm',
            isFuture ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {step.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {step.executedDate && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Executado: {formatDate(step.executedDate)}
            </span>
          )}
          {step.scheduledDate && !step.executedDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {step.status === 'SCHEDULED' ? 'Previsão' : 'Programado'}:{' '}
              {formatDateShort(step.scheduledDate)}
            </span>
          )}
        </div>

        {step.messagePreview && (
          <div
            className={cn(
              'mt-2.5 rounded-md border px-3 py-2 text-xs',
              isFuture
                ? 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-muted-foreground'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
            )}
          >
            <span className="font-medium text-muted-foreground">
              Mensagem:{' '}
            </span>
            {step.messagePreview}
          </div>
        )}
      </div>
    </div>
  );
}

interface TimelineReplicaProps {
  steps: EscalationTimelineStep[];
  currentStep: number;
  totalSteps: number;
}

function EscalationTimelineReplica({
  steps,
  currentStep,
  totalSteps,
}: TimelineReplicaProps) {
  const [isOpen, setIsOpen] = useState(true);

  const counts = {
    completed: steps.filter(s => s.status === 'COMPLETED').length,
    failed: steps.filter(s => s.status === 'FAILED').length,
    pending: steps.filter(s => s.status === 'PENDING').length,
    scheduled: steps.filter(s => s.status === 'SCHEDULED').length,
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer select-none hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                Régua de Cobrança
                <Badge variant="secondary" className="ml-1">
                  {currentStep}/{totalSteps}
                </Badge>
              </CardTitle>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
                aria-hidden
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="mb-5 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {counts.completed} concluído(s)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                {counts.failed} falha(s)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {counts.pending} pendente(s)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                {counts.scheduled} agendado(s)
              </span>
            </div>

            <div className="relative">
              {steps.map((step, index) => (
                <TimelineStepItem
                  key={step.stepNumber}
                  step={step}
                  isLast={index === steps.length - 1}
                  isCurrent={step.stepNumber === currentStep}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ============================================================================
// FIXTURES
// ============================================================================

const inProgressSteps: EscalationTimelineStep[] = [
  {
    stepNumber: 1,
    type: 'WHATSAPP',
    status: 'COMPLETED',
    channel: 'WhatsApp',
    description: 'Lembrete amigável enviado ao celular cadastrado.',
    executedDate: '2025-05-16T09:30:00Z',
    messagePreview:
      'Olá Aluguel - Sala 12, identificamos vencimento em aberto desde 15/05/2025...',
  },
  {
    stepNumber: 2,
    type: 'EMAIL',
    status: 'COMPLETED',
    channel: 'E-mail',
    description: 'Aviso formal enviado para joao@empresa.com.br.',
    executedDate: '2025-05-19T14:15:00Z',
    messagePreview: 'Prezado(a), comunicamos que o título REC-0042 está...',
  },
  {
    stepNumber: 3,
    type: 'WHATSAPP',
    status: 'PENDING',
    channel: 'WhatsApp',
    description: 'Tentativa em andamento — aguardando confirmação de leitura.',
    scheduledDate: '2025-05-22',
  },
  {
    stepNumber: 4,
    type: 'EMAIL',
    status: 'SCHEDULED',
    channel: 'E-mail',
    description: 'Aviso urgente programado para 7 dias após o último contato.',
    scheduledDate: '2025-05-29',
  },
  {
    stepNumber: 5,
    type: 'INTERNAL_NOTE',
    status: 'SCHEDULED',
    channel: 'Nota Interna',
    description:
      'Após 30 dias sem retorno, o caso é encaminhado para o jurídico.',
    scheduledDate: '2025-06-15',
  },
];

const completedSteps: EscalationTimelineStep[] = inProgressSteps.map(s => ({
  ...s,
  status: 'COMPLETED' as const,
  executedDate:
    s.executedDate ?? `2025-05-${20 + (s.stepNumber - 1) * 3}T10:00:00Z`,
  scheduledDate: undefined,
}));

const withFailureSteps: EscalationTimelineStep[] = [
  inProgressSteps[0],
  {
    stepNumber: 2,
    type: 'WHATSAPP',
    status: 'FAILED',
    channel: 'WhatsApp',
    description: 'Tentativa de envio falhou — número inválido ou bloqueado.',
    executedDate: '2025-05-19T14:20:00Z',
  },
  {
    stepNumber: 3,
    type: 'EMAIL',
    status: 'PENDING',
    channel: 'E-mail',
    description: 'Reenvio programado via e-mail após falha no WhatsApp.',
    scheduledDate: '2025-05-22',
  },
];

// ============================================================================
// META
// ============================================================================

const meta = {
  title: 'Modules/Finance/EscalationTimeline',
  component: EscalationTimeline,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Linha do tempo (Régua de Cobrança) das tentativas automáticas de cobrança quando um lançamento entra em atraso — alterna entre WhatsApp, E-mail, Nota Interna e Alerta do Sistema. Cada etapa carrega status (Concluído/Falhou/Pendente/Agendado), data executada/programada e preview da mensagem. **Stories usam réplica visual** porque o componente real depende do hook `useEscalationTimeline`.',
      },
    },
  },
} satisfies Meta<typeof EscalationTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// STORIES
// ============================================================================

export const InProgress: Story = {
  render: () => (
    <EscalationTimelineReplica
      steps={inProgressSteps}
      currentStep={3}
      totalSteps={5}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Régua em andamento — etapas 1 e 2 concluídas, etapa 3 pendente (atual, com ring destacado), etapas 4 e 5 agendadas (linha tracejada).',
      },
    },
  },
};

export const Completed: Story = {
  render: () => (
    <EscalationTimelineReplica
      steps={completedSteps}
      currentStep={5}
      totalSteps={5}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Todas as 5 etapas executadas com sucesso — caso de cobrança encerrada após sequência completa.',
      },
    },
  },
};

export const WithFailedStep: Story = {
  render: () => (
    <EscalationTimelineReplica
      steps={withFailureSteps}
      currentStep={3}
      totalSteps={3}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Cenário com falha no envio do WhatsApp (número bloqueado) e fallback automático para e-mail.',
      },
    },
  },
};

export const SingleStep: Story = {
  render: () => (
    <EscalationTimelineReplica
      steps={[inProgressSteps[0]]}
      currentStep={1}
      totalSteps={1}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Régua mínima — política de cobrança simples com apenas uma etapa configurada.',
      },
    },
  },
};
