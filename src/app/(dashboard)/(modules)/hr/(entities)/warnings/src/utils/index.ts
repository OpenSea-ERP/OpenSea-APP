/**
 * OpenSea OS - Warnings Utils (HR)
 */

import type { WarningType, WarningSeverity, WarningStatus } from '@/types/hr';

export function getWarningTypeLabel(type: WarningType): string {
  const labels: Record<WarningType, string> = {
    VERBAL: 'Verbal',
    WRITTEN: 'Escrita',
    SUSPENSION: 'Suspensão',
    TERMINATION_WARNING: 'Aviso de Desligamento',
  };
  return labels[type] ?? type;
}

export function getWarningSeverityLabel(severity: WarningSeverity): string {
  const labels: Record<WarningSeverity, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  };
  return labels[severity] ?? severity;
}

export function getWarningStatusLabel(status: WarningStatus): string {
  const labels: Record<WarningStatus, string> = {
    ACTIVE: 'Ativa',
    REVOKED: 'Revogada',
    EXPIRED: 'Expirada',
  };
  return labels[status] ?? status;
}

export function getWarningTypeColor(type: WarningType): string {
  const colors: Record<WarningType, string> = {
    VERBAL: 'sky',
    WRITTEN: 'amber',
    SUSPENSION: 'rose',
    TERMINATION_WARNING: 'red',
  };
  return colors[type] ?? 'slate';
}

export function getWarningSeverityColor(severity: WarningSeverity): string {
  const colors: Record<WarningSeverity, string> = {
    LOW: 'emerald',
    MEDIUM: 'amber',
    HIGH: 'orange',
    CRITICAL: 'rose',
  };
  return colors[severity] ?? 'slate';
}

export function getWarningStatusColor(status: WarningStatus): string {
  const colors: Record<WarningStatus, string> = {
    ACTIVE: 'emerald',
    REVOKED: 'rose',
    EXPIRED: 'slate',
  };
  return colors[status] ?? 'slate';
}
