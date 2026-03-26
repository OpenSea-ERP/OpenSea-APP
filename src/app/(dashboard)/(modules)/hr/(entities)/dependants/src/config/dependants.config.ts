/**
 * OpenSea OS - Dependants Entity Config
 * Configuracao completa da entidade de dependentes
 */

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { defineEntityConfig } from '@/core/types';
import type { EmployeeDependant } from '@/types/hr';
import { Eye, Heart, Plus, Trash2 } from 'lucide-react';

export const dependantsConfig = defineEntityConfig<EmployeeDependant>()({
  // ======================== IDENTIFICACAO ========================
  name: 'Dependant',
  namePlural: 'Dependants',
  slug: 'dependants',
  description: 'Gerenciamento de dependentes de funcionários',
  icon: Heart,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/hr/employees/:employeeId/dependants',
    queryKey: 'dependants',
    queryKeys: {
      list: ['dependants'],
      detail: (id: string) => ['dependants', id],
    },
    endpoints: {
      list: '/v1/hr/employees/:employeeId/dependants',
      get: '/v1/hr/dependants/:id',
      create: '/v1/hr/employees/:employeeId/dependants',
      update: '/v1/hr/dependants/:id',
      delete: '/v1/hr/dependants/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/hr/dependants',
    detail: '/hr/dependants/:id',
    create: '/hr/dependants/new',
    edit: '/hr/dependants/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: Heart,
    color: 'pink',
    gradient: 'from-pink-500 to-pink-600',
    titleField: 'name',
    subtitleField: 'relationship',
    imageField: undefined,
    labels: {
      singular: 'Dependente',
      plural: 'Dependentes',
      createButton: 'Novo Dependente',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum dependente encontrado',
      searchPlaceholder: 'Buscar dependentes por nome ou CPF...',
    },
    badgeFields: [],
    metaFields: [
      {
        field: 'birthDate',
        label: 'Data de Nascimento',
        format: 'date',
      },
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
    searchableFields: ['name', 'cpf'],
    defaultSort: {
      field: 'createdAt',
      direction: 'desc',
    },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // ======================== FORMULARIO ========================
  form: {
    sections: [
      {
        id: 'basic',
        title: 'Informacoes do Dependente',
        description: '',
        fields: [
          {
            name: 'name',
            label: 'Nome Completo',
            type: 'text',
            required: true,
            placeholder: 'Ex: Maria Silva',
            colSpan: 1,
            description: '',
          },
          {
            name: 'cpf',
            label: 'CPF',
            type: 'text',
            required: false,
            placeholder: '000.000.000-00',
            colSpan: 1,
            description: '',
          },
          {
            name: 'birthDate',
            label: 'Data de Nascimento',
            type: 'date',
            required: true,
            placeholder: '',
            colSpan: 1,
            description: '',
          },
          {
            name: 'relationship',
            label: 'Parentesco',
            type: 'select',
            required: true,
            placeholder: 'Selecione',
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

  // ======================== PERMISSOES ========================
  permissions: {
    view: HR_PERMISSIONS.DEPENDANTS.LIST,
    create: HR_PERMISSIONS.DEPENDANTS.CREATE,
    update: HR_PERMISSIONS.DEPENDANTS.UPDATE,
    delete: HR_PERMISSIONS.DEPENDANTS.DELETE,
    export: HR_PERMISSIONS.DEPENDANTS.MANAGE,
    import: HR_PERMISSIONS.DEPENDANTS.MANAGE,
  },

  // ======================== FEATURES ========================
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

  // ======================== ACOES ========================
  actions: {
    header: [
      {
        id: 'create',
        label: 'Novo Dependente',
        icon: Plus,
        variant: 'default',
        permission: HR_PERMISSIONS.DEPENDANTS.CREATE,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: HR_PERMISSIONS.DEPENDANTS.LIST,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: HR_PERMISSIONS.DEPENDANTS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Dependente',
        confirmMessage: 'Tem certeza que deseja excluir este dependente?',
      },
    ],
    batch: [],
  },
});

export default dependantsConfig;
