/**
 * OpenSea OS - Employee Requests Utils (HR)
 *
 * Funcoes utilitarias para labels e cores de solicitacoes.
 */

import type { RequestType, RequestStatus } from '@/types/hr';

/* ===========================================
   TYPE LABELS (PT-BR)
   =========================================== */

const TYPE_LABELS: Record<RequestType, string> = {
  VACATION: 'Férias',
  ABSENCE: 'Ausência',
  ADVANCE: 'Adiantamento',
  DATA_CHANGE: 'Alteração de Dados',
  SUPPORT: 'Suporte',
};

export function getRequestTypeLabel(type: RequestType): string {
  return TYPE_LABELS[type] ?? type;
}

/* ===========================================
   STATUS LABELS (PT-BR)
   =========================================== */

const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
};

export function getRequestStatusLabel(status: RequestStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/* ===========================================
   STATUS COLORS
   =========================================== */

const STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function getRequestStatusColor(status: RequestStatus): string {
  return (
    STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
  );
}

/* ===========================================
   STATUS BADGE VARIANT
   =========================================== */

const STATUS_VARIANTS: Record<
  RequestStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
};

export function getRequestStatusVariant(
  status: RequestStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_VARIANTS[status] ?? 'outline';
}

/* ===========================================
   TYPE COLORS
   =========================================== */

const TYPE_COLORS: Record<RequestType, string> = {
  VACATION: 'bg-green-100 text-green-800 border-green-200',
  ABSENCE: 'bg-rose-100 text-rose-800 border-rose-200',
  ADVANCE: 'bg-amber-100 text-amber-800 border-amber-200',
  DATA_CHANGE: 'bg-blue-100 text-blue-800 border-blue-200',
  SUPPORT: 'bg-violet-100 text-violet-800 border-violet-200',
};

export function getRequestTypeColor(type: RequestType): string {
  return TYPE_COLORS[type] ?? 'bg-zinc-100 text-zinc-800 border-zinc-200';
}

/* ===========================================
   TYPE GRADIENTS
   =========================================== */

const TYPE_GRADIENTS: Record<RequestType, string> = {
  VACATION: 'from-green-500 to-green-600',
  ABSENCE: 'from-rose-500 to-rose-600',
  ADVANCE: 'from-amber-500 to-amber-600',
  DATA_CHANGE: 'from-blue-500 to-blue-600',
  SUPPORT: 'from-violet-500 to-violet-600',
};

export function getRequestTypeGradient(type: RequestType): string {
  return TYPE_GRADIENTS[type] ?? 'from-slate-500 to-slate-600';
}
