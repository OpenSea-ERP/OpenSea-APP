import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Company } from '@/types/hr';
import { Building2, Copy, Edit, Eye, Plus, Trash2 } from 'lucide-react';

export const companiesConfig = defineEntityConfig<Company>()({
  name: 'Company',
  namePlural: 'Companies',
  slug: 'companies',
  description:
    'Gerenciamento de empresas, dados cadastrais e compliance fiscal',
  icon: Building2,

  api: {
    baseUrl: '/api/v1/finance/companies',
    queryKey: 'companies',
    queryKeys: {
      list: ['companies'],
      detail: (id: string) => ['companies', id],
    },
    endpoints: {
      list: '/v1/finance/companies',
      get: '/v1/finance/companies/:id',
      create: '/v1/finance/companies',
      update: '/v1/finance/companies/:id',
      delete: '/v1/finance/companies/:id',
    },
  },

  routes: {
    list: '/finance/companies',
    detail: '/finance/companies/:id',
    create: '/finance/companies/new',
    edit: '/finance/companies/:id/edit',
  },

  display: {
    icon: Building2,
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-600',
    titleField: 'legalName',
    subtitleField: 'tradeName',
    labels: {
      singular: 'Empresa',
      plural: 'Empresas',
      createButton: 'Nova Empresa',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhuma empresa encontrada',
      searchPlaceholder: 'Buscar por razão social, fantasia ou CNPJ...',
    },
    badgeFields: [{ field: 'status', label: 'Status' }],
    metaFields: [
      { field: 'createdAt', label: 'Criada em', format: 'date' },
      { field: 'updatedAt', label: 'Atualizada em', format: 'date' },
    ],
  },

  grid: {
    defaultView: 'grid',
    columns: { sm: 1, md: 2, lg: 3, xl: 4 },
    showViewToggle: true,
    enableDragSelection: true,
    selectable: true,
    searchableFields: ['legalName', 'tradeName', 'cnpj'],
    defaultSort: { field: 'legalName', direction: 'asc' },
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  form: {
    sections: [
      {
        id: 'identity',
        title: 'Identificação',
        description: 'Dados legais e cadastrais da empresa',
        columns: 2,
        fields: [
          {
            name: 'legalName',
            label: 'Razão Social',
            type: 'text',
            required: true,
            placeholder: 'Acme Indústria LTDA',
            colSpan: 2,
          },
          {
            name: 'tradeName',
            label: 'Nome Fantasia',
            type: 'text',
            placeholder: 'Acme Brasil',
            colSpan: 2,
          },
          {
            name: 'cnpj',
            label: 'CNPJ',
            type: 'text',
            required: true,
            placeholder: '00.000.000/0001-00',
            mask: 'cnpj',
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { label: 'Ativa', value: 'ACTIVE' },
              { label: 'Inativa', value: 'INACTIVE' },
              { label: 'Suspensa', value: 'SUSPENDED' },
            ],
            defaultValue: 'ACTIVE',
          },
          {
            name: 'activityStartDate',
            label: 'Início das atividades',
            type: 'date',
          },
        ],
      },
      {
        id: 'registrations',
        title: 'Inscrições e Regime',
        description: 'Dados fiscais e de enquadramento',
        columns: 2,
        fields: [
          {
            name: 'stateRegistration',
            label: 'Inscrição Estadual',
            type: 'text',
            placeholder: 'IE',
          },
          {
            name: 'municipalRegistration',
            label: 'Inscrição Municipal',
            type: 'text',
            placeholder: 'IM',
          },
          {
            name: 'legalNature',
            label: 'Natureza Jurídica',
            type: 'select',
            options: [
              { label: 'Sociedade Empresária Limitada', value: '206-2' },
              { label: 'Sociedade Simples Limitada', value: '223-2' },
              { label: 'Empresário Individual', value: '213-5' },
              { label: 'Microempresa (ME)', value: '230-5' },
              { label: 'Empresa de Pequeno Porte (EPP)', value: '231-3' },
              { label: 'Sociedade Anônima Fechada', value: '204-6' },
              { label: 'Sociedade Anônima Aberta', value: '205-4' },
              { label: 'Associação Privada', value: '399-9' },
              { label: 'Fundação Privada', value: '306-8' },
              { label: 'Outros', value: 'OUTROS' },
            ],
            placeholder: 'Selecione a natureza jurídica',
            colSpan: 2,
          },
          {
            name: 'taxRegime',
            label: 'Regime Tributário',
            type: 'select',
            options: [
              { label: 'Simples Nacional', value: 'SIMPLES' },
              { label: 'Lucro Presumido', value: 'LUCRO_PRESUMIDO' },
              { label: 'Lucro Real', value: 'LUCRO_REAL' },
              { label: 'Imune/Isenta', value: 'IMUNE_ISENTA' },
              { label: 'Outros', value: 'OUTROS' },
            ],
          },
          {
            name: 'taxRegimeDetail',
            label: 'Detalhe do Regime',
            type: 'text',
            placeholder: 'Observações sobre o regime',
            colSpan: 2,
          },
        ],
      },
      {
        id: 'contact',
        title: 'Contato e Marca',
        description: 'Dados de contato e identidade visual',
        columns: 2,
        fields: [
          {
            name: 'email',
            label: 'E-mail',
            type: 'email',
            placeholder: 'contato@empresa.com.br',
          },
          {
            name: 'phoneMain',
            label: 'Telefone Principal',
            type: 'text',
            placeholder: '(11) 98888-7777',
            mask: 'phone',
          },
          {
            name: 'phoneAlt',
            label: 'Telefone Alternativo',
            type: 'text',
            placeholder: '(11) 97777-6666',
            mask: 'phone',
          },
          {
            name: 'logoUrl',
            label: 'Logo (URL)',
            type: 'text',
            placeholder: 'https://example.com/logo.png',
          },
        ],
      },
    ],
    defaultColumns: 2,
    validateOnBlur: true,
    showRequiredIndicator: true,
  },

  permissions: {
    view: FINANCE_PERMISSIONS.COMPANIES.READ,
    create: FINANCE_PERMISSIONS.COMPANIES.READ,
    update: FINANCE_PERMISSIONS.COMPANIES.READ,
    delete: FINANCE_PERMISSIONS.COMPANIES.READ,
    export: FINANCE_PERMISSIONS.COMPANIES.READ,
    import: FINANCE_PERMISSIONS.COMPANIES.READ,
  },

  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: true,
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

  actions: {
    header: [
      {
        id: 'create',
        label: 'Nova Empresa',
        icon: Plus,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.COMPANIES.READ,
        onClick: () => {},
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.COMPANIES.READ,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.COMPANIES.READ,
      },
      {
        id: 'duplicate',
        label: 'Duplicar',
        icon: Copy,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.COMPANIES.READ,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: FINANCE_PERMISSIONS.COMPANIES.READ,
        confirm: true,
        confirmTitle: 'Excluir Empresa',
        confirmMessage: 'Tem certeza que deseja excluir esta empresa?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionadas',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: FINANCE_PERMISSIONS.COMPANIES.READ,
        confirm: true,
        confirmTitle: 'Excluir Empresas',
        confirmMessage:
          'Tem certeza que deseja excluir as empresas selecionadas?',
      },
    ],
  },
});

export default companiesConfig;
