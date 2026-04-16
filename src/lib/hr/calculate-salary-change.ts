/**
 * OpenSea OS - Salary Change Helpers
 *
 * Funções utilitárias para cálculo, formatação e exibição de mudanças
 * salariais ao longo do histórico do funcionário.
 */

export type SalaryChangeReason =
  | 'ADMISSION'
  | 'ADJUSTMENT'
  | 'PROMOTION'
  | 'MERIT'
  | 'ROLE_CHANGE'
  | 'CORRECTION';

/**
 * Calcula a variação percentual entre dois salários.
 *
 * Retorna 0 quando o salário anterior é nulo ou zero (admissão sem
 * histórico anterior — sem base de comparação).
 */
export function calculatePercentChange(
  previousSalary: number | null | undefined,
  currentSalary: number
): number {
  if (
    previousSalary === null ||
    previousSalary === undefined ||
    previousSalary === 0
  ) {
    return 0;
  }
  const delta = currentSalary - previousSalary;
  return (delta / previousSalary) * 100;
}

/**
 * Formata a variação percentual em string formal pt-BR.
 *
 * Exemplos: "+8,5%", "-2,3%", "0,0%".
 */
export function formatPercentChange(percent: number): string {
  if (!Number.isFinite(percent)) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  });
  return `${formatter.format(percent)}%`;
}

/**
 * Calcula a diferença absoluta em moeda entre dois salários.
 */
export function calculateAbsoluteChange(
  previousSalary: number | null | undefined,
  currentSalary: number
): number {
  if (previousSalary === null || previousSalary === undefined) {
    return currentSalary;
  }
  return currentSalary - previousSalary;
}

/**
 * Formata a diferença absoluta em moeda BRL com sinal explícito.
 *
 * Exemplos: "+R$ 500,00", "-R$ 250,00".
 */
export function formatAbsoluteChange(delta: number): string {
  if (!Number.isFinite(delta)) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    signDisplay: 'always',
  });
  return formatter.format(delta);
}

/**
 * Indica se a mudança representa um aumento, redução ou manutenção.
 */
export function getChangeDirection(
  previousSalary: number | null | undefined,
  currentSalary: number
): 'increase' | 'decrease' | 'unchanged' | 'initial' {
  if (previousSalary === null || previousSalary === undefined) {
    return 'initial';
  }
  if (currentSalary > previousSalary) return 'increase';
  if (currentSalary < previousSalary) return 'decrease';
  return 'unchanged';
}

/**
 * Tokens Tailwind associados ao motivo da mudança salarial.
 *
 * Padrão dual-theme: cores suaves no light mode, vivacidade controlada
 * no dark mode. Usado em dots da timeline, badges e pequenos chips.
 */
export interface ReasonColorTokens {
  /** Background do dot da timeline (light) */
  dotBackground: string;
  /** Background do dot da timeline (dark) */
  dotBackgroundDark: string;
  /** Background do badge (light) */
  badgeBackground: string;
  /** Texto do badge (light) */
  badgeText: string;
  /** Background do badge (dark) */
  badgeBackgroundDark: string;
  /** Texto do badge (dark) */
  badgeTextDark: string;
  /** Cor sólida primária (para gradientes/ícones) */
  primaryColor: string;
}

const REASON_COLOR_MAP: Record<SalaryChangeReason, ReasonColorTokens> = {
  ADMISSION: {
    dotBackground: 'bg-violet-500',
    dotBackgroundDark: 'dark:bg-violet-400',
    badgeBackground: 'bg-violet-50',
    badgeText: 'text-violet-700',
    badgeBackgroundDark: 'dark:bg-violet-500/8',
    badgeTextDark: 'dark:text-violet-300',
    primaryColor: 'text-violet-500',
  },
  ADJUSTMENT: {
    dotBackground: 'bg-sky-500',
    dotBackgroundDark: 'dark:bg-sky-400',
    badgeBackground: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBackgroundDark: 'dark:bg-sky-500/8',
    badgeTextDark: 'dark:text-sky-300',
    primaryColor: 'text-sky-500',
  },
  PROMOTION: {
    dotBackground: 'bg-emerald-500',
    dotBackgroundDark: 'dark:bg-emerald-400',
    badgeBackground: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBackgroundDark: 'dark:bg-emerald-500/8',
    badgeTextDark: 'dark:text-emerald-300',
    primaryColor: 'text-emerald-500',
  },
  MERIT: {
    dotBackground: 'bg-amber-500',
    dotBackgroundDark: 'dark:bg-amber-400',
    badgeBackground: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBackgroundDark: 'dark:bg-amber-500/8',
    badgeTextDark: 'dark:text-amber-300',
    primaryColor: 'text-amber-500',
  },
  ROLE_CHANGE: {
    dotBackground: 'bg-teal-500',
    dotBackgroundDark: 'dark:bg-teal-400',
    badgeBackground: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBackgroundDark: 'dark:bg-teal-500/8',
    badgeTextDark: 'dark:text-teal-300',
    primaryColor: 'text-teal-500',
  },
  CORRECTION: {
    dotBackground: 'bg-rose-500',
    dotBackgroundDark: 'dark:bg-rose-400',
    badgeBackground: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBackgroundDark: 'dark:bg-rose-500/8',
    badgeTextDark: 'dark:text-rose-300',
    primaryColor: 'text-rose-500',
  },
};

/**
 * Retorna os tokens de cor Tailwind associados ao motivo de mudança.
 */
export function getReasonColorTokens(
  reason: SalaryChangeReason
): ReasonColorTokens {
  return REASON_COLOR_MAP[reason];
}

/**
 * Atalho que retorna apenas a classe Tailwind do dot da timeline,
 * combinando light + dark.
 */
export function getReasonDotClassName(reason: SalaryChangeReason): string {
  const tokens = getReasonColorTokens(reason);
  return `${tokens.dotBackground} ${tokens.dotBackgroundDark}`;
}

/**
 * Atalho que retorna o conjunto de classes Tailwind de um badge
 * dual-theme conforme o motivo.
 */
export function getReasonBadgeClassName(reason: SalaryChangeReason): string {
  const tokens = getReasonColorTokens(reason);
  return [
    tokens.badgeBackground,
    tokens.badgeText,
    tokens.badgeBackgroundDark,
    tokens.badgeTextDark,
  ].join(' ');
}

/**
 * Rótulo formal pt-BR para cada motivo de mudança salarial.
 */
const REASON_LABEL_MAP: Record<SalaryChangeReason, string> = {
  ADMISSION: 'Admissão',
  ADJUSTMENT: 'Reajuste',
  PROMOTION: 'Promoção',
  MERIT: 'Mérito',
  ROLE_CHANGE: 'Mudança de Cargo',
  CORRECTION: 'Correção',
};

export function getReasonLabel(reason: SalaryChangeReason): string {
  return REASON_LABEL_MAP[reason] ?? reason;
}

/**
 * Descrição auxiliar (tooltip / radio cards) para cada motivo.
 */
const REASON_DESCRIPTION_MAP: Record<SalaryChangeReason, string> = {
  ADMISSION: 'Salário inicial registrado na admissão do funcionário.',
  ADJUSTMENT:
    'Reajuste anual, dissídio coletivo ou correção monetária periódica.',
  PROMOTION:
    'Aumento associado à promoção para um cargo de maior responsabilidade.',
  MERIT:
    'Reconhecimento individual por desempenho excepcional ou metas atingidas.',
  ROLE_CHANGE:
    'Alteração salarial decorrente de mudança formal de cargo ou função.',
  CORRECTION:
    'Correção de valor lançado incorretamente no sistema. Use com cautela.',
};

export function getReasonDescription(reason: SalaryChangeReason): string {
  return REASON_DESCRIPTION_MAP[reason] ?? '';
}

/**
 * Calcula a próxima data sugerida para revisão salarial (12 meses
 * após a última mudança efetiva, mantendo dia/mês quando possível).
 */
export function calculateNextReviewDate(effectiveDate: Date | string): Date {
  const baseDate =
    effectiveDate instanceof Date ? effectiveDate : new Date(effectiveDate);
  const next = new Date(baseDate);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}
