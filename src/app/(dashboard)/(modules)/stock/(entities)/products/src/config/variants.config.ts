/**
 * OpenSea OS - Variants Entity Config
 * Configuração completa da entidade de variantes
 */

import { STOCK_PERMISSIONS } from '@/config/rbac/permission-codes';
import { defineEntityConfig } from '@/core/types';
import type { Variant } from '@/types/stock';
import { Copy, Edit, Eye, Palette, Plus, Trash2 } from 'lucide-react';

export const variantsConfig = defineEntityConfig<Variant>()({
  // ======================== IDENTIFICAÇÃO ========================
  name: 'Variante',
  namePlural: 'Variantes',
  slug: 'variants',
  description: 'Gerenciamento de variantes de produtos',
  icon: Palette,

  // ======================== API ========================
  api: {
    baseUrl: '/api/v1/variants',
    queryKey: 'variants',
    queryKeys: {
      list: ['variants'],
      detail: (id: string) => ['variants', id],
    },
    endpoints: {
      list: '/v1/variants',
      get: '/v1/variants/:id',
      create: '/v1/variants',
      update: '/v1/variants/:id',
      delete: '/v1/variants/:id',
    },
  },

  // ======================== ROTAS ========================
  routes: {
    list: '/stock/variants',
    detail: '/stock/variants/:id',
    create: '/stock/variants/new',
    edit: '/stock/variants/:id/edit',
  },

  // ======================== DISPLAY ========================
  display: {
    icon: Palette,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    titleField: 'name',
    subtitleField: 'sku',
    imageField: undefined,
    labels: {
      singular: 'Variante',
      plural: 'Variantes',
      createButton: 'Nova Variante',
      editButton: 'Editar',
      deleteButton: 'Excluir',
      emptyState: 'Nenhuma variante encontrada',
      searchPlaceholder: 'Buscar variantes...',
    },
    badgeFields: [
      {
        field: 'price',
        label: 'Preço',
        colorMap: {},
        render: (value: unknown) =>
          `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    ],
    metaFields: [
      {
        field: 'createdAt',
        label: 'Criado em',
        format: 'date',
      },
      {
        field: 'barcode',
        label: 'Código de Barras',
        format: 'text',
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
    searchableFields: ['name', 'sku', 'barcode'],
    defaultSort: {
      field: 'name',
      direction: 'asc',
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
        description: 'Dados principais da variante',
        fields: [
          {
            name: 'productId',
            label: 'Produto',
            type: 'text',
            required: true,
            placeholder: 'ID do produto',
            colSpan: 4,
            description: 'Produto ao qual esta variante pertence',
          },
          {
            name: 'name',
            label: 'Nome',
            type: 'text',
            required: true,
            placeholder: 'Ex: Azul Royal',
            colSpan: 2,
            description: 'Nome da variante',
          },
          {
            name: 'sku',
            label: 'SKU',
            type: 'text',
            required: false,
            placeholder: 'Deixe vazio para gerar automaticamente',
            colSpan: 2,
            description: 'Código único (gerado automaticamente se vazio)',
          },
          {
            name: 'imageUrl',
            label: 'URL da Imagem',
            type: 'text',
            placeholder: 'https://...',
            colSpan: 4,
          },
        ],
        columns: 4,
      },
      {
        id: 'pricing',
        title: 'Preços',
        description: 'Informações de preço e custo',
        fields: [
          {
            name: 'price',
            label: 'Preço de Venda',
            type: 'number',
            required: true,
            placeholder: '0.00',
            colSpan: 2,
            min: 0,
            step: 0.01,
          },
          {
            name: 'costPrice',
            label: 'Preço de Custo',
            type: 'number',
            placeholder: '0.00',
            colSpan: 2,
            min: 0,
            step: 0.01,
          },
          {
            name: 'profitMargin',
            label: 'Margem de Lucro (%)',
            type: 'number',
            placeholder: '0',
            colSpan: 2,
            min: 0,
            max: 100,
          },
        ],
        columns: 4,
      },
      {
        id: 'codes',
        title: 'Códigos',
        description: 'Códigos de identificação',
        fields: [
          {
            name: 'barcode',
            label: 'Código de Barras',
            type: 'text',
            placeholder: '7891234567890',
            colSpan: 2,
          },
          {
            name: 'qrCode',
            label: 'QR Code',
            type: 'text',
            placeholder: 'QR-12345',
            colSpan: 2,
          },
          {
            name: 'eanCode',
            label: 'Código EAN',
            type: 'text',
            placeholder: '1234567890123',
            colSpan: 2,
          },
          {
            name: 'upcCode',
            label: 'Código UPC',
            type: 'text',
            placeholder: '123456789012',
            colSpan: 2,
          },
        ],
        columns: 4,
      },
      {
        id: 'stock',
        title: 'Controle de Estoque',
        description: 'Níveis de estoque',
        fields: [
          {
            name: 'minStock',
            label: 'Estoque Mínimo',
            type: 'number',
            placeholder: '0',
            colSpan: 2,
            min: 0,
          },
          {
            name: 'maxStock',
            label: 'Estoque Máximo',
            type: 'number',
            placeholder: '0',
            colSpan: 2,
            min: 0,
          },
          {
            name: 'reorderPoint',
            label: 'Ponto de Reposição',
            type: 'number',
            placeholder: '0',
            colSpan: 2,
            min: 0,
            description: 'Quantidade que dispara pedido de compra',
          },
          {
            name: 'reorderQuantity',
            label: 'Quantidade de Reposição',
            type: 'number',
            placeholder: '0',
            colSpan: 2,
            min: 0,
            description: 'Quantidade a ser pedida',
          },
        ],
        columns: 4,
      },
      {
        id: 'attributes',
        title: 'Atributos Exclusivos',
        description: 'Atributos específicos desta variante',
        fields: [
          {
            name: 'attributes',
            label: 'Atributos',
            type: 'json',
            colSpan: 4,
            description: 'Atributos customizados conforme o template',
            placeholder: '{}',
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
    view: STOCK_PERMISSIONS.VARIANTS.READ,
    create: STOCK_PERMISSIONS.VARIANTS.CREATE,
    update: STOCK_PERMISSIONS.VARIANTS.UPDATE,
    delete: STOCK_PERMISSIONS.VARIANTS.DELETE,
    export: STOCK_PERMISSIONS.VARIANTS.MANAGE,
    import: STOCK_PERMISSIONS.VARIANTS.MANAGE,
  },

  // ======================== FEATURES ========================
  features: {
    create: true,
    edit: true,
    delete: true,
    duplicate: true,
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

  // ======================== AÇÕES ========================
  actions: {
    header: [
      {
        id: 'create',
        label: 'Nova Variante',
        icon: Plus,
        variant: 'default',
        permission: STOCK_PERMISSIONS.VARIANTS.CREATE,
        onClick: () => {}, // Handled by page component
      },
    ],
    item: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.VARIANTS.READ,
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.VARIANTS.UPDATE,
      },
      {
        id: 'duplicate',
        label: 'Duplicar',
        icon: Copy,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.VARIANTS.CREATE,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: () => {},
        permission: STOCK_PERMISSIONS.VARIANTS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Variante',
        confirmMessage: 'Tem certeza que deseja excluir esta variante?',
      },
    ],
    batch: [
      {
        id: 'delete',
        label: 'Excluir Selecionados',
        icon: Trash2,
        onClick: () => {},
        variant: 'destructive',
        permission: STOCK_PERMISSIONS.VARIANTS.DELETE,
        confirm: true,
        confirmTitle: 'Excluir Variantes',
        confirmMessage:
          'Tem certeza que deseja excluir as variantes selecionadas?',
      },
    ],
  },
});

export default variantsConfig;
