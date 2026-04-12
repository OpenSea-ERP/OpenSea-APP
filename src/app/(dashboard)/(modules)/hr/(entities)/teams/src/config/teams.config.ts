/**
 * HR Teams Module Configuration
 * Configuracao da entidade Teams no contexto do modulo HR
 */

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { defineEntityConfig } from '@/core/types';
import type { Team } from '@/types/core';
import { PiUsersThreeDuotone } from 'react-icons/pi';

export const hrTeamsConfig = defineEntityConfig<Team>()({
  // ======================== IDENTIFICACAO ========================
  name: 'Equipe',
  namePlural: 'Equipes',
  slug: 'teams',
  description: 'Gerencie equipes e seus membros no contexto de RH',
  icon: PiUsersThreeDuotone,

  // ======================== API ========================
  api: {
    baseUrl: '/v1/teams',
    queryKey: 'hr-teams',
    queryKeys: {
      list: ['hr-teams'],
      detail: (id: string) => ['hr-teams', id],
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
    list: '/hr/teams',
    detail: '/hr/teams/:id',
    create: '/hr/teams/new',
    edit: '/hr/teams/:id/edit',
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

  // ======================== PERMISSOES ========================
  permissions: {
    view: HR_PERMISSIONS.TEAMS.LIST,
    create: HR_PERMISSIONS.TEAMS.CREATE,
    update: HR_PERMISSIONS.TEAMS.UPDATE,
    delete: HR_PERMISSIONS.TEAMS.DELETE,
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
