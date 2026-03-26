/**
 * OpenSea OS - CIPA Entity Config
 */

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { defineEntityConfig } from '@/core/types';
import type { CipaMandate } from '@/types/hr';
import { Eye, Plus, Shield, Trash2 } from 'lucide-react';

export const cipaConfig = defineEntityConfig<CipaMandate>()({
  name: 'CipaMandate',
  namePlural: 'CipaMandates',
  slug: 'cipa',
  description: 'Gerenciamento de mandatos da CIPA',
  icon: Shield,

  api: {
    baseUrl: '/api/v1/hr/cipa/mandates',
    queryKey: 'cipa',
    queryKeys: {
      list: ['cipa', 'mandates'],
      detail: (id: string) => ['cipa', 'mandates', id],
    },
    endpoints: {
      list: '/v1/hr/cipa/mandates',
      get: '/v1/hr/cipa/mandates/:id',
      create: '/v1/hr/cipa/mandates',
      update: '/v1/hr/cipa/mandates/:id',
      delete: '/v1/hr/cipa/mandates/:id',
    },
  },

  routes: {
    list: '/hr/cipa',
    detail: '/hr/cipa/:id',
    create: '/hr/cipa/new',
    edit: '/hr/cipa/:id/edit',
  },

  display: {
    icon: Shield,
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    titleField: 'name',
    subtitleField: 'status',
    imageField: undefined,
    labels: {
      singular: 'Mandato CIPA',
      plural: 'Mandatos CIPA',
      createButton: 'Novo Mandato',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum mandato da CIPA encontrado',
      searchPlaceholder: 'Buscar mandatos por nome...',
    },
    badgeFields: [],
    metaFields: [
      {
        field: 'startDate',
        label: 'Início',
        format: 'date',
      },
      {
        field: 'endDate',
        label: 'Fim',
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
    searchableFields: ['name'],
    defaultSort: { field: 'startDate', direction: 'desc' },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  form: {
    sections: [
      {
        id: 'basic',
        title: 'Informações do Mandato',
        description: '',
        fields: [
          {
            name: 'name',
            label: 'Nome',
            type: 'text',
            required: true,
            placeholder: 'Nome do mandato',
            colSpan: 2,
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
    view: HR_PERMISSIONS.CIPA.LIST,
    create: HR_PERMISSIONS.CIPA.CREATE,
    update: HR_PERMISSIONS.CIPA.UPDATE,
    delete: HR_PERMISSIONS.CIPA.DELETE,
    export: HR_PERMISSIONS.CIPA.MANAGE,
    import: HR_PERMISSIONS.CIPA.MANAGE,
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
        label: 'Novo Mandato',
        icon: Plus,
        variant: 'default',
        permission: HR_PERMISSIONS.CIPA.CREATE,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: HR_PERMISSIONS.CIPA.LIST,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: HR_PERMISSIONS.CIPA.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Mandato',
        confirmMessage: 'Tem certeza que deseja excluir este mandato?',
      },
    ],
    batch: [],
  },
});

export default cipaConfig;
