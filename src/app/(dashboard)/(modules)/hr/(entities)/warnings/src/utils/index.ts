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

export function getWarningTypeBadgeClass(type: WarningType): string {
  const classes: Record<WarningType, string> = {
    VERBAL: 'border-sky-500 text-sky-700 dark:text-sky-300',
    WRITTEN: 'border-amber-500 text-amber-700 dark:text-amber-300',
    SUSPENSION: 'border-rose-500 text-rose-700 dark:text-rose-300',
    TERMINATION_WARNING: 'border-red-500 text-red-700 dark:text-red-300',
  };
  return classes[type] ?? 'border-slate-500 text-slate-700 dark:text-slate-300';
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

export function getWarningSeverityBadgeClass(severity: WarningSeverity): string {
  const classes: Record<WarningSeverity, string> = {
    LOW: 'border-emerald-500 text-emerald-700 dark:text-emerald-300',
    MEDIUM: 'border-amber-500 text-amber-700 dark:text-amber-300',
    HIGH: 'border-orange-500 text-orange-700 dark:text-orange-300',
    CRITICAL: 'border-rose-500 text-rose-700 dark:text-rose-300',
  };
  return classes[severity] ?? 'border-slate-500 text-slate-700 dark:text-slate-300';
}

export function getWarningStatusColor(status: WarningStatus): string {
  const colors: Record<WarningStatus, string> = {
    ACTIVE: 'emerald',
    REVOKED: 'rose',
    EXPIRED: 'slate',
  };
  return colors[status] ?? 'slate';
}

export function getWarningStatusBadgeClass(status: WarningStatus): string {
  const classes: Record<WarningStatus, string> = {
    ACTIVE: 'border-emerald-500 text-emerald-700 dark:text-emerald-300',
    REVOKED: 'border-rose-500 text-rose-700 dark:text-rose-300',
    EXPIRED: 'border-slate-500 text-slate-700 dark:text-slate-300',
  };
  return classes[status] ?? 'border-slate-500 text-slate-700 dark:text-slate-300';
}
