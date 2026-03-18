// ============================================
// OCCUPANCY COLORS
// ============================================

import type { OccupancyLevel } from '@/types/stock';

/**
 * Cores para representar níveis de ocupação
 * Usadas no mapa 2D e em badges
 */
export const OCCUPANCY_COLORS: Record<OccupancyLevel, string> = {
  empty: '#e5e7eb', // gray-200 - 0%
  low: '#86efac', // green-300 - 1-49%
  medium: '#fcd34d', // yellow-300 - 50-79%
  high: '#fb923c', // orange-400 - 80-94%
  full: '#f87171', // red-400 - 95-100%
  blocked: '#6b7280', // gray-500 - bloqueado
};

/**
 * Cores para o modo escuro
 */
export const OCCUPANCY_COLORS_DARK: Record<OccupancyLevel, string> = {
  empty: '#374151', // gray-700
  low: '#166534', // green-800
  medium: '#854d0e', // yellow-800
  high: '#9a3412', // orange-800
  full: '#991b1b', // red-800
  blocked: '#4b5563', // gray-600
};

/**
 * Classes Tailwind para badges de ocupação
 */
export const OCCUPANCY_BADGE_CLASSES: Record<OccupancyLevel, string> = {
  empty: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400',
  medium:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400',
  full: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400',
  blocked: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

/**
 * Labels de ocupação traduzidos
 */
export const OCCUPANCY_LABELS: Record<OccupancyLevel, string> = {
  empty: 'Vazio',
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  full: 'Cheio',
  blocked: 'Bloqueado',
};

/**
 * Obtém a cor de ocupação baseada na porcentagem
 */
export function getOccupancyColor(
  current: number,
  capacity: number | undefined,
  isBlocked: boolean = false
): string {
  if (isBlocked) return OCCUPANCY_COLORS.blocked;
  if (!capacity || capacity === 0) {
    return current === 0 ? OCCUPANCY_COLORS.empty : OCCUPANCY_COLORS.low;
  }

  const percentage = (current / capacity) * 100;

  if (percentage === 0) return OCCUPANCY_COLORS.empty;
  if (percentage < 50) return OCCUPANCY_COLORS.low;
  if (percentage < 80) return OCCUPANCY_COLORS.medium;
  if (percentage < 95) return OCCUPANCY_COLORS.high;
  return OCCUPANCY_COLORS.full;
}

/**
 * Obtém a cor de ocupação para modo escuro
 */
export function getOccupancyColorDark(
  current: number,
  capacity: number | undefined,
  isBlocked: boolean = false
): string {
  if (isBlocked) return OCCUPANCY_COLORS_DARK.blocked;
  if (!capacity || capacity === 0) {
    return current === 0
      ? OCCUPANCY_COLORS_DARK.empty
      : OCCUPANCY_COLORS_DARK.low;
  }

  const percentage = (current / capacity) * 100;

  if (percentage === 0) return OCCUPANCY_COLORS_DARK.empty;
  if (percentage < 50) return OCCUPANCY_COLORS_DARK.low;
  if (percentage < 80) return OCCUPANCY_COLORS_DARK.medium;
  if (percentage < 95) return OCCUPANCY_COLORS_DARK.high;
  return OCCUPANCY_COLORS_DARK.full;
}

// ============================================
// AISLE COLORS (para diferenciar corredores)
// ============================================

export const AISLE_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
];

export function getAisleColor(aisleNumber: number): string {
  return AISLE_COLORS[(aisleNumber - 1) % AISLE_COLORS.length];
}
