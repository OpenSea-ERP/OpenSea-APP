/**
 * Admission Utilities
 */

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ============================================================================
// Status Labels
// ============================================================================

export const ADMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

export function getAdmissionStatusLabel(status: string): string {
  return ADMISSION_STATUS_LABELS[status] || status;
}

export function getAdmissionStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'IN_PROGRESS':
      return 'secondary';
    case 'PENDING':
      return 'outline';
    case 'EXPIRED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function getAdmissionStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300';
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300';
    case 'EXPIRED':
      return 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300';
    default:
      return 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300';
  }
}

// ============================================================================
// Contract Type Labels
// ============================================================================

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  CLT: 'CLT',
  PJ: 'PJ (Pessoa Jurídica)',
  TEMPORARY: 'Temporário',
  INTERN: 'Estágio',
  APPRENTICE: 'Aprendiz',
};

export function getContractTypeLabel(type: string): string {
  return CONTRACT_TYPE_LABELS[type] || type;
}

// ============================================================================
// Work Regime Labels
// ============================================================================

export const WORK_REGIME_LABELS: Record<string, string> = {
  PRESENTIAL: 'Presencial',
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
};

export function getWorkRegimeLabel(regime: string): string {
  return WORK_REGIME_LABELS[regime] || regime;
}

// ============================================================================
// Document Type Labels
// ============================================================================

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  RG: 'RG (Identidade)',
  CPF: 'CPF',
  CTPS: 'CTPS (Carteira de Trabalho)',
  PROOF_ADDRESS: 'Comprovante de Residência',
  PHOTO: 'Foto 3x4',
  BIRTH_CERT: 'Certidão de Nascimento',
  MARRIAGE_CERT: 'Certidão de Casamento',
  OTHER: 'Outro',
};

export function getDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] || type;
}

// ============================================================================
// Document Status Labels
// ============================================================================

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  UPLOADED: 'Enviado',
  VALIDATED: 'Validado',
  REJECTED: 'Rejeitado',
};

export function getDocumentStatusLabel(status: string): string {
  return DOCUMENT_STATUS_LABELS[status] || status;
}

export function getDocumentStatusColor(status: string): string {
  switch (status) {
    case 'VALIDATED':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300';
    case 'UPLOADED':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300';
    default:
      return 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300';
  }
}

// ============================================================================
// Marital Status Labels
// ============================================================================

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: 'Solteiro(a)',
  MARRIED: 'Casado(a)',
  DIVORCED: 'Divorciado(a)',
  WIDOWED: 'Viúvo(a)',
  SEPARATED: 'Separado(a)',
  STABLE_UNION: 'União Estável',
};

export function getMaritalStatusLabel(status: string): string {
  return MARITAL_STATUS_LABELS[status] || status;
}

// ============================================================================
// Relationship Labels
// ============================================================================

export const RELATIONSHIP_LABELS: Record<string, string> = {
  SPOUSE: 'Cônjuge',
  CHILD: 'Filho(a)',
  STEPCHILD: 'Enteado(a)',
  PARENT: 'Pai/Mãe',
  OTHER: 'Outro',
};

export function getRelationshipLabel(rel: string): string {
  return RELATIONSHIP_LABELS[rel] || rel;
}

// ============================================================================
// Bank Account Type Labels
// ============================================================================

export const BANK_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Corrente',
  SAVINGS: 'Poupança',
};

export function getBankAccountTypeLabel(type: string): string {
  return BANK_ACCOUNT_TYPE_LABELS[type] || type;
}
