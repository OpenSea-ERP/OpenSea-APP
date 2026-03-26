/**
 * OpenSea OS - Terminations Entity Config
 */

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { defineEntityConfig } from '@/core/types';
import type { Termination } from '@/types/hr';
import { Eye, FileX2, Plus, Trash2 } from 'lucide-react';

export const terminationsConfig = defineEntityConfig<Termination>()({
  name: 'Termination',
  namePlural: 'Terminations',
  slug: 'terminations',
  description: 'Gerenciamento de rescisões de contrato',
  icon: FileX2,

  api: {
    baseUrl: '/api/v1/hr/terminations',
    queryKey: 'terminations',
    queryKeys: {
      list: ['terminations'],
      detail: (id: string) => ['terminations', id],
    },
    endpoints: {
      list: '/v1/hr/terminations',
      get: '/v1/hr/terminations/:id',
      create: '/v1/hr/terminations',
      update: '/v1/hr/terminations/:id',
      delete: '/v1/hr/terminations/:id',
    },
  },

  routes: {
    list: '/hr/terminations',
    detail: '/hr/terminations/:id',
    create: '/hr/terminations/new',
    edit: '/hr/terminations/:id/edit',
  },

  display: {
    icon: FileX2,
    color: 'rose',
    gradient: 'from-rose-500 to-rose-600',
    titleField: 'type',
    subtitleField: 'status',
    imageField: undefined,
    labels: {
      singular: 'Rescisão',
      plural: 'Rescisões',
      createButton: 'Nova Rescisão',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhuma rescisão encontrada',
      searchPlaceholder: 'Buscar rescisões...',
    },
    badgeFields: [],
    metaFields: [
      {
        field: 'terminationDate',
        label: 'Data de Rescisão',
        format: 'date',
      },
      {
        field: 'createdAt',
        label: 'Criado em',
        format: 'date',
      },
    ],
  },

  grid: {
    defaultView: 'grid',
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    showViewToggle: true,
    enableDragSelection: true,
    selectable: true,
    searchableFields: ['type', 'status'],
    defaultSort: { field: 'terminationDate', direction: 'desc' },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  form: {
    sections: [
      {
        id: 'basic',
        title: 'Dados da Rescisão',
        description: '',
        fields: [
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            placeholder: 'Selecionar tipo',
            colSpan: 1,
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

  permissions: {
    view: HR_PERMISSIONS.TERMINATIONS.LIST,
    create: HR_PERMISSIONS.TERMINATIONS.CREATE,
    update: HR_PERMISSIONS.TERMINATIONS.UPDATE,
    delete: HR_PERMISSIONS.TERMINATIONS.DELETE,
    export: HR_PERMISSIONS.TERMINATIONS.MANAGE,
    import: HR_PERMISSIONS.TERMINATIONS.MANAGE,
  },

  features: {
    create: true,
    edit: false,
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
    multiSelect: false,
    batchOperations: false,
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
        label: 'Nova Rescisão',
        icon: Plus,
        variant: 'default',
        permission: HR_PERMISSIONS.TERMINATIONS.CREATE,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: HR_PERMISSIONS.TERMINATIONS.LIST,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: HR_PERMISSIONS.TERMINATIONS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Rescisão',
        confirmMessage: 'Tem certeza que deseja excluir esta rescisão?',
      },
    ],
    batch: [],
  },
});

export default terminationsConfig;
