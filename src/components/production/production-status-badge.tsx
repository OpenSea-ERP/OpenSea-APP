import type { ProductionOrderStatus } from '@/types/production';

const STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  DRAFT: 'Rascunho',
  PLANNED: 'Planejada',
  FIRM: 'Firme',
  RELEASED: 'Liberada',
  IN_PROCESS: 'Em Processo',
  TECHNICALLY_COMPLETE: 'Tec. Completa',
  CLOSED: 'Encerrada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<ProductionOrderStatus, string> = {
  DRAFT:
    'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
  PLANNED:
    'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
  FIRM:
    'border-indigo-600/25 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-700 dark:text-indigo-300',
  RELEASED:
    'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
  IN_PROCESS:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  TECHNICALLY_COMPLETE:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  CLOSED:
    'border-green-600/25 dark:border-green-500/20 bg-green-50 dark:bg-green-500/8 text-green-700 dark:text-green-300',
  CANCELLED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
};

interface ProductionStatusBadgeProps {
  status: ProductionOrderStatus;
  className?: string;
}

export function ProductionStatusBadge({
  status,
  className = '',
}: ProductionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export { STATUS_LABELS, STATUS_COLORS };
