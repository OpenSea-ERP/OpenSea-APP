/**
 * OpenSea OS - Warehouses Entity Config
 * Configuração da entidade de armazéns para o EntityGrid
 */

import { STOCK_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Warehouse } from '@/types/stock';
import {
  Edit,
  Eye,
  Plus,
  Trash2,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

export const warehousesConfig = defineEntityConfig<Warehouse>()({
  // ======================== IDENTIFICAÇÃO ========================
  name: 'Armazém',
  namePlural: 'Armazéns',
  slug: 'warehouses',
  description: 'Gerenciamento de armazéns',
  icon: WarehouseIcon,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/warehouses',
    queryKey: 'warehouses',
    queryKeys: {
      list: ['warehouses'],
      detail: (id: string) => ['warehouses', id],
    },
    endpoints: {
      list: '/v1/warehouses',
      get: '/v1/warehouses/:id',
      create: '/v1/warehouses',
      update: '/v1/warehouses/:id',
      delete: '/v1/warehouses/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/stock/locations',
    detail: '/stock/locations/:id',
    create: '/stock/locations/new',
    edit: '/stock/locations/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: WarehouseIcon,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    titleField: 'name',
    subtitleField: 'code',
    imageField: undefined,
    labels: {
      singular: 'Armazém',
      plural: 'Armazéns',
      createButton: 'Novo Armazém',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum armazém encontrado',
      searchPlaceholder: 'Buscar armazéns por código ou nome...',
    },
    badgeFields: [
      {
        field: 'isActive',
        label: 'Status',
        colorMap: {
          true: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          false: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
        },
        render: (value: unknown) => (value ? 'Ativo' : 'Inativo'),
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
    searchableFields: ['name', 'code', 'description'],
    defaultSort: {
      field: 'name',
      direction: 'asc',
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
        description: 'Dados principais do armazém',
        fields: [
          {
            name: 'code',
            label: 'Código',
            type: 'text',
            required: true,
            placeholder: 'Ex: FAB',
            colSpan: 2,
            description: 'Código único de 2 a 5 caracteres',
          },
          {
            name: 'name',
            label: 'Nome',
            type: 'text',
            required: true,
            placeholder: 'Ex: Fábrica Principal',
            colSpan: 2,
          },
          {
            name: 'description',
            label: 'Descrição',
            type: 'textarea',
            placeholder: 'Descrição do armazém',
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

  // ======================== PERMISSÕES ========================
  permissions: {
    view: STOCK_PERMISSIONS.LOCATIONS.READ,
    create: STOCK_PERMISSIONS.LOCATIONS.CREATE,
    update: STOCK_PERMISSIONS.LOCATIONS.UPDATE,
    delete: STOCK_PERMISSIONS.LOCATIONS.DELETE,
    export: STOCK_PERMISSIONS.LOCATIONS.MANAGE,
    import: STOCK_PERMISSIONS.LOCATIONS.MANAGE,
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
    filters: false,
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

  // ======================== AÇÕES ========================
  actions: {
    header: [
      {
        id: 'create',
        label: 'Novo Armazém',
        icon: Plus,
        variant: 'default',
        permission: STOCK_PERMISSIONS.LOCATIONS.CREATE,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.LOCATIONS.READ,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.LOCATIONS.UPDATE,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.LOCATIONS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Armazém',
        confirmMessage: 'Tem certeza que deseja excluir este armazém?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: STOCK_PERMISSIONS.LOCATIONS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Armazéns',
        confirmMessage:
          'Tem certeza que deseja excluir os armazéns selecionados?',
      },
    ],
  },
});

export default warehousesConfig;
