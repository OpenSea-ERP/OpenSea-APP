/**
 * Termination Utilities
 */

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export const TERMINATION_TYPE_LABELS: Record<string, string> = {
  SEM_JUSTA_CAUSA: 'Sem Justa Causa',
  JUSTA_CAUSA: 'Justa Causa',
  PEDIDO_DEMISSAO: 'Pedido de Demissão',
  ACORDO_MUTUO: 'Acordo Mútuo',
  CONTRATO_TEMPORARIO: 'Contrato Temporário',
  RESCISAO_INDIRETA: 'Rescisão Indireta',
  FALECIMENTO: 'Falecimento',
};

export const NOTICE_TYPE_LABELS: Record<string, string> = {
  TRABALHADO: 'Trabalhado',
  INDENIZADO: 'Indenizado',
  DISPENSADO: 'Dispensado',
};

export const TERMINATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CALCULATED: 'Calculado',
  PAID: 'Pago',
};

export function getTerminationTypeLabel(type: string): string {
  return TERMINATION_TYPE_LABELS[type] || type;
}

export function getNoticeTypeLabel(type: string): string {
  return NOTICE_TYPE_LABELS[type] || type;
}

export function getTerminationStatusLabel(status: string): string {
  return TERMINATION_STATUS_LABELS[status] || status;
}

export function getTerminationStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
      return 'default';
    case 'CALCULATED':
      return 'secondary';
    case 'PENDING':
      return 'outline';
    default:
      return 'outline';
  }
}

export function getTerminationTypeVariant(
  type: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'JUSTA_CAUSA':
      return 'destructive';
    case 'PEDIDO_DEMISSAO':
      return 'secondary';
    case 'FALECIMENTO':
      return 'destructive';
    default:
      return 'outline';
  }
}
