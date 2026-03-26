/**
 * CIPA Utilities
 */

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export const MANDATE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  EXPIRED: 'Encerrado',
  DRAFT: 'Rascunho',
};

export const MEMBER_ROLE_LABELS: Record<string, string> = {
  PRESIDENTE: 'Presidente',
  VICE_PRESIDENTE: 'Vice-Presidente',
  SECRETARIO: 'Secretário',
  MEMBRO_TITULAR: 'Membro Titular',
  MEMBRO_SUPLENTE: 'Membro Suplente',
};

export const MEMBER_TYPE_LABELS: Record<string, string> = {
  EMPREGADOR: 'Representante do Empregador',
  EMPREGADO: 'Representante dos Empregados',
};

export function getMandateStatusLabel(status: string): string {
  return MANDATE_STATUS_LABELS[status] || status;
}

export function getMandateStatusVariant(
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

export function getMemberRoleLabel(role: string): string {
  return MEMBER_ROLE_LABELS[role] || role;
}

export function getMemberTypeLabel(type: string): string {
  return MEMBER_TYPE_LABELS[type] || type;
}

/**
 * Returns a Tailwind color class for the role badge
 * PRESIDENTE=violet, VICE=sky, SECRETARIO=teal, TITULAR=emerald, SUPLENTE=slate
 */
export function getMemberRoleBadgeClasses(role: string): string {
  switch (role) {
    case 'PRESIDENTE':
      return 'bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300';
    case 'VICE_PRESIDENTE':
      return 'bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300';
    case 'SECRETARIO':
      return 'bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300';
    case 'MEMBRO_TITULAR':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300';
    case 'MEMBRO_SUPLENTE':
      return 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300';
    default:
      return 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300';
  }
}
