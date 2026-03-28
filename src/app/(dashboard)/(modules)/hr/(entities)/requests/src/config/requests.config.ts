/**
 * OpenSea OS - Employee Requests Config (HR)
 *
 * Configuracao do modulo de solicitacoes do colaborador.
 */

import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { EmployeeRequest } from '@/types/hr';
import { Check, ClipboardList, Eye, Plus, XCircle } from 'lucide-react';

export const requestsConfig = defineEntityConfig<EmployeeRequest>()({
  name: 'EmployeeRequest',
  namePlural: 'EmployeeRequests',
  slug: 'requests',
  description: 'Solicitações dos colaboradores',
  icon: ClipboardList,

  api: {
    baseUrl: '/api/v1/hr/requests',
    queryKey: 'employee-requests',
    queryKeys: {
      list: ['employee-requests'],
      detail: (id: string) => ['employee-requests', id],
    },
    endpoints: {
      list: '/v1/hr/my/requests',
      get: '/v1/hr/my/requests/:id',
      create: '/v1/hr/my/requests',
    },
  },

  routes: {
    list: '/hr/requests',
    detail: '/hr/requests/:id',
    create: '/hr/requests/new',
  },

  display: {
    icon: ClipboardList,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    titleField: 'type',
    subtitleField: 'status',
    labels: {
      singular: 'Solicitação',
      plural: 'Solicitações',
      createButton: 'Nova Solicitação',
      emptyState: 'Nenhuma solicitação encontrada',
      searchPlaceholder: 'Buscar solicitações...',
    },
    badgeFields: [
      { field: 'type', label: 'Tipo' },
      { field: 'status', label: 'Status' },
    ],
    metaFields: [
      { field: 'createdAt', label: 'Criada em', format: 'date' },
    ],
  },

  grid: {
    defaultView: 'grid',
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    showViewToggle: true,
    enableDragSelection: false,
    selectable: false,
    searchableFields: ['type', 'status'],
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50],
  },

  form: {
    sections: [],
    defaultColumns: 1,
    validateOnBlur: true,
    showRequiredIndicator: true,
  },

  permissions: {
    view: HR_PERMISSIONS.EMPLOYEE_REQUESTS.ACCESS,
    create: HR_PERMISSIONS.EMPLOYEE_REQUESTS.REGISTER,
    delete: HR_PERMISSIONS.EMPLOYEE_REQUESTS.ADMIN,
    export: HR_PERMISSIONS.EMPLOYEE_REQUESTS.ADMIN,
  },

  features: {
    create: true,
    edit: false,
    delete: false,
    duplicate: false,
    softDelete: false,
    export: false,
    import: false,
    search: true,
    filters: true,
    sort: true,
    pagination: true,
    selection: false,
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
        label: 'Nova Solicitação',
        icon: Plus,
        variant: 'default',
        permission: HR_PERMISSIONS.EMPLOYEE_REQUESTS.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: HR_PERMISSIONS.EMPLOYEE_REQUESTS.ACCESS,
      },
      {
        id: 'approve',
        label: 'Aprovar',
        icon: Check,
        onClick: () => {},
        permission: HR_PERMISSIONS.EMPLOYEE_REQUESTS.ADMIN,
      },
      {
        id: 'reject',
        label: 'Rejeitar',
        icon: XCircle,
        onClick: () => {},
        permission: HR_PERMISSIONS.EMPLOYEE_REQUESTS.ADMIN,
      },
    ],
    batch: [],
  },
});

export default requestsConfig;
