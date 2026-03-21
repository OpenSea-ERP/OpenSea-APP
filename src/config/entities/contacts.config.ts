/**
 * OpenSea OS - Contacts Entity Config
 * Configuracao completa da entidade de contatos do CRM
 */

import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Contact } from '@/types/sales';
import { Edit, Eye, Plus, Trash2, UserCircle } from 'lucide-react';

export const contactsConfig = defineEntityConfig<Contact>()({
  // ======================== IDENTIFICACAO ========================
  name: 'Contato',
  namePlural: 'Contatos',
  slug: 'contacts',
  description: 'Gerenciamento de contatos do CRM',
  icon: UserCircle,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/contacts',
    queryKey: 'contacts',
    queryKeys: {
      list: ['contacts'],
      detail: (id: string) => ['contacts', id],
    },
    endpoints: {
      list: '/v1/contacts',
      get: '/v1/contacts/:id',
      create: '/v1/contacts',
      update: '/v1/contacts/:id',
      delete: '/v1/contacts/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/sales/contacts',
    detail: '/sales/contacts/:id',
    create: '/sales/contacts/new',
    edit: '/sales/contacts/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: UserCircle,
    color: 'teal',
    gradient: 'from-teal-500 to-emerald-600',
    titleField: 'fullName',
    subtitleField: 'email',
    imageField: undefined,
    labels: {
      singular: 'Contato',
      plural: 'Contatos',
      createButton: 'Novo Contato',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum contato encontrado',
      searchPlaceholder: 'Buscar contatos por nome, e-mail ou telefone...',
    },
    badgeFields: [
      {
        field: 'lifecycleStage',
        label: 'Estagio',
        colorMap: {
          LEAD: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
          MQL: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
          SQL: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
          OPPORTUNITY: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
          CUSTOMER: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          EVANGELIST: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
          CHURNED: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
        },
        render: (value: unknown) => {
          const labels: Record<string, string> = {
            LEAD: 'Lead',
            MQL: 'MQL',
            SQL: 'SQL',
            OPPORTUNITY: 'Oportunidade',
            CUSTOMER: 'Cliente',
            EVANGELIST: 'Evangelista',
            CHURNED: 'Perdido',
          };
          return labels[value as string] || String(value);
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
    searchableFields: ['fullName', 'email', 'phone'],
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
        id: 'personal',
        title: 'Dados Pessoais',
        description: 'Informacoes basicas do contato',
        fields: [
          {
            name: 'firstName',
            label: 'Nome',
            type: 'text',
            required: true,
            placeholder: 'Nome',
            colSpan: 2,
          },
          {
            name: 'lastName',
            label: 'Sobrenome',
            type: 'text',
            placeholder: 'Sobrenome',
            colSpan: 2,
          },
          {
            name: 'email',
            label: 'E-mail',
            type: 'text',
            placeholder: 'contato@email.com',
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
    view: SALES_PERMISSIONS.CONTACTS.ACCESS,
    create: SALES_PERMISSIONS.CONTACTS.REGISTER,
    update: SALES_PERMISSIONS.CONTACTS.MODIFY,
    delete: SALES_PERMISSIONS.CONTACTS.REMOVE,
    export: SALES_PERMISSIONS.CONTACTS.ADMIN,
    import: SALES_PERMISSIONS.CONTACTS.ADMIN,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: false,
    softDelete: true,
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

  // ======================== ACOES ========================
  actions: {
    header: [
      {
        id: 'create',
        label: 'Novo Contato',
        icon: Plus,
        variant: 'default',
        permission: SALES_PERMISSIONS.CONTACTS.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CONTACTS.ACCESS,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CONTACTS.MODIFY,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: SALES_PERMISSIONS.CONTACTS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Contato',
        confirmMessage: 'Tem certeza que deseja excluir este contato?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: SALES_PERMISSIONS.CONTACTS.REMOVE,
        confirm: true,
        confirmTitle: 'Excluir Contatos',
        confirmMessage:
          'Tem certeza que deseja excluir os contatos selecionados?',
      },
    ],
  },
});

export default contactsConfig;
