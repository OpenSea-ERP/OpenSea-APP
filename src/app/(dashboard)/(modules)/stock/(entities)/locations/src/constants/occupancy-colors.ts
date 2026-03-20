import type { OccupancyLevel } from '@/types/stock';

/**
 * Cores de fundo das células de nicho por nível de ocupação
 * Light: tom -200 para cells, Dark: tom -800
 */
export const BIN_CELL_COLORS: Record<
  Exclude<OccupancyLevel, 'empty'>,
  string
> = {
  low: 'bg-emerald-200 dark:bg-emerald-800 border-emerald-300 dark:border-emerald-700',
  medium:
    'bg-amber-200 dark:bg-amber-800 border-amber-300 dark:border-amber-700',
  high: 'bg-orange-200 dark:bg-orange-800 border-orange-300 dark:border-orange-700',
  full: 'bg-rose-200 dark:bg-rose-800 border-rose-300 dark:border-rose-700',
  blocked: 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
};

export const BIN_CELL_EMPTY =
  'bg-gray-50/50 dark:bg-gray-900/30 border-dashed border-gray-200 dark:border-gray-700';

/**
 * Cor da barra de progresso de ocupação baseada no percentual
 * Usada em: barras de zona, warehouse, bin detail
 */
export function getOccupancyBarColor(pct: number): string {
  if (pct === 0) return 'bg-gray-300 dark:bg-gray-600';
  if (pct < 34) return 'bg-emerald-500';
  if (pct < 67) return 'bg-amber-500';
  if (pct < 95) return 'bg-orange-500';
  return 'bg-rose-500';
}

/**
 * Itens da legenda de cores — sincronizados com BIN_CELL_COLORS
 */
export const OCCUPANCY_LEGEND = [
  {
    label: 'Vazio',
    color: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    dashed: true,
  },
  {
    label: 'Baixo',
    color: 'bg-emerald-200 dark:bg-emerald-800',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  {
    label: 'Médio',
    color: 'bg-amber-200 dark:bg-amber-800',
    border: 'border-amber-300 dark:border-amber-700',
  },
  {
    label: 'Alto',
    color: 'bg-orange-200 dark:bg-orange-800',
    border: 'border-orange-300 dark:border-orange-700',
  },
  {
    label: 'Cheio',
    color: 'bg-rose-200 dark:bg-rose-800',
    border: 'border-rose-300 dark:border-rose-700',
  },
  {
    label: 'Bloqueado',
    color: 'bg-gray-200 dark:bg-gray-700',
    border: 'border-gray-300 dark:border-gray-600',
  },
] as const;
