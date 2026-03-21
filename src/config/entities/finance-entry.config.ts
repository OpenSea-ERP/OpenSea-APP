/**
 * OpenSea OS - Finance Entry Entity Config
 * Configuração completa da entidade de lançamentos financeiros
 */

import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { FinanceEntry } from '@/types/finance';
import {
  ArrowDownCircle,
  DollarSign,
  Edit,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';

export const financeEntryConfig = defineEntityConfig<FinanceEntry>()({
  // ======================== IDENTIFICAÇÃO ========================
  name: 'Lançamento',
  namePlural: 'Lançamentos',
  slug: 'finance-entries',
  description: 'Gerenciamento de lançamentos financeiros',
  icon: ArrowDownCircle,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/finance/entries',
    queryKey: 'finance-entries',
    queryKeys: {
      list: ['finance-entries'],
      detail: (id: string) => ['finance-entries', id],
    },
    endpoints: {
      list: '/v1/finance/entries',
      get: '/v1/finance/entries/:id',
      create: '/v1/finance/entries',
      update: '/v1/finance/entries/:id',
      delete: '/v1/finance/entries/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/finance/payable',
    detail: '/finance/payable/:id',
    create: '/finance/payable/new',
    edit: '/finance/payable/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: ArrowDownCircle,
    color: 'rose',
    gradient: 'from-rose-500 to-rose-600',
    titleField: 'description',
    subtitleField: 'code',
    imageField: undefined,
    labels: {
      singular: 'Conta a Pagar',
      plural: 'Contas a Pagar',
      createButton: 'Nova Conta a Pagar',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhuma conta a pagar encontrada',
      searchPlaceholder: 'Buscar por descrição ou código...',
    },
    badgeFields: [
      {
        field: 'status',
        label: 'Status',
        colorMap: {
          PENDING:
            'bg-slate-500/20 text-slate-700 dark:text-slate-400',
          OVERDUE:
            'bg-rose-500/20 text-rose-700 dark:text-rose-400',
          PAID: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          RECEIVED:
            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          PARTIALLY_PAID:
            'bg-amber-500/20 text-amber-700 dark:text-amber-400',
          CANCELLED:
            'bg-gray-500/20 text-gray-700 dark:text-gray-400',
          SCHEDULED:
            'bg-sky-500/20 text-sky-700 dark:text-sky-400',
        },
        render: (value: unknown) => {
          const labels = {
            PENDING: 'Pendente',
            OVERDUE: 'Vencido',
            PAID: 'Pago',
            RECEIVED: 'Recebido',
            PARTIALLY_PAID: 'Parc. Pago',
            CANCELLED: 'Cancelado',
            SCHEDULED: 'Agendado',
          };
          return labels[value as keyof typeof labels] || String(value);
        },
      },
    ],
    metaFields: [
      {
        field: 'dueDate',
        label: 'Vencimento',
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
    searchableFields: ['description', 'code', 'supplierName'],
    defaultSort: {
      field: 'dueDate',
      direction: 'desc',
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
        description: 'Dados principais do lançamento',
        fields: [
          {
            name: 'description',
            label: 'Descrição',
            type: 'text',
            required: true,
            placeholder: 'Ex: Aluguel Janeiro',
            colSpan: 4,
          },
          {
            name: 'expectedAmount',
            label: 'Valor Esperado',
            type: 'number',
            required: true,
            placeholder: '0,00',
            colSpan: 2,
          },
          {
            name: 'dueDate',
            label: 'Data de Vencimento',
            type: 'date',
            required: true,
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

  // ======================== PERMISSÕES ========================
  permissions: {
    view: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
    create: FINANCE_PERMISSIONS.ENTRIES.REGISTER,
    update: FINANCE_PERMISSIONS.ENTRIES.MODIFY,
    delete: FINANCE_PERMISSIONS.ENTRIES.REMOVE,
    export: FINANCE_PERMISSIONS.ENTRIES.EXPORT,
    import: FINANCE_PERMISSIONS.ENTRIES.IMPORT,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: false,
    softDelete: true,
    export: true,
    import: true,
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
        label: 'Nova Conta a Pagar',
        icon: Plus,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.ENTRIES.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.ENTRIES.MODIFY,
      },
      {
        id: 'register-payment',
        label: 'Registrar Pagamento',
        icon: DollarSign,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.ENTRIES.MODIFY,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.ENTRIES.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Lançamento',
        confirmMessage: 'Tem certeza que deseja excluir este lançamento?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: FINANCE_PERMISSIONS.ENTRIES.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Lançamentos',
        confirmMessage:
          'Tem certeza que deseja excluir os lançamentos selecionados?',
      },
    ],
  },
});

export default financeEntryConfig;
