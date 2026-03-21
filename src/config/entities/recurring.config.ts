/**
 * OpenSea OS - Recurring Entity Config
 * Configuracao completa da entidade de recorrencias financeiras
 */

import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { RecurringConfig } from '@/types/finance';
import {
  Edit,
  Eye,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';

export const recurringConfig = defineEntityConfig<RecurringConfig>()({
  // ======================== IDENTIFICACAO ========================
  name: 'Recorrência',
  namePlural: 'Recorrências',
  slug: 'recurring',
  description: 'Gerenciamento de lançamentos recorrentes automáticos',
  icon: RefreshCw,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/finance/recurring',
    queryKey: 'recurring-configs',
    queryKeys: {
      list: ['recurring-configs'],
      detail: (id: string) => ['recurring-configs', id],
    },
    endpoints: {
      list: '/v1/finance/recurring',
      get: '/v1/finance/recurring/:id',
      create: '/v1/finance/recurring',
      update: '/v1/finance/recurring/:id',
      delete: '/v1/finance/recurring/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/finance/recurring',
    detail: '/finance/recurring/:id',
    create: '/finance/recurring/new',
    edit: '/finance/recurring/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: RefreshCw,
    color: 'violet',
    gradient: 'from-violet-500 to-violet-600',
    titleField: 'description',
    subtitleField: 'frequencyUnit',
    imageField: undefined,
    labels: {
      singular: 'Recorrência',
      plural: 'Recorrências',
      createButton: 'Nova Recorrência',
      editButton: 'Editar',
      deleteButton: 'Cancelar',
      emptyState: 'Nenhuma recorrência encontrada',
      searchPlaceholder: 'Buscar por descrição...',
    },
    badgeFields: [
      {
        field: 'status',
        label: 'Status',
        colorMap: {
          ACTIVE:
            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          PAUSED:
            'bg-amber-500/20 text-amber-700 dark:text-amber-400',
          CANCELLED:
            'bg-rose-500/20 text-rose-700 dark:text-rose-400',
        },
        render: (value: unknown) => {
          const labels = {
            ACTIVE: 'Ativa',
            PAUSED: 'Pausada',
            CANCELLED: 'Cancelada',
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
    searchableFields: ['description'],
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
        description: 'Informações principais da recorrência',
        fields: [
          {
            name: 'description',
            label: 'Descrição',
            type: 'text',
            required: true,
            placeholder: 'Ex: Aluguel mensal',
            colSpan: 4,
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            colSpan: 2,
          },
          {
            name: 'expectedAmount',
            label: 'Valor Base',
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
    view: FINANCE_PERMISSIONS.RECURRING.ACCESS,
    create: FINANCE_PERMISSIONS.RECURRING.REGISTER,
    update: FINANCE_PERMISSIONS.RECURRING.MODIFY,
    delete: FINANCE_PERMISSIONS.RECURRING.ADMIN,
    export: undefined,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: false,
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
        label: 'Nova Recorrência',
        icon: Plus,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.RECURRING.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.RECURRING.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.RECURRING.MODIFY,
      },
      {
        id: 'cancel',
        label: 'Cancelar',
        icon: XCircle,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.RECURRING.ADMIN,
        confirm: true,
        confirmTitle: 'Cancelar Recorrência',
        confirmMessage: 'Tem certeza que deseja cancelar esta recorrência?',
      },
    ],
    batch: [],
  },
});

export default recurringConfig;
