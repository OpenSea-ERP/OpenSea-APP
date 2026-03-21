/**
 * OpenSea OS - Contract Entity Config
 * Configuração completa da entidade de contratos
 */

import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Contract } from '@/types/finance';
import {
  DollarSign,
  Edit,
  Eye,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';

export const contractConfig = defineEntityConfig<Contract>()({
  // ======================== IDENTIFICACAO ========================
  name: 'Contrato',
  namePlural: 'Contratos',
  slug: 'contracts',
  description: 'Gerenciamento de contratos com fornecedores',
  icon: FileText,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/finance/contracts',
    queryKey: 'contracts',
    queryKeys: {
      list: ['contracts'],
      detail: (id: string) => ['contracts', id],
    },
    endpoints: {
      list: '/v1/finance/contracts',
      get: '/v1/finance/contracts/:id',
      create: '/v1/finance/contracts',
      update: '/v1/finance/contracts/:id',
      delete: '/v1/finance/contracts/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/finance/contracts',
    detail: '/finance/contracts/:id',
    create: '/finance/contracts/new',
    edit: '/finance/contracts/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: FileText,
    color: 'teal',
    gradient: 'from-teal-500 to-teal-600',
    titleField: 'title',
    subtitleField: 'companyName',
    imageField: undefined,
    labels: {
      singular: 'Contrato',
      plural: 'Contratos',
      createButton: 'Novo Contrato',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum contrato encontrado',
      searchPlaceholder: 'Buscar por título, empresa ou código...',
    },
    badgeFields: [
      {
        field: 'status',
        label: 'Status',
        colorMap: {
          DRAFT:
            'bg-gray-500/20 text-gray-700 dark:text-gray-400',
          ACTIVE:
            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          EXPIRED:
            'bg-rose-500/20 text-rose-700 dark:text-rose-400',
          RENEWED:
            'bg-sky-500/20 text-sky-700 dark:text-sky-400',
          CANCELLED:
            'bg-gray-500/20 text-gray-700 dark:text-gray-400',
        },
        render: (value: unknown) => {
          const labels = {
            DRAFT: 'Rascunho',
            ACTIVE: 'Ativo',
            EXPIRED: 'Expirado',
            RENEWED: 'Renovado',
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
      {
        field: 'endDate',
        label: 'Término',
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
    searchableFields: ['title', 'companyName', 'code'],
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
        description: 'Informações principais do contrato',
        fields: [
          {
            name: 'title',
            label: 'Título',
            type: 'text',
            required: true,
            placeholder: 'Ex: Contrato de Fornecimento',
            colSpan: 4,
          },
          {
            name: 'companyName',
            label: 'Empresa/Fornecedor',
            type: 'text',
            required: true,
            placeholder: 'Razão social ou nome fantasia',
            colSpan: 2,
          },
          {
            name: 'totalValue',
            label: 'Valor Total',
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
    view: FINANCE_PERMISSIONS.CONTRACTS.ACCESS,
    create: FINANCE_PERMISSIONS.CONTRACTS.REGISTER,
    update: FINANCE_PERMISSIONS.CONTRACTS.MODIFY,
    delete: FINANCE_PERMISSIONS.CONTRACTS.REMOVE,
    export: FINANCE_PERMISSIONS.CONTRACTS.EXPORT,
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
        label: 'Novo Contrato',
        icon: Plus,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.CONTRACTS.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.CONTRACTS.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.CONTRACTS.MODIFY,
      },
      {
        id: 'generate-entries',
        label: 'Gerar Lançamentos',
        icon: DollarSign,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.CONTRACTS.MODIFY,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.CONTRACTS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Contrato',
        confirmMessage: 'Tem certeza que deseja excluir este contrato?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: FINANCE_PERMISSIONS.CONTRACTS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Contratos',
        confirmMessage:
          'Tem certeza que deseja excluir os contratos selecionados?',
      },
    ],
  },
});

export default contractConfig;
