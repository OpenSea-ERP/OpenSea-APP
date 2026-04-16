'use client';

import {
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  Clock,
  Eye,
  FilePen,
  Loader2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getEsocialCodeInfo } from '@/lib/hr/esocial-codes';
import type { EsocialEventStatus } from '@/types/esocial';

/**
 * Status genérico aceito pelo chip. Cobre tanto o domínio de eventos
 * (DRAFT, REVIEWED, APPROVED, TRANSMITTING, ACCEPTED, REJECTED, ERROR)
 * quanto o domínio de lotes (PENDING, TRANSMITTING, TRANSMITTED,
 * PARTIALLY_ACCEPTED, ACCEPTED, REJECTED, ERROR), além dos aliases
 * semânticos (PENDING, SENDING, SENT) usados em integrações.
 */
export type EsocialChipStatus =
  | EsocialEventStatus
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'TRANSMITTED'
  | 'PARTIALLY_ACCEPTED';

interface StatusVisual {
  label: string;
  icon: LucideIcon;
  iconAnimation?: string;
  className: string;
}

const STATUS_VISUAL: Record<EsocialChipStatus, StatusVisual> = {
  DRAFT: {
    label: 'Rascunho',
    icon: FilePen,
    className:
      'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/8 dark:text-slate-300 dark:border-slate-500/20',
  },
  PENDING: {
    label: 'Pendente',
    icon: Clock,
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/8 dark:text-amber-300 dark:border-amber-500/20',
  },
  REVIEWED: {
    label: 'Revisado',
    icon: Eye,
    className:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/8 dark:text-sky-300 dark:border-sky-500/20',
  },
  APPROVED: {
    label: 'Aprovado',
    icon: CheckCircle2,
    className:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/8 dark:text-violet-300 dark:border-violet-500/20',
  },
  SENDING: {
    label: 'Transmitindo',
    icon: Loader2,
    iconAnimation: 'animate-spin',
    className:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/8 dark:text-sky-300 dark:border-sky-500/20',
  },
  TRANSMITTING: {
    label: 'Transmitindo',
    icon: Loader2,
    iconAnimation: 'animate-spin',
    className:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/8 dark:text-sky-300 dark:border-sky-500/20',
  },
  SENT: {
    label: 'Enviado',
    icon: ArrowUp,
    className:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/8 dark:text-indigo-300 dark:border-indigo-500/20',
  },
  TRANSMITTED: {
    label: 'Transmitido',
    icon: ArrowUp,
    className:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/8 dark:text-indigo-300 dark:border-indigo-500/20',
  },
  PARTIALLY_ACCEPTED: {
    label: 'Parcialmente aceito',
    icon: AlertTriangle,
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/8 dark:text-amber-300 dark:border-amber-500/20',
  },
  ACCEPTED: {
    label: 'Aceito',
    icon: CheckCircle2,
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/8 dark:text-emerald-300 dark:border-emerald-500/20',
  },
  REJECTED: {
    label: 'Rejeitado',
    icon: XCircle,
    className:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/8 dark:text-rose-300 dark:border-rose-500/20',
  },
  ERROR: {
    label: 'Erro',
    icon: AlertTriangle,
    className:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/8 dark:text-rose-300 dark:border-rose-500/20',
  },
};

const FALLBACK_VISUAL: StatusVisual = STATUS_VISUAL.DRAFT;

interface EsocialStatusChipProps {
  status: EsocialChipStatus;
  /** Código de retorno do gov.br (ex.: "1010") */
  returnCode?: string | null;
  /** Mensagem completa retornada pelo eSocial */
  returnMessage?: string | null;
  /** Se falso, oculta o ícone e exibe apenas o rótulo */
  showIcon?: boolean;
  className?: string;
}

/**
 * Chip de status eSocial com tooltip detalhado.
 *
 * - Cores estritamente Tailwind dual-theme (light + dark).
 * - Tooltip exibe rótulo, código gov.br traduzido e mensagem completa.
 * - data-testid: `esocial-status-chip-{status}` para testes E2E.
 */
export function EsocialStatusChip({
  status,
  returnCode,
  returnMessage,
  showIcon = true,
  className,
}: EsocialStatusChipProps) {
  const visual = STATUS_VISUAL[status] ?? FALLBACK_VISUAL;
  const Icon = visual.icon;

  const codeInfo = returnCode ? getEsocialCodeInfo(returnCode) : null;
  const hasTooltipDetails = Boolean(returnCode || returnMessage);

  const chip = (
    <Badge
      variant="outline"
      data-testid={`esocial-status-chip-${status}`}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 font-medium text-xs',
        visual.className,
        className,
      )}
    >
      {showIcon && (
        <Icon className={cn('h-3 w-3', visual.iconAnimation)} aria-hidden="true" />
      )}
      <span>{visual.label}</span>
    </Badge>
  );

  if (!hasTooltipDetails) {
    return chip;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{chip}</span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-xs space-y-1.5 px-3 py-2 text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {visual.label}
        </p>
        {returnCode && codeInfo && (
          <p className="text-xs font-medium">
            <span className="text-white/70">Cód. gov.br:</span>{' '}
            <span className="font-mono">{returnCode}</span>
            {codeInfo.message && (
              <span className="text-white/80"> — {codeInfo.message}</span>
            )}
          </p>
        )}
        {returnMessage && (
          <p className="text-xs leading-snug text-white/90 line-clamp-4 break-words">
            {returnMessage}
          </p>
        )}
        {returnCode && codeInfo?.hint && (
          <p className="text-xs italic text-white/70">
            Sugestão: {codeInfo.hint}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
