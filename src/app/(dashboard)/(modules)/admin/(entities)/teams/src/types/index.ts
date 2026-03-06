/**
 * Teams Module Types
 * Tipos específicos do módulo de equipes
 */

import type { Team } from '@/types/core';

// ============================================================================
// MODAL TYPES
// ============================================================================

export interface CreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export interface DetailModalProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface NewTeamData {
  name: string;
  description: string;
  color: string;
}

// ============================================================================
// CARD TYPES
// ============================================================================

export interface TeamCardProps {
  team: Team;
  isSelected: boolean;
}
