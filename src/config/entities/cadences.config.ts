/**
 * OpenSea OS - Cadences Entity Config
 * Configuração completa da entidade de cadências de vendas
 */

import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { CadenceSequence } from '@/types/sales';
import { Edit, Eye, Plus, Route, Trash2 } from 'lucide-react';

export const cadencesConfig = defineEntityConfig<CadenceSequence>()({
  name: 'Cadência',
  namePlural: 'Cadências',
  slug: 'cadences',
  description: 'Sequências de cadência para automação de vendas',
  icon: Route,

  api: {
    baseUrl: '/api/v1/sales/cadences',
    queryKey: 'cadences',
    queryKeys: {
      list: ['cadences'],
      detail: (id: string) => ['cadences', id],
    },
    endpoints: {
      list: '/v1/sales/cadences',
      get: '/v1/sales/cadences/:id',
      create: '/v1/sales/cadences',
      update: '/v1/sales/cadences/:id',
      delete: '/v1/sales/cadences/:id',
    },
  },

  routes: {
    list: '/sales/cadences',
    detail: '/sales/cadences/:id',
    create: '/sales/cadences/new',
    edit: '/sales/cadences/:id/edit',
  },

  display: {
    icon: Route,
    color: 'cyan',
    gradient: 'from-cyan-500 to-teal-600',
    titleField: 'name',
    subtitleField: 'description',
    imageField: undefined,
    labels: {
      singular: 'Cadência',
      plural: 'Cadências',
      createButton: 'Nova Cadência',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhuma cadência encontrada',
      searchPlaceholder: 'Buscar cadências por nome...',
    },
    badgeFields: [],
    metaFields: [
      { field: 'createdAt', label: 'Criado em', format: 'date' },
    ],
  },

  grid: {
    defaultView: 'grid',
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    showViewToggle: true,
    enableDragSelection: true,
    selectable: true,
    searchableFields: ['name'],
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50],
  },

  form: {
    sections: [
      {
        id: 'basic',
        title: 'Informações Básicas',
        description: 'Dados da cadência',
        fields: [
          {
            name: 'name',
            label: 'Nome',
            type: 'text',
            required: true,
            placeholder: 'Nome da cadência',
            colSpan: 4,
          },
          {
            name: 'description',
            label: 'Descrição',
            type: 'textarea',
            placeholder: 'Descrição da cadência',
            colSpan: 4,
          },
        ],
        columns: 4,
      },
    ],
    defaultColumns: 4,
    validateOnBlur: true,
    showRequiredIndicator: true,
  },

  permissions: {
    view: SALES_PERMISSIONS.CADENCES.ACCESS,
    create: SALES_PERMISSIONS.CADENCES.REGISTER,
    update: SALES_PERMISSIONS.CADENCES.MODIFY,
    delete: SALES_PERMISSIONS.CADENCES.REMOVE,
  },

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
    archive: false,
    auditLog: true,
    versioning: false,
    realtime: false,
  },

  actions: {
    header: [
      {
        id: 'create',
        label: 'Nova Cadência',
        icon: Plus,
        variant: 'default',
        permission: SALES_PERMISSIONS.CADENCES.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CADENCES.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CADENCES.MODIFY,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CADENCES.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Cadência',
        confirmMessage: 'Tem certeza que deseja excluir esta cadência?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: SALES_PERMISSIONS.CADENCES.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Cadências',
        confirmMessage: 'Tem certeza que deseja excluir as cadências selecionadas?',
      },
    ],
  },
});

export default cadencesConfig;
