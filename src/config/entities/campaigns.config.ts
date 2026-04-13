/**
 * OpenSea OS - Campaigns Entity Config
 * Configuração completa da entidade de campanhas promocionais
 */

import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Campaign } from '@/types/sales';
import { Edit, Eye, Megaphone, Plus, Trash2 } from 'lucide-react';

export const campaignsConfig = defineEntityConfig<Campaign>()({
  // ======================== IDENTIFICAÇÃO ========================
  name: 'Campanha',
  namePlural: 'Campanhas',
  slug: 'campaigns',
  description: 'Gerenciamento de campanhas promocionais e descontos',
  icon: Megaphone,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/campaigns',
    queryKey: 'campaigns',
    queryKeys: {
      list: ['campaigns'],
      detail: (id: string) => ['campaigns', id],
    },
    endpoints: {
      list: '/v1/campaigns',
      get: '/v1/campaigns/:id',
      create: '/v1/campaigns',
      update: '/v1/campaigns/:id',
      delete: '/v1/campaigns/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/sales/campaigns',
    detail: '/sales/campaigns/:id',
    create: '/sales/campaigns/new',
    edit: '/sales/campaigns/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: Megaphone,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    titleField: 'name',
    subtitleField: 'description',
    imageField: undefined,
    labels: {
      singular: 'Campanha',
      plural: 'Campanhas',
      createButton: 'Nova Campanha',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhuma campanha encontrada',
      searchPlaceholder: 'Buscar campanhas por nome...',
    },
    badgeFields: [
      {
        field: 'status',
        label: 'Status',
        colorMap: {
          DRAFT: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
          SCHEDULED: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
          ACTIVE: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          PAUSED: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
          ENDED: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
          ARCHIVED: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
        },
        render: (value: unknown) => {
          const labels = {
            DRAFT: 'Rascunho',
            SCHEDULED: 'Agendada',
            ACTIVE: 'Ativa',
            PAUSED: 'Pausada',
            ENDED: 'Encerrada',
            ARCHIVED: 'Arquivada',
          };
          return labels[value as keyof typeof labels] || String(value);
        },
      },
    ],
    metaFields: [
      {
        field: 'createdAt',
        label: 'Criado em',
        format: 'date',
      },
    ],
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
    enableDragSelection: true,
    selectable: true,
    searchableFields: ['name'],
    defaultSort: {
      field: 'createdAt',
      direction: 'desc',
    },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // ======================== FORMULÁRIO ========================
  form: {
    sections: [
      {
        id: 'basic',
        title: 'Informações Básicas',
        description: 'Dados de identificação da campanha',
        fields: [
          {
            name: 'name',
            label: 'Nome',
            type: 'text',
            required: true,
            placeholder: 'Nome da campanha',
            colSpan: 4,
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'text',
            required: true,
            placeholder: 'Tipo da campanha',
            colSpan: 2,
          },
        ],
        columns: 4,
      },
    ],
    defaultColumns: 4,
    validateOnBlur: true,
    showRequiredIndicator: true,
  },

  // ======================== PERMISSÕES ========================
  permissions: {
    view: SALES_PERMISSIONS.CAMPAIGNS.ACCESS,
    create: SALES_PERMISSIONS.CAMPAIGNS.REGISTER,
    update: SALES_PERMISSIONS.CAMPAIGNS.MODIFY,
    delete: SALES_PERMISSIONS.CAMPAIGNS.REMOVE,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: false,
    softDelete: false,
    export: false,
    import: false,
    search: true,
    filters: true,
    sort: true,
    pagination: true,
    selection: true,
    multiSelect: true,
    batchOperations: true,
    favorite: false,
    archive: true,
    auditLog: true,
    versioning: false,
    realtime: false,
  },

  // ======================== AÇÕES ========================
  actions: {
    header: [
      {
        id: 'create',
        label: 'Nova Campanha',
        icon: Plus,
        variant: 'default',
        permission: SALES_PERMISSIONS.CAMPAIGNS.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CAMPAIGNS.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CAMPAIGNS.MODIFY,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CAMPAIGNS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Campanha',
        confirmMessage: 'Tem certeza que deseja excluir esta campanha?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionadas',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: SALES_PERMISSIONS.CAMPAIGNS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Campanhas',
        confirmMessage:
          'Tem certeza que deseja excluir as campanhas selecionadas?',
      },
    ],
  },
});

export default campaignsConfig;
