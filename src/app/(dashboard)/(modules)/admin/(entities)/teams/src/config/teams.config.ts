/**
 * Teams Module Configuration
 * Definição completa da entidade Teams
 */

import { CORE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Team } from '@/types/core';
import { PiUsersThreeDuotone } from 'react-icons/pi';

export const teamsConfig = defineEntityConfig<Team>()({
  // ======================== IDENTIFICAÇÃO ========================
  name: 'Equipe',
  namePlural: 'Equipes',
  slug: 'teams',
  description: 'Gerenciamento de equipes da organização',
  icon: PiUsersThreeDuotone,

  // ======================== API ========================
  api: {
    baseUrl: '/v1/teams',
    queryKey: 'teams',
    queryKeys: {
      list: ['teams'],
      detail: (id: string) => ['teams', id],
    },
    endpoints: {
      list: '/v1/teams',
      get: '/v1/teams/:id',
      create: '/v1/teams',
      update: '/v1/teams/:id',
      delete: '/v1/teams/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/admin/teams',
    detail: '/admin/teams/:id',
    create: '/admin/teams/new',
    edit: '/admin/teams/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: PiUsersThreeDuotone,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    titleField: 'name',
    subtitleField: 'slug',
    labels: {
      singular: 'Equipe',
      plural: 'Equipes',
      createButton: 'Nova Equipe',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhuma equipe encontrada',
      searchPlaceholder: 'Buscar equipes por nome ou descrição...',
    },
  },

  // ======================== GRID/LISTA ========================
  grid: {
    defaultView: 'grid',
    columns: {
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
    },
    showViewToggle: true,
  },

  // ======================== PERMISSÕES ========================
  permissions: {
    view: CORE_PERMISSIONS.TEAMS.READ,
    create: CORE_PERMISSIONS.TEAMS.CREATE,
    update: CORE_PERMISSIONS.TEAMS.UPDATE,
    delete: CORE_PERMISSIONS.TEAMS.DELETE,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: false,
    export: false,
    import: false,
  },
});
