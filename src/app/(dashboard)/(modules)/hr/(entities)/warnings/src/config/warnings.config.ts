/**
 * OpenSea OS - Warnings Config (HR)
 */

import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { EmployeeWarning } from '@/types/hr';
import { AlertTriangle, Eye, Plus, RotateCcw } from 'lucide-react';

export const warningsConfig = defineEntityConfig<EmployeeWarning>()({
  name: 'EmployeeWarning',
  namePlural: 'EmployeeWarnings',
  slug: 'warnings',
  description: 'Gerenciamento de advertências disciplinares',
  icon: AlertTriangle,

  api: {
    baseUrl: '/api/v1/hr/warnings',
    queryKey: 'warnings',
    queryKeys: {
      list: ['warnings'],
      detail: (id: string) => ['warnings', id],
    },
    endpoints: {
      list: '/v1/hr/warnings',
      get: '/v1/hr/warnings/:id',
      create: '/v1/hr/warnings',
      update: '/v1/hr/warnings/:id',
      delete: '/v1/hr/warnings/:id',
    },
  },

  routes: {
    list: '/hr/warnings',
    detail: '/hr/warnings/:id',
    create: '/hr/warnings/new',
    edit: '/hr/warnings/:id/edit',
  },

  display: {
    icon: AlertTriangle,
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    titleField: 'type',
    subtitleField: 'severity',
    labels: {
      singular: 'Advertência',
      plural: 'Advertências',
      createButton: 'Registrar Advertência',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhuma advertência encontrada',
      searchPlaceholder: 'Buscar advertências...',
    },
    badgeFields: [
      { field: 'type', label: 'Tipo' },
      { field: 'severity', label: 'Gravidade' },
      { field: 'status', label: 'Status' },
    ],
    metaFields: [
      { field: 'incidentDate', label: 'Data do Incidente', format: 'date' },
      { field: 'createdAt', label: 'Criada em', format: 'date' },
    ],
  },

  grid: {
    defaultView: 'grid',
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    showViewToggle: true,
    enableDragSelection: false,
    selectable: false,
    searchableFields: ['employeeId', 'type', 'severity', 'status'],
    defaultSort: { field: 'incidentDate', direction: 'desc' },
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
    view: HR_PERMISSIONS.WARNINGS.ACCESS,
    create: HR_PERMISSIONS.WARNINGS.REGISTER,
    update: HR_PERMISSIONS.WARNINGS.MODIFY,
    delete: HR_PERMISSIONS.WARNINGS.REMOVE,
    export: HR_PERMISSIONS.WARNINGS.ADMIN,
    import: HR_PERMISSIONS.WARNINGS.ADMIN,
  },

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
        label: 'Registrar Advertência',
        icon: Plus,
        variant: 'default',
        permission: HR_PERMISSIONS.WARNINGS.REGISTER,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: HR_PERMISSIONS.WARNINGS.ACCESS,
      },
      {
        id: 'revoke',
        label: 'Revogar',
        icon: RotateCcw,
        onClick: () => {},
        permission: HR_PERMISSIONS.WARNINGS.ADMIN,
      },
    ],
    batch: [],
  },
});

export default warningsConfig;
