/**
 * HR Teams Utils
 * Funcoes auxiliares para equipes no contexto HR
 */

import type { CSSProperties } from 'react';

/**
 * Retorna o badge variant para o status ativo/inativo da equipe
 */
export function getStatusBadgeVariant(
  isActive: boolean
): 'default' | 'destructive' {
  return isActive ? 'default' : 'destructive';
}

/**
 * Retorna o label do status
 */
export function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Ativa' : 'Inativa';
}

/**
 * Formata a contagem de membros
 */
export function formatMembersCount(count: number): string {
  if (count === 0) return 'Nenhum membro';
  if (count === 1) return '1 membro';
  return `${count} membros`;
}

/**
 * Gera um estilo de fundo baseado na cor da equipe
 */
export function getTeamColorStyle(
  color: string | null
): CSSProperties | undefined {
  if (!color) return undefined;
  return {
    background: `linear-gradient(to bottom right, ${color}, ${color}CC)`,
  };
}
