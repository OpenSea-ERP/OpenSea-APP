/**
 * Medical Exams Utilities
 */

import type { MedicalExam } from '@/types/hr';

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

export const EXAM_TYPE_LABELS: Record<string, string> = {
  ADMISSIONAL: 'Admissional',
  PERIODICO: 'Periódico',
  MUDANCA_FUNCAO: 'Mudança de Função',
  RETORNO: 'Retorno ao Trabalho',
  DEMISSIONAL: 'Demissional',
};

export const EXAM_RESULT_LABELS: Record<string, string> = {
  APTO: 'Apto',
  INAPTO: 'Inapto',
  APTO_COM_RESTRICOES: 'Apto com Restrições',
};

export function getExamTypeLabel(type: string): string {
  return EXAM_TYPE_LABELS[type] || type;
}

export function getExamResultLabel(result: string): string {
  return EXAM_RESULT_LABELS[result] || result;
}

export function getExamResultVariant(
  result: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (result) {
    case 'APTO':
      return 'default';
    case 'INAPTO':
      return 'destructive';
    case 'APTO_COM_RESTRICOES':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function getExamTypeBadgeVariant(
  _exam: MedicalExam
): 'default' | 'secondary' | 'destructive' | 'outline' {
  return 'outline';
}
