'use client';

/**
 * OpenSea OS - VacationEventCard (HR)
 *
 * Card compacto para listar uma ausência/férias na sidebar do calendário
 * de equipe. Mostra avatar (foto ou iniciais coloridas), nome do colaborador,
 * tipo (chip) e intervalo de datas em pt-BR.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { AbsenceType } from '@/types/hr';

/* ===========================================
   TYPES
   =========================================== */

export type VacationEventKind =
  | 'VACATION'
  | 'SICK'
  | 'PARENTAL'
  | 'OTHER'
  | AbsenceType;

export interface VacationEventCardProps {
  employeeName: string;
  photoUrl?: string | null;
  kind: VacationEventKind;
  startDate: string | Date;
  endDate: string | Date;
  /** Nome do departamento, opcional (ajuda no contexto). */
  departmentName?: string | null;
  /** Click handler — leva ao perfil do colaborador, por exemplo. */
  onClick?: () => void;
  /** Atributo data-testid opcional. */
  testId?: string;
  className?: string;
}

/* ===========================================
   THEME — chips dual-theme (light/dark)
   =========================================== */

const KIND_THEME: Record<
  string,
  { label: string; chip: string; ring: string }
> = {
  VACATION: {
    label: 'Férias',
    chip:
      'bg-emerald-50 text-emerald-700 ring-emerald-200 ' +
      'dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
    ring: 'ring-emerald-300/60 dark:ring-emerald-400/40',
  },
  SICK: {
    label: 'Atestado',
    chip:
      'bg-rose-50 text-rose-700 ring-rose-200 ' +
      'dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30',
    ring: 'ring-rose-300/60 dark:ring-rose-400/40',
  },
  SICK_LEAVE: {
    label: 'Atestado',
    chip:
      'bg-rose-50 text-rose-700 ring-rose-200 ' +
      'dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30',
    ring: 'ring-rose-300/60 dark:ring-rose-400/40',
  },
  PARENTAL: {
    label: 'Lic. parental',
    chip:
      'bg-violet-50 text-violet-700 ring-violet-200 ' +
      'dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30',
    ring: 'ring-violet-300/60 dark:ring-violet-400/40',
  },
  MATERNITY_LEAVE: {
    label: 'Lic. maternidade',
    chip:
      'bg-violet-50 text-violet-700 ring-violet-200 ' +
      'dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30',
    ring: 'ring-violet-300/60 dark:ring-violet-400/40',
  },
  PATERNITY_LEAVE: {
    label: 'Lic. paternidade',
    chip:
      'bg-violet-50 text-violet-700 ring-violet-200 ' +
      'dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30',
    ring: 'ring-violet-300/60 dark:ring-violet-400/40',
  },
  PERSONAL_LEAVE: {
    label: 'Folga pessoal',
    chip:
      'bg-amber-50 text-amber-700 ring-amber-200 ' +
      'dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
    ring: 'ring-amber-300/60 dark:ring-amber-400/40',
  },
  BEREAVEMENT_LEAVE: {
    label: 'Lic. nojo',
    chip:
      'bg-slate-50 text-slate-700 ring-slate-200 ' +
      'dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
    ring: 'ring-slate-300/60 dark:ring-slate-400/40',
  },
  WEDDING_LEAVE: {
    label: 'Lic. gala',
    chip:
      'bg-sky-50 text-sky-700 ring-sky-200 ' +
      'dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
    ring: 'ring-sky-300/60 dark:ring-sky-400/40',
  },
  MEDICAL_APPOINTMENT: {
    label: 'Consulta médica',
    chip:
      'bg-teal-50 text-teal-700 ring-teal-200 ' +
      'dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/30',
    ring: 'ring-teal-300/60 dark:ring-teal-400/40',
  },
  JURY_DUTY: {
    label: 'Júri',
    chip:
      'bg-indigo-50 text-indigo-700 ring-indigo-200 ' +
      'dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/30',
    ring: 'ring-indigo-300/60 dark:ring-indigo-400/40',
  },
  UNPAID_LEAVE: {
    label: 'Lic. não rem.',
    chip:
      'bg-amber-50 text-amber-700 ring-amber-200 ' +
      'dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
    ring: 'ring-amber-300/60 dark:ring-amber-400/40',
  },
  OTHER: {
    label: 'Outras',
    chip:
      'bg-amber-50 text-amber-700 ring-amber-200 ' +
      'dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
    ring: 'ring-amber-300/60 dark:ring-amber-400/40',
  },
};

/* ===========================================
   AVATAR HELPERS
   =========================================== */

const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-violet-500 to-fuchsia-600',
  'bg-gradient-to-br from-sky-500 to-indigo-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-teal-500 to-cyan-600',
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarGradient(fullName: string): string {
  const index = hashString(fullName) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/* ===========================================
   DATE FORMATTERS
   =========================================== */

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
});

const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = sameYear
    ? dateFormatter.format(start)
    : fullDateFormatter.format(start);
  const endLabel = fullDateFormatter.format(end);
  return `${startLabel} \u2013 ${endLabel}`;
}

/* ===========================================
   COMPONENT
   =========================================== */

export function VacationEventCard({
  employeeName,
  photoUrl,
  kind,
  startDate,
  endDate,
  departmentName,
  onClick,
  testId,
  className,
}: VacationEventCardProps) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const theme = KIND_THEME[kind] ?? KIND_THEME.OTHER;

  const containerClasses = cn(
    'group flex items-center gap-3 rounded-lg border border-border',
    'bg-white px-3 py-2 transition-colors',
    'hover:bg-slate-50',
    'dark:bg-slate-800/60 dark:hover:bg-slate-800',
    onClick && 'cursor-pointer',
    className
  );

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      data-testid={testId}
      className={containerClasses}
    >
      <Avatar className={cn('size-9 ring-2', theme.ring)}>
        {photoUrl ? <AvatarImage src={photoUrl} alt={employeeName} /> : null}
        <AvatarFallback
          className={cn(
            'text-xs font-semibold text-white',
            getAvatarGradient(employeeName)
          )}
        >
          {getInitials(employeeName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 text-left">
        <p
          className="truncate text-sm font-medium text-slate-900 dark:text-slate-100"
          title={employeeName}
        >
          {employeeName}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {formatRange(start, end)}
          {departmentName ? (
            <span className="ml-1 text-slate-400 dark:text-slate-500">
              {' '}
              {'\u00b7'} {departmentName}
            </span>
          ) : null}
        </p>
      </div>

      <span
        className={cn(
          'inline-flex shrink-0 items-center rounded-full px-2 py-0.5',
          'text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
          theme.chip
        )}
      >
        {theme.label}
      </span>
    </Tag>
  );
}
