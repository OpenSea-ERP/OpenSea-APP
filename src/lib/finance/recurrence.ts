import type { RecurrenceUnit } from '@/types/finance';
import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
} from 'date-fns';

export interface RecurrenceSpec {
  frequencyUnit: RecurrenceUnit;
  frequencyInterval: number;
  startDate: string | Date;
  endDate?: string | Date | null;
  totalOccurrences?: number | null;
}

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
  return new Date(value);
}

function addInterval(base: Date, unit: RecurrenceUnit, interval: number): Date {
  switch (unit) {
    case 'DAILY':
      return addDays(base, interval);
    case 'WEEKLY':
      return addDays(base, 7 * interval);
    case 'BIWEEKLY':
      return addDays(base, 14 * interval);
    case 'MONTHLY':
      return addMonths(base, interval);
    case 'QUARTERLY':
      return addMonths(base, 3 * interval);
    case 'SEMIANNUAL':
      return addMonths(base, 6 * interval);
    case 'ANNUAL':
      return addYears(base, interval);
  }
}

export function computeNextOccurrences(
  spec: RecurrenceSpec,
  count: number
): Date[] {
  const {
    frequencyUnit,
    frequencyInterval,
    startDate,
    endDate,
    totalOccurrences,
  } = spec;
  const interval = Math.max(1, Math.floor(frequencyInterval || 1));
  const start = toDate(startDate);
  const end = endDate ? toDate(endDate) : null;
  const total =
    totalOccurrences && totalOccurrences > 0 ? totalOccurrences : null;

  const out: Date[] = [];
  let current = start;
  let i = 0;

  while (out.length < count) {
    if (total !== null && i >= total) break;
    if (end && current.getTime() > end.getTime()) break;
    out.push(current);
    current = addInterval(start, frequencyUnit, interval * (i + 1));
    i += 1;
  }

  return out;
}

const UNIT_LABELS_PLURAL: Record<RecurrenceUnit, string> = {
  DAILY: 'dias',
  WEEKLY: 'semanas',
  BIWEEKLY: 'quinzenas',
  MONTHLY: 'meses',
  QUARTERLY: 'trimestres',
  SEMIANNUAL: 'semestres',
  ANNUAL: 'anos',
};

export function formatFrequencyLabel(
  unit: RecurrenceUnit,
  interval: number
): string {
  const safe = Math.max(1, Math.floor(interval || 1));
  if (safe === 1) {
    switch (unit) {
      case 'DAILY':
        return 'Todo dia';
      case 'WEEKLY':
        return 'Toda semana';
      case 'BIWEEKLY':
        return 'A cada quinzena';
      case 'MONTHLY':
        return 'Todo mês';
      case 'QUARTERLY':
        return 'Todo trimestre';
      case 'SEMIANNUAL':
        return 'Todo semestre';
      case 'ANNUAL':
        return 'Todo ano';
    }
  }
  return `A cada ${safe} ${UNIT_LABELS_PLURAL[unit]}`;
}

function formatBRDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function buildRecurrenceDescription(spec: RecurrenceSpec): string {
  const freq = formatFrequencyLabel(spec.frequencyUnit, spec.frequencyInterval);
  const parts: string[] = [freq.toLowerCase()];

  const start = toDate(spec.startDate);
  parts[0] = `${freq}, começando em ${formatBRDate(start)}`;

  if (spec.totalOccurrences && spec.totalOccurrences > 0) {
    parts.push(
      `por ${spec.totalOccurrences} ocorrência${spec.totalOccurrences > 1 ? 's' : ''}`
    );
  } else if (spec.endDate) {
    parts.push(`até ${formatBRDate(toDate(spec.endDate))}`);
  } else {
    parts.push('sem data de término');
  }

  return parts.join(', ');
}

export function formatRelativeToNow(
  target: Date,
  now: Date = new Date()
): string {
  const days = differenceInCalendarDays(target, now);
  if (days === 0) return 'hoje';
  if (days === 1) return 'amanhã';
  if (days === -1) return 'ontem';
  if (days > 0 && days < 7) return `em ${days} dias`;
  if (days >= 7 && days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? 'em 1 semana' : `em ${weeks} semanas`;
  }
  if (days >= 30 && days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? 'em 1 mês' : `em ${months} meses`;
  }
  if (days >= 365) {
    const years = Math.round(days / 365);
    return years === 1 ? 'em 1 ano' : `em ${years} anos`;
  }
  if (days < 0) {
    const abs = Math.abs(days);
    if (abs < 30) return `há ${abs} dias`;
    if (abs < 365) return `há ${Math.round(abs / 30)} meses`;
    return `há ${Math.round(abs / 365)} anos`;
  }
  return '';
}
