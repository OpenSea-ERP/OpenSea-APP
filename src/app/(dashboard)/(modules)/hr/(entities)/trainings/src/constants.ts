import type { TrainingCategory, TrainingFormat } from '@/types/hr';

export const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  ONBOARDING: 'Integração',
  SAFETY: 'Segurança',
  TECHNICAL: 'Técnico',
  COMPLIANCE: 'Conformidade',
  LEADERSHIP: 'Liderança',
  SOFT_SKILLS: 'Habilidades Interpessoais',
};

export const TRAINING_FORMAT_LABELS: Record<TrainingFormat, string> = {
  PRESENCIAL: 'Presencial',
  ONLINE: 'Online',
  HIBRIDO: 'Híbrido',
};

export const TRAINING_STATUS_LABELS: Record<string, string> = {
  ENROLLED: 'Inscrito',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  FAILED: 'Reprovado',
};

export const TRAINING_CATEGORY_COLORS: Record<
  TrainingCategory,
  { gradient: string; bg: string; text: string }
> = {
  ONBOARDING: {
    gradient: 'from-sky-500 to-sky-600',
    bg: 'bg-sky-50 dark:bg-sky-500/8',
    text: 'text-sky-700 dark:text-sky-300',
  },
  SAFETY: {
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
  },
  TECHNICAL: {
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-500/8',
    text: 'text-violet-700 dark:text-violet-300',
  },
  COMPLIANCE: {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  LEADERSHIP: {
    gradient: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
  },
  SOFT_SKILLS: {
    gradient: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-500/8',
    text: 'text-teal-700 dark:text-teal-300',
  },
};

export const TRAINING_CATEGORY_OPTIONS = Object.entries(
  TRAINING_CATEGORY_LABELS
).map(([value, label]) => ({ value, label }));

export const TRAINING_FORMAT_OPTIONS = Object.entries(
  TRAINING_FORMAT_LABELS
).map(([value, label]) => ({ value, label }));

export const TRAINING_STATUS_OPTIONS = Object.entries(
  TRAINING_STATUS_LABELS
).map(([value, label]) => ({ value, label }));
