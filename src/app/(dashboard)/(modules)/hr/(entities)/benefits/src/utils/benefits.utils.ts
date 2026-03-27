/**
 * Benefits Utilities
 * Funções utilitárias para benefícios
 */

import type { BenefitType, BenefitPlan, BenefitEnrollmentStatus } from '@/types/hr';

/**
 * Labels em português para cada tipo de benefício
 */
export const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  VT: 'Vale Transporte',
  VR: 'Vale Refeição',
  VA: 'Vale Alimentação',
  HEALTH: 'Plano de Saúde',
  DENTAL: 'Plano Odontológico',
  LIFE_INSURANCE: 'Seguro de Vida',
  DAYCARE: 'Auxílio Creche',
  PLR: 'PLR',
  LOAN: 'Consignado',
  EDUCATION: 'Auxílio Educação',
  HOME_OFFICE: 'Auxílio Home Office',
  FLEX: 'Benefícios Flexíveis',
};

/**
 * Cores para cada tipo de benefício por categoria
 */
export const BENEFIT_TYPE_COLORS: Record<
  BenefitType,
  { bg: string; text: string; gradient: string; badge: string }
> = {
  // Alimentação — emerald
  VR: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    gradient: 'from-emerald-500 to-emerald-600',
    badge: 'emerald',
  },
  VA: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    gradient: 'from-emerald-500 to-emerald-600',
    badge: 'emerald',
  },
  // Saúde — teal
  HEALTH: {
    bg: 'bg-teal-50 dark:bg-teal-500/8',
    text: 'text-teal-700 dark:text-teal-300',
    gradient: 'from-teal-500 to-teal-600',
    badge: 'teal',
  },
  DENTAL: {
    bg: 'bg-teal-50 dark:bg-teal-500/8',
    text: 'text-teal-700 dark:text-teal-300',
    gradient: 'from-teal-500 to-teal-600',
    badge: 'teal',
  },
  // Transporte — blue
  VT: {
    bg: 'bg-blue-50 dark:bg-blue-500/8',
    text: 'text-blue-700 dark:text-blue-300',
    gradient: 'from-blue-500 to-blue-600',
    badge: 'blue',
  },
  // Proteção — violet
  LIFE_INSURANCE: {
    bg: 'bg-violet-50 dark:bg-violet-500/8',
    text: 'text-violet-700 dark:text-violet-300',
    gradient: 'from-violet-500 to-violet-600',
    badge: 'violet',
  },
  // Família — pink
  DAYCARE: {
    bg: 'bg-pink-50 dark:bg-pink-500/8',
    text: 'text-pink-700 dark:text-pink-300',
    gradient: 'from-pink-500 to-pink-600',
    badge: 'pink',
  },
  // Financeiro — amber
  PLR: {
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-500 to-amber-600',
    badge: 'amber',
  },
  LOAN: {
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-500 to-amber-600',
    badge: 'amber',
  },
  // Desenvolvimento — cyan
  EDUCATION: {
    bg: 'bg-cyan-50 dark:bg-cyan-500/8',
    text: 'text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-500 to-cyan-600',
    badge: 'cyan',
  },
  // Home Office — cyan
  HOME_OFFICE: {
    bg: 'bg-cyan-50 dark:bg-cyan-500/8',
    text: 'text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-500 to-cyan-600',
    badge: 'cyan',
  },
  // Flex — gradient purple→pink
  FLEX: {
    bg: 'bg-purple-50 dark:bg-purple-500/8',
    text: 'text-purple-700 dark:text-purple-300',
    gradient: 'from-purple-500 to-pink-500',
    badge: 'purple',
  },
};

/**
 * Labels para status de inscrição
 */
export const ENROLLMENT_STATUS_LABELS: Record<BenefitEnrollmentStatus, string> = {
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
};

/**
 * Cores para status de inscrição
 */
export const ENROLLMENT_STATUS_COLORS: Record<
  BenefitEnrollmentStatus,
  'default' | 'secondary' | 'destructive'
> = {
  ACTIVE: 'default',
  SUSPENDED: 'secondary',
  CANCELLED: 'destructive',
};

/**
 * Lista de todos os tipos de benefício para filtros/selectors
 */
export const BENEFIT_TYPE_OPTIONS: { value: BenefitType; label: string }[] = [
  { value: 'VT', label: 'Vale Transporte' },
  { value: 'VR', label: 'Vale Refeição' },
  { value: 'VA', label: 'Vale Alimentação' },
  { value: 'HEALTH', label: 'Plano de Saúde' },
  { value: 'DENTAL', label: 'Plano Odontológico' },
  { value: 'LIFE_INSURANCE', label: 'Seguro de Vida' },
  { value: 'DAYCARE', label: 'Auxílio Creche' },
  { value: 'PLR', label: 'PLR' },
  { value: 'LOAN', label: 'Consignado' },
  { value: 'EDUCATION', label: 'Auxílio Educação' },
  { value: 'HOME_OFFICE', label: 'Auxílio Home Office' },
  { value: 'FLEX', label: 'Benefícios Flexíveis' },
];

/**
 * Obtém o label do tipo de benefício
 */
export function getBenefitTypeLabel(type: BenefitType): string {
  return BENEFIT_TYPE_LABELS[type] || type;
}

/**
 * Obtém as cores do tipo de benefício
 */
export function getBenefitTypeColors(type: BenefitType) {
  return BENEFIT_TYPE_COLORS[type] || BENEFIT_TYPE_COLORS.FLEX;
}

/**
 * Formata valor em Real brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data para pt-BR
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Verifica se o plano está ativo
 */
export function isPlanActive(plan: BenefitPlan): boolean {
  return plan.isActive;
}

/**
 * Obtém descrição das regras do tipo
 */
export function getBenefitRuleDescription(type: BenefitType): string {
  const descriptions: Record<BenefitType, string> = {
    VT: 'Desconto de 6% do salário base, empresa cobre o excedente',
    VR: 'Valor fixo por dia útil trabalhado',
    VA: 'Valor fixo mensal',
    HEALTH: 'Faixas etárias da ANS, coparticipação configurável, titulares + dependentes',
    DENTAL: 'Valor fixo, titulares + dependentes',
    LIFE_INSURANCE: 'Valor por faixa salarial ou fixo',
    DAYCARE: 'Valor fixo para filhos até 5 anos e 11 meses',
    PLR: 'Percentual do salário ou valor fixo, periodicidade configurável',
    LOAN: 'Parcelas fixas, limite de 35% da margem consignável',
    EDUCATION: 'Valor fixo ou % do custo, com comprovação',
    HOME_OFFICE: 'Valor fixo mensal para teletrabalho',
    FLEX: 'Saldo mensal distribuído entre categorias pelo funcionário',
  };
  return descriptions[type] || '';
}
