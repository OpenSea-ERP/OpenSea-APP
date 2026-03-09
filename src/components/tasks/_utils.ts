import type { CardPriority } from '@/types/tasks';

/**
 * Checks if a card is overdue based on its due date and status.
 * Cards with status DONE or CANCELED are never considered overdue.
 */
export function isOverdue(
  dueDate: string | null | undefined,
  status?: string
): boolean {
  if (!dueDate) return false;
  if (status === 'DONE' || status === 'CANCELED') return false;
  return new Date(dueDate) < new Date();
}

/**
 * Formats a due date into a human-readable relative string (PT-BR).
 * Shows "Hoje", "Amanhã", "Ontem", relative days, or a short date.
 */
export function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days === -1) return 'Ontem';
  if (days < -1) return `${Math.abs(days)}d atrás`;
  if (days <= 7) return `${days}d`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/**
 * Formats a date as a short localized string (PT-BR): "01 jan. 2026"
 */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Maps card priority to a hex color string.
 */
export const PRIORITY_HEX: Record<CardPriority, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  NONE: '#6b7280',
};
