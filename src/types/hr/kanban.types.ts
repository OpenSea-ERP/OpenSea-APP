/**
 * Recruitment Kanban Types
 * Tipos para o pipeline visual de recrutamento (Gupy-style)
 *
 * Inspiração: Gupy, Lever, Greenhouse — pipeline visual de candidaturas
 * agrupadas por status, com drag-and-drop entre colunas.
 */

import type { ApplicationStatus } from './recruitment.types';

// =============================================================================
// Column definition
// =============================================================================

/**
 * Define uma coluna do board Kanban.
 * Cada coluna agrega um conjunto de status de Application.
 * O usuário arrasta cards entre colunas para mudar o status.
 */
export interface KanbanColumnDefinition {
  /** Identificador estável usado como droppableId */
  id: KanbanColumnId;
  /** Status canônico que recebe o card quando dropado nesta coluna */
  targetStatus: ApplicationStatus;
  /** Conjunto de status que pertencem a esta coluna (na visualização) */
  matchingStatuses: ApplicationStatus[];
  /** Título exibido no header da coluna */
  title: string;
  /** Descrição curta (tooltip / subtítulo) */
  subtitle?: string;
  /** Cor primária da coluna (para borda e header gradiente) */
  accentColor: KanbanColumnAccent;
  /** Posição lógica no pipeline — usada para detectar movimentos para trás */
  pipelineOrder: number;
  /** Marca colunas terminais (não permitem novo drop sem confirmação reforçada) */
  isTerminal?: boolean;
}

export type KanbanColumnId =
  | 'TRIAGE'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED';

export type KanbanColumnAccent =
  | 'slate'
  | 'sky'
  | 'violet'
  | 'amber'
  | 'teal'
  | 'emerald'
  | 'rose';

// =============================================================================
// State machine
// =============================================================================

/**
 * Resultado da validação de uma transição entre colunas.
 * - allowed: pode prosseguir sem confirmação
 * - confirm: precisa confirmar (warn modal)
 * - pin: precisa de PIN (operação sensível)
 * - blocked: não pode mover (motivo obrigatório)
 */
export type KanbanTransitionVerdict =
  | { kind: 'allowed' }
  | { kind: 'confirm'; reason: string }
  | { kind: 'pin'; reason: string }
  | { kind: 'blocked'; reason: string };

export interface KanbanTransitionContext {
  fromColumn: KanbanColumnDefinition;
  toColumn: KanbanColumnDefinition;
  /** Nota da entrevista (0-5) — usado em validações de avanço para "Oferta" */
  rating: number | null;
}

// =============================================================================
// Card view-model
// =============================================================================

/**
 * View-model de um cartão do Kanban.
 * Combina dados de Application + Candidate enriquecidos para renderização.
 */
export interface KanbanCandidateCard {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  source: string;
  rating: number | null;
  tags: string[];
  appliedAt: string;
  jobPostingTitle?: string;
}

// =============================================================================
// Filters
// =============================================================================

export interface KanbanBoardFilters {
  search: string;
  source: string;
  minRating: number | null;
}
