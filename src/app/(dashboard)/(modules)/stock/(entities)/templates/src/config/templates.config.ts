/**
 * OpenSea OS - Templates Entity Config
 * Configuração completa da entidade de templates
 */

import { STOCK_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Template } from '@/types/stock';
import { Copy, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { GrObjectGroup } from 'react-icons/gr';

export const templatesConfig = defineEntityConfig<Template>()({
  // ======================== IDENTIFICAÇÃO ========================
  name: 'Template',
  namePlural: 'Templates',
  slug: 'templates',
  description: 'Gerenciamento de templates de produtos',
  icon: GrObjectGroup,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/templates',
    queryKey: 'templates',
    queryKeys: {
      list: ['templates'],
      detail: (id: string) => ['templates', id],
    },
    endpoints: {
      list: '/v1/templates',
      get: '/v1/templates/:id',
      create: '/v1/templates',
      update: '/v1/templates/:id',
      delete: '/v1/templates/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/stock/templates',
    detail: '/stock/templates/:id',
    create: '/stock/templates/new',
    edit: '/stock/templates/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: GrObjectGroup,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    titleField: 'name',
    subtitleField: undefined,
    imageField: undefined,
    labels: {
      singular: 'Template',
      plural: 'Templates',
      createButton: 'Novo Template',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum template encontrado',
      searchPlaceholder: 'Buscar templates...',
    },
    badgeFields: [],
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
        title: '',
        description: '',
        fields: [
          {
            name: 'name',
            label: 'Nome do Template',
            type: 'text',
            required: true,
            placeholder: 'Ex: Tecido, Linha, Botão',
            colSpan: 1,
            description: '',
          },
          {
            name: 'unitOfMeasure',
            label: 'Unidade de Medida',
            type: 'select',
            required: true,
            colSpan: 1,
            defaultValue: 'METERS',
            options: [
              { value: 'METERS', label: 'Metros' },
              { value: 'KILOGRAMS', label: 'Quilogramas' },
              { value: 'UNITS', label: 'Unidades' },
            ],
            description: '',
          },
        ],
        columns: 2,
      },
    ],
    defaultColumns: 2,
    validateOnBlur: true,
    showRequiredIndicator: true,
  },

  // ======================== PERMISSÕES ========================
  permissions: {
    view: STOCK_PERMISSIONS.TEMPLATES.READ,
    create: STOCK_PERMISSIONS.TEMPLATES.CREATE,
    update: STOCK_PERMISSIONS.TEMPLATES.UPDATE,
    delete: STOCK_PERMISSIONS.TEMPLATES.DELETE,
    export: STOCK_PERMISSIONS.TEMPLATES.MANAGE,
    import: STOCK_PERMISSIONS.TEMPLATES.MANAGE,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: true,
    softDelete: true,
    export: true,
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

  // ======================== AÇÕES ========================
  actions: {
    header: [
      {
        id: 'create',
        label: 'Novo Template',
        icon: Plus,
        variant: 'default',
        permission: STOCK_PERMISSIONS.TEMPLATES.CREATE,
        onClick: () => {}, // Handled by page component
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.TEMPLATES.READ,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.TEMPLATES.UPDATE,
      },
      {
        id: 'duplicate',
        label: 'Duplicar',
        icon: Copy,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.TEMPLATES.CREATE,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.TEMPLATES.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Template',
        confirmMessage: 'Tem certeza que deseja excluir este template?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: STOCK_PERMISSIONS.TEMPLATES.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Templates',
        confirmMessage:
          'Tem certeza que deseja excluir os templates selecionados?',
      },
    ],
  },
});

export default templatesConfig;
