/**
 * OpenSea OS - Admissions Entity Config
 */

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { defineEntityConfig } from '@/core/types';
import type { AdmissionInvite } from '@/types/hr';
import { Eye, Plus, Trash2, UserPlus } from 'lucide-react';

export const admissionsConfig = defineEntityConfig<AdmissionInvite>()({
  name: 'Admission',
  namePlural: 'Admissions',
  slug: 'admissions',
  description: 'Gerenciamento de admissões digitais',
  icon: UserPlus,

  api: {
    baseUrl: '/api/v1/hr/admissions',
    queryKey: 'admissions',
    queryKeys: {
      list: ['admissions'],
      detail: (id: string) => ['admissions', id],
    },
    endpoints: {
      list: '/v1/hr/admissions',
      get: '/v1/hr/admissions/:id',
      create: '/v1/hr/admissions',
      update: '/v1/hr/admissions/:id',
      delete: '/v1/hr/admissions/:id',
    },
  },

  routes: {
    list: '/hr/admissions',
    detail: '/hr/admissions/:id',
    create: '/hr/admissions/new',
    edit: '/hr/admissions/:id/edit',
  },

  display: {
    icon: UserPlus,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    titleField: 'fullName',
    subtitleField: 'status',
    imageField: undefined,
    labels: {
      singular: 'Admissão',
      plural: 'Admissões',
      createButton: 'Nova Admissão',
      editButton: 'Editar',
      deleteButton: 'Cancelar',
      emptyState: 'Nenhuma admissão encontrada',
      searchPlaceholder: 'Buscar admissões...',
    },
    badgeFields: [],
    metaFields: [
      {
        field: 'expectedStartDate',
        label: 'Início Previsto',
        format: 'date',
      },
      {
        field: 'expiresAt',
        label: 'Expira em',
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
    searchableFields: ['fullName', 'email', 'status'],
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  form: {
    sections: [
      {
        id: 'candidate',
        title: 'Dados do Candidato',
        description: '',
        fields: [
          {
            name: 'fullName',
            label: 'Nome Completo',
            type: 'text',
            required: true,
            placeholder: 'Nome do candidato',
            colSpan: 2,
            description: '',
          },
          {
            name: 'email',
            label: 'E-mail',
            type: 'text',
            required: true,
            placeholder: 'email@exemplo.com',
            colSpan: 1,
            description: '',
          },
          {
            name: 'phone',
            label: 'Telefone',
            type: 'text',
            required: false,
            placeholder: '(00) 00000-0000',
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
    view: HR_PERMISSIONS.EMPLOYEES.LIST,
    create: HR_PERMISSIONS.EMPLOYEES.CREATE,
    update: HR_PERMISSIONS.EMPLOYEES.UPDATE,
    delete: HR_PERMISSIONS.EMPLOYEES.DELETE,
    export: HR_PERMISSIONS.EMPLOYEES.MANAGE,
    import: HR_PERMISSIONS.EMPLOYEES.MANAGE,
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
        label: 'Nova Admissão',
        icon: Plus,
        variant: 'default',
        permission: HR_PERMISSIONS.EMPLOYEES.CREATE,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'cancel',
        label: 'Cancelar',
        icon: Trash2,
        onClick: () => {},
        permission: HR_PERMISSIONS.EMPLOYEES.DELETE,
        confirm: true,
        confirmTitle: 'Cancelar Admissão',
        confirmMessage: 'Tem certeza que deseja cancelar este convite de admissão?',
      },
    ],
    batch: [],
  },
});

export default admissionsConfig;
