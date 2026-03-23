/**
 * OpenSea OS - Customers Entity Config
 * Configuracao completa da entidade de clientes
 */

import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Customer } from '@/types/sales';
import { Edit, Eye, Plus, Trash2, Users } from 'lucide-react';

export const customersConfig = defineEntityConfig<Customer>()({
  // ======================== IDENTIFICACAO ========================
  name: 'Cliente',
  namePlural: 'Clientes',
  slug: 'customers',
  description: 'Gerenciamento de clientes',
  icon: Users,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/customers',
    queryKey: 'customers',
    queryKeys: {
      list: ['customers'],
      detail: (id: string) => ['customers', id],
    },
    endpoints: {
      list: '/v1/customers',
      get: '/v1/customers/:id',
      create: '/v1/customers',
      update: '/v1/customers/:id',
      delete: '/v1/customers/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/sales/customers',
    detail: '/sales/customers/:id',
    create: '/sales/customers/new',
    edit: '/sales/customers/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: Users,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    titleField: 'name',
    subtitleField: 'email',
    imageField: undefined,
    labels: {
      singular: 'Cliente',
      plural: 'Clientes',
      createButton: 'Novo Cliente',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum cliente encontrado',
      searchPlaceholder: 'Buscar clientes por nome, documento ou e-mail...',
    },
    badgeFields: [
      {
        field: 'type',
        label: 'Tipo',
        colorMap: {
          INDIVIDUAL: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
          BUSINESS: 'bg-violet-500/20 text-violet-700 dark:text-violet-400',
        },
        render: (value: unknown) => {
          const labels = {
            INDIVIDUAL: 'Pessoa Fisica',
            BUSINESS: 'Pessoa Juridica',
          };
          return labels[value as keyof typeof labels] || String(value);
        },
      },
    ],
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
    searchableFields: ['name', 'document', 'email'],
    defaultSort: {
      field: 'name',
      direction: 'asc',
    },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // ======================== FORMULARIO ========================
  form: {
    sections: [
      {
        id: 'basic',
        title: 'Informacoes Basicas',
        description: 'Dados de identificacao do cliente',
        fields: [
          {
            name: 'name',
            label: 'Nome',
            type: 'text',
            required: true,
            placeholder: 'Nome completo ou razao social',
            colSpan: 4,
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            colSpan: 2,
            options: [
              { value: 'INDIVIDUAL', label: 'Pessoa Fisica' },
              { value: 'BUSINESS', label: 'Pessoa Juridica' },
            ],
          },
          {
            name: 'document',
            label: 'Documento',
            type: 'text',
            placeholder: 'CPF ou CNPJ',
            colSpan: 2,
          },
        ],
        columns: 4,
      },
      {
        id: 'contact',
        title: 'Contato',
        description: 'Informacoes de contato',
        fields: [
          {
            name: 'email',
            label: 'E-mail',
            type: 'text',
            placeholder: 'cliente@email.com',
            colSpan: 2,
          },
          {
            name: 'phone',
            label: 'Telefone',
            type: 'text',
            placeholder: '(00) 00000-0000',
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
    view: SALES_PERMISSIONS.CUSTOMERS.ACCESS,
    create: SALES_PERMISSIONS.CUSTOMERS.REGISTER,
    update: SALES_PERMISSIONS.CUSTOMERS.MODIFY,
    delete: SALES_PERMISSIONS.CUSTOMERS.REMOVE,
    export: SALES_PERMISSIONS.CUSTOMERS.EXPORT,
    import: SALES_PERMISSIONS.CUSTOMERS.IMPORT,
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
        label: 'Novo Cliente',
        icon: Plus,
        variant: 'default',
        permission: SALES_PERMISSIONS.CUSTOMERS.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CUSTOMERS.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CUSTOMERS.MODIFY,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CUSTOMERS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Cliente',
        confirmMessage: 'Tem certeza que deseja excluir este cliente?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: SALES_PERMISSIONS.CUSTOMERS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Clientes',
        confirmMessage:
          'Tem certeza que deseja excluir os clientes selecionados?',
      },
    ],
  },
});

export default customersConfig;
