/**
 * HR Teams Module Index
 * Exportacoes centralizadas do modulo de equipes no contexto HR
 */

// Config
export { hrTeamsConfig } from './config/teams.config';

// Modals
export { AddMemberDialog, CreateModal, RenameModal } from './modals';

// Utils
export {
  createTeam,
  deleteTeam,
  getTeam,
  listTeams,
  updateTeam,
} from './utils/teams.crud';

export {
  formatMembersCount,
  getStatusBadgeVariant,
  getStatusLabel,
  getTeamColorStyle,
} from './utils/teams.utils';
