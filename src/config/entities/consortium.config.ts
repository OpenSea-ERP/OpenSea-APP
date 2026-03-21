/**
 * OpenSea OS - Consortium Entity Config
 * Configuracao completa da entidade de consorcios
 */

import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Consortium } from '@/types/finance';
import {
  DollarSign,
  Edit,
  Eye,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

export const consortiumConfig = defineEntityConfig<Consortium>()({
  // ======================== IDENTIFICACAO ========================
  name: 'Consórcio',
  namePlural: 'Consórcios',
  slug: 'consortia',
  description: 'Gerenciamento de cotas de consórcio',
  icon: Users,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/finance/consortia',
    queryKey: 'consortia',
    queryKeys: {
      list: ['consortia'],
      detail: (id: string) => ['consortia', id],
    },
    endpoints: {
      list: '/v1/finance/consortia',
      get: '/v1/finance/consortia/:id',
      create: '/v1/finance/consortia',
      update: '/v1/finance/consortia/:id',
      delete: '/v1/finance/consortia/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/finance/consortia',
    detail: '/finance/consortia/:id',
    create: '/finance/consortia/new',
    edit: '/finance/consortia/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: Users,
    color: 'pink',
    gradient: 'from-pink-500 to-pink-600',
    titleField: 'administrator',
    subtitleField: 'name',
    imageField: undefined,
    labels: {
      singular: 'Consórcio',
      plural: 'Consórcios',
      createButton: 'Novo Consórcio',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum consórcio encontrado',
      searchPlaceholder: 'Buscar por nome, administradora ou contrato...',
    },
    badgeFields: [
      {
        field: 'status',
        label: 'Status',
        colorMap: {
          ACTIVE:
            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          CONTEMPLATED:
            'bg-violet-500/20 text-violet-700 dark:text-violet-400',
          WITHDRAWN:
            'bg-amber-500/20 text-amber-700 dark:text-amber-400',
          COMPLETED:
            'bg-sky-500/20 text-sky-700 dark:text-sky-400',
          CANCELLED:
            'bg-gray-500/20 text-gray-700 dark:text-gray-400',
        },
        render: (value: unknown) => {
          const labels = {
            ACTIVE: 'Ativo',
            CONTEMPLATED: 'Contemplado',
            WITHDRAWN: 'Desistente',
            COMPLETED: 'Concluído',
            CANCELLED: 'Cancelado',
          };
          return labels[value as keyof typeof labels] || String(value);
        },
      },
    ],
    metaFields: [
      {
        field: 'startDate',
        label: 'Início',
        format: 'date',
      },
    ],
  },

  // ======================== GRID/LISTA ========================
  grid: {
    defaultView: 'list',
    columns: {
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
    },
    showViewToggle: true,
    enableDragSelection: true,
    selectable: true,
    searchableFields: ['name', 'administrator', 'contractNumber'],
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
        title: 'Dados Básicos',
        description: 'Informações principais do consórcio',
        fields: [
          {
            name: 'name',
            label: 'Nome/Descrição',
            type: 'text',
            required: true,
            placeholder: 'Ex: Consórcio Imóvel Residencial',
            colSpan: 4,
          },
          {
            name: 'administrator',
            label: 'Administradora',
            type: 'text',
            required: true,
            placeholder: 'Ex: Porto Seguro, Embracon...',
            colSpan: 2,
          },
          {
            name: 'creditValue',
            label: 'Valor do Crédito',
            type: 'number',
            required: true,
            placeholder: '0,00',
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

  // ======================== PERMISSOES ========================
  permissions: {
    view: FINANCE_PERMISSIONS.CONSORTIA.ACCESS,
    create: FINANCE_PERMISSIONS.CONSORTIA.REGISTER,
    update: FINANCE_PERMISSIONS.CONSORTIA.MODIFY,
    delete: FINANCE_PERMISSIONS.CONSORTIA.REMOVE,
    export: FINANCE_PERMISSIONS.CONSORTIA.EXPORT,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: false,
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

  // ======================== ACOES ========================
  actions: {
    header: [
      {
        id: 'create',
        label: 'Novo Consórcio',
        icon: Plus,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.CONSORTIA.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.CONSORTIA.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.CONSORTIA.MODIFY,
      },
      {
        id: 'register-payment',
        label: 'Registrar Pagamento',
        icon: DollarSign,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.CONSORTIA.MODIFY,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.CONSORTIA.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Consórcio',
        confirmMessage: 'Tem certeza que deseja excluir este consórcio?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: FINANCE_PERMISSIONS.CONSORTIA.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Consórcios',
        confirmMessage:
          'Tem certeza que deseja excluir os consórcios selecionados?',
      },
    ],
  },
});

export default consortiumConfig;
