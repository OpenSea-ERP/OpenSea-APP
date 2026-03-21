/**
 * OpenSea OS - Loan Entity Config
 * Configuracao completa da entidade de emprestimos
 */

import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Loan } from '@/types/finance';
import {
  DollarSign,
  Edit,
  Eye,
  Landmark,
  Plus,
  Trash2,
} from 'lucide-react';

export const loanConfig = defineEntityConfig<Loan>()({
  // ======================== IDENTIFICACAO ========================
  name: 'Empréstimo',
  namePlural: 'Empréstimos',
  slug: 'loans',
  description: 'Gerenciamento de empréstimos e financiamentos',
  icon: Landmark,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/finance/loans',
    queryKey: 'loans',
    queryKeys: {
      list: ['loans'],
      detail: (id: string) => ['loans', id],
    },
    endpoints: {
      list: '/v1/finance/loans',
      get: '/v1/finance/loans/:id',
      create: '/v1/finance/loans',
      update: '/v1/finance/loans/:id',
      delete: '/v1/finance/loans/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/finance/loans',
    detail: '/finance/loans/:id',
    create: '/finance/loans/new',
    edit: '/finance/loans/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: Landmark,
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    titleField: 'name',
    subtitleField: 'contractNumber',
    imageField: undefined,
    labels: {
      singular: 'Empréstimo',
      plural: 'Empréstimos',
      createButton: 'Novo Empréstimo',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum empréstimo encontrado',
      searchPlaceholder: 'Buscar por nome, contrato ou tipo...',
    },
    badgeFields: [
      {
        field: 'status',
        label: 'Status',
        colorMap: {
          ACTIVE:
            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          PAID_OFF:
            'bg-sky-500/20 text-sky-700 dark:text-sky-400',
          DEFAULTED:
            'bg-rose-500/20 text-rose-700 dark:text-rose-400',
          RENEGOTIATED:
            'bg-amber-500/20 text-amber-700 dark:text-amber-400',
          CANCELLED:
            'bg-gray-500/20 text-gray-700 dark:text-gray-400',
        },
        render: (value: unknown) => {
          const labels = {
            ACTIVE: 'Ativo',
            PAID_OFF: 'Quitado',
            DEFAULTED: 'Inadimplente',
            RENEGOTIATED: 'Renegociado',
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
    searchableFields: ['name', 'contractNumber'],
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
        title: 'Informações Básicas',
        description: 'Dados principais do empréstimo',
        fields: [
          {
            name: 'name',
            label: 'Nome / Instituição',
            type: 'text',
            required: true,
            placeholder: 'Ex: Banco do Brasil',
            colSpan: 2,
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            colSpan: 2,
          },
          {
            name: 'principalAmount',
            label: 'Valor Principal',
            type: 'number',
            required: true,
            placeholder: '0,00',
            colSpan: 2,
          },
          {
            name: 'interestRate',
            label: 'Taxa de Juros (%)',
            type: 'number',
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
    view: FINANCE_PERMISSIONS.LOANS.ACCESS,
    create: FINANCE_PERMISSIONS.LOANS.REGISTER,
    update: FINANCE_PERMISSIONS.LOANS.MODIFY,
    delete: FINANCE_PERMISSIONS.LOANS.REMOVE,
    export: FINANCE_PERMISSIONS.LOANS.EXPORT,
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
        label: 'Novo Empréstimo',
        icon: Plus,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.LOANS.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.LOANS.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.LOANS.MODIFY,
      },
      {
        id: 'register-payment',
        label: 'Registrar Pagamento',
        icon: DollarSign,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.LOANS.MODIFY,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.LOANS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Empréstimo',
        confirmMessage: 'Tem certeza que deseja excluir este empréstimo?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: FINANCE_PERMISSIONS.LOANS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Empréstimos',
        confirmMessage:
          'Tem certeza que deseja excluir os empréstimos selecionados?',
      },
    ],
  },
});

export default loanConfig;
