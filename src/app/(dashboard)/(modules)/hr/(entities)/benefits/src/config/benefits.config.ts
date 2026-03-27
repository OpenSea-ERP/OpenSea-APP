/**
 * OpenSea OS - Benefits Entity Config
 */

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { defineEntityConfig } from '@/core/types';
import type { BenefitPlan } from '@/types/hr';
import { Copy, Edit, Eye, Heart, Plus, Trash2 } from 'lucide-react';

export const benefitsConfig = defineEntityConfig<BenefitPlan>()({
  // ======================== IDENTIFICAÇÃO ========================
  name: 'BenefitPlan',
  namePlural: 'BenefitPlans',
  slug: 'benefits',
  description: 'Gestão de planos de benefícios',
  icon: Heart,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/hr/benefit-plans',
    queryKey: 'benefit-plans',
    queryKeys: {
      list: ['benefit-plans'],
      detail: (id: string) => ['benefit-plans', id],
    },
    endpoints: {
      list: '/v1/hr/benefit-plans',
      get: '/v1/hr/benefit-plans/:id',
      create: '/v1/hr/benefit-plans',
      update: '/v1/hr/benefit-plans/:id',
      delete: '/v1/hr/benefit-plans/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/hr/benefits',
    detail: '/hr/benefits/:id',
    create: '/hr/benefits/new',
    edit: '/hr/benefits/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: Heart,
    color: 'pink',
    gradient: 'from-pink-500 to-pink-600',
    titleField: 'name',
    subtitleField: 'description',
    imageField: undefined,
    labels: {
      singular: 'Plano de Benefício',
      plural: 'Planos de Benefícios',
      createButton: 'Novo Plano',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum plano de benefício encontrado',
      searchPlaceholder: 'Buscar planos de benefícios...',
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
    searchableFields: ['name', 'provider', 'description'],
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
        description: '',
        fields: [
          {
            name: 'name',
            label: 'Nome do Plano',
            type: 'text',
            required: true,
            placeholder: 'Ex: Plano Saúde Básico',
            colSpan: 1,
            description: '',
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            placeholder: 'Selecione o tipo',
            colSpan: 1,
            description: '',
          },
          {
            name: 'provider',
            label: 'Operadora/Fornecedor',
            type: 'text',
            required: false,
            placeholder: 'Ex: Unimed, Alelo, VR Benefícios',
            colSpan: 1,
            description: '',
          },
          {
            name: 'policyNumber',
            label: 'Número da Apólice',
            type: 'text',
            required: false,
            placeholder: 'Número do contrato',
            colSpan: 1,
            description: '',
          },
          {
            name: 'description',
            label: 'Descrição',
            type: 'textarea',
            required: false,
            placeholder: 'Descreva o plano de benefício',
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

  // ======================== PERMISSÕES ========================
  permissions: {
    view: HR_PERMISSIONS.BENEFITS.LIST,
    create: HR_PERMISSIONS.BENEFITS.CREATE,
    update: HR_PERMISSIONS.BENEFITS.UPDATE,
    delete: HR_PERMISSIONS.BENEFITS.DELETE,
    export: HR_PERMISSIONS.BENEFITS.LIST,
    import: HR_PERMISSIONS.BENEFITS.CREATE,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: true,
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

  // ======================== AÇÕES ========================
  actions: {
    header: [
      {
        id: 'create',
        label: 'Novo Plano',
        icon: Plus,
        variant: 'default',
        permission: HR_PERMISSIONS.BENEFITS.CREATE,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: HR_PERMISSIONS.BENEFITS.VIEW,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: HR_PERMISSIONS.BENEFITS.UPDATE,
      },
      {
        id: 'duplicate',
        label: 'Duplicar',
        icon: Copy,
        onClick: () => {},
        permission: HR_PERMISSIONS.BENEFITS.CREATE,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: HR_PERMISSIONS.BENEFITS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Plano',
        confirmMessage: 'Tem certeza que deseja excluir este plano?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: HR_PERMISSIONS.BENEFITS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Planos',
        confirmMessage:
          'Tem certeza que deseja excluir os planos selecionados?',
      },
    ],
  },
});

export default benefitsConfig;
