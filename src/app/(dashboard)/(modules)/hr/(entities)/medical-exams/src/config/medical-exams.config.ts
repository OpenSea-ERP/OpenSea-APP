/**
 * OpenSea OS - Medical Exams Entity Config
 */

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { defineEntityConfig } from '@/core/types';
import type { MedicalExam } from '@/types/hr';
import { Eye, Plus, Stethoscope, Trash2 } from 'lucide-react';

export const medicalExamsConfig = defineEntityConfig<MedicalExam>()({
  name: 'MedicalExam',
  namePlural: 'MedicalExams',
  slug: 'medical-exams',
  description: 'Gerenciamento de exames médicos ocupacionais',
  icon: Stethoscope,

  api: {
    baseUrl: '/api/v1/hr/medical-exams',
    queryKey: 'medical-exams',
    queryKeys: {
      list: ['medical-exams'],
      detail: (id: string) => ['medical-exams', id],
    },
    endpoints: {
      list: '/v1/hr/medical-exams',
      get: '/v1/hr/medical-exams/:id',
      create: '/v1/hr/medical-exams',
      update: '/v1/hr/medical-exams/:id',
      delete: '/v1/hr/medical-exams/:id',
    },
  },

  routes: {
    list: '/hr/medical-exams',
    detail: '/hr/medical-exams/:id',
    create: '/hr/medical-exams/new',
    edit: '/hr/medical-exams/:id/edit',
  },

  display: {
    icon: Stethoscope,
    color: 'teal',
    gradient: 'from-teal-500 to-teal-600',
    titleField: 'doctorName',
    subtitleField: 'doctorCrm',
    imageField: undefined,
    labels: {
      singular: 'Exame Médico',
      plural: 'Exames Médicos',
      createButton: 'Novo Exame',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhum exame médico encontrado',
      searchPlaceholder: 'Buscar exames por médico ou CRM...',
    },
    badgeFields: [],
    metaFields: [
      {
        field: 'examDate',
        label: 'Data do Exame',
        format: 'date',
      },
      {
        field: 'createdAt',
        label: 'Criado em',
        format: 'date',
      },
    ],
  },

  grid: {
    defaultView: 'grid',
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    showViewToggle: true,
    enableDragSelection: true,
    selectable: true,
    searchableFields: ['doctorName', 'doctorCrm'],
    defaultSort: { field: 'examDate', direction: 'desc' },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  form: {
    sections: [
      {
        id: 'basic',
        title: 'Informações do Exame',
        description: '',
        fields: [
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            placeholder: 'Selecionar tipo',
            colSpan: 1,
            description: '',
          },
          {
            name: 'result',
            label: 'Resultado',
            type: 'select',
            required: true,
            placeholder: 'Selecionar resultado',
            colSpan: 1,
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

  permissions: {
    view: HR_PERMISSIONS.MEDICAL_EXAMS.LIST,
    create: HR_PERMISSIONS.MEDICAL_EXAMS.CREATE,
    update: HR_PERMISSIONS.MEDICAL_EXAMS.UPDATE,
    delete: HR_PERMISSIONS.MEDICAL_EXAMS.DELETE,
    export: HR_PERMISSIONS.MEDICAL_EXAMS.MANAGE,
    import: HR_PERMISSIONS.MEDICAL_EXAMS.MANAGE,
  },

  features: {
    create: true,
    edit: false,
    delete: true,
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

  actions: {
    header: [
      {
        id: 'create',
        label: 'Novo Exame',
        icon: Plus,
        variant: 'default',
        permission: HR_PERMISSIONS.MEDICAL_EXAMS.CREATE,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: HR_PERMISSIONS.MEDICAL_EXAMS.LIST,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: HR_PERMISSIONS.MEDICAL_EXAMS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Exame Médico',
        confirmMessage: 'Tem certeza que deseja excluir este exame?',
      },
    ],
    batch: [],
  },
});

export default medicalExamsConfig;
