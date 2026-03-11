/**
 * Centralized chart color palette for Recharts components.
 * Use these constants instead of hardcoded hex values.
 */

export const CHART_COLORS = {
  blue: '#3b82f6',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
  orange: '#f97316',
} as const;

/** Ordered array of chart colors for indexed access (e.g. pie/bar segments). */
export const CHART_COLOR_SCALE = [
  CHART_COLORS.blue,
  CHART_COLORS.violet,
  CHART_COLORS.cyan,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
  CHART_COLORS.red,
  CHART_COLORS.pink,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
] as const;

/** Subset of colors for pie charts (5 colors). */
export const PIE_COLOR_SCALE = [
  CHART_COLORS.blue,
  CHART_COLORS.violet,
  CHART_COLORS.cyan,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
] as const;
