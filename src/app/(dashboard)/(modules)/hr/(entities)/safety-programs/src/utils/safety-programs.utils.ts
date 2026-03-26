/**
 * Safety Programs Utilities
 */

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export const PROGRAM_TYPE_LABELS: Record<string, string> = {
  PPRA: 'PPRA',
  PCMSO: 'PCMSO',
  PGR: 'PGR',
  LTCAT: 'LTCAT',
  PPP: 'PPP',
  PCMAT: 'PCMAT',
  SIPAT: 'SIPAT',
  OTHER: 'Outro',
};

export const PROGRAM_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  DRAFT: 'Rascunho',
};

export const RISK_CATEGORY_LABELS: Record<string, string> = {
  FISICO: 'Físico',
  QUIMICO: 'Químico',
  BIOLOGICO: 'Biológico',
  ERGONOMICO: 'Ergonômico',
  ACIDENTE: 'Acidente',
};

export const RISK_SEVERITY_LABELS: Record<string, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
};

export function getProgramTypeLabel(type: string): string {
  return PROGRAM_TYPE_LABELS[type] || type;
}

export function getProgramStatusLabel(status: string): string {
  return PROGRAM_STATUS_LABELS[status] || status;
}

export function getProgramStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'EXPIRED':
      return 'destructive';
    case 'DRAFT':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function getRiskCategoryLabel(category: string): string {
  return RISK_CATEGORY_LABELS[category] || category;
}

export function getRiskSeverityLabel(severity: string): string {
  return RISK_SEVERITY_LABELS[severity] || severity;
}

export function getRiskSeverityVariant(
  severity: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (severity) {
    case 'BAIXO':
      return 'default';
    case 'MEDIO':
      return 'secondary';
    case 'ALTO':
      return 'destructive';
    case 'CRITICO':
      return 'destructive';
    default:
      return 'outline';
  }
}
