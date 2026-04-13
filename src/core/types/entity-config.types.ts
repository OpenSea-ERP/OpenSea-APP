/**
 * OpenSea OS - Entity Configuration Types
 * Tipos para configuração de entidades
 */

import { ComponentType, ReactNode } from 'react';
import {
  ActionConfig,
  BaseEntity,
  ContextMenuItem,
  SelectOption,
} from './base.types';
import { EntityFormConfig } from './form.types';
import { EntityViewerConfig } from './viewer.types';

// =============================================================================
// ENTITY CONFIG
// =============================================================================

/**
 * Configuração completa de uma entidade
 * Este é o tipo principal que define como uma entidade se comporta no sistema
 */
export interface EntityConfig<T extends BaseEntity = BaseEntity> {
  // ======================== IDENTIFICAÇÃO ========================
  /** Nome singular da entidade (ex: "product") */
  name?: string;
  /** Nome plural da entidade (ex: "products") - opcional */
  namePlural?: string;
  /** Slug para URLs (ex: "products") - opcional */
  slug?: string;
  /** Descrição da entidade */
  description?: string;
  /** Ícone da entidade */
  icon?: ComponentType<{ className?: string }>;

  // ======================== API ========================
  /** Configurações de API */
  api?: EntityApiConfig;

  // ======================== ROTAS ========================
  /** Configurações de rotas */
  routes?: EntityRoutes;

  // ======================== DISPLAY ========================
  /** Como exibir a entidade em cards, listas, etc */
  display: EntityDisplayConfig<T>;

  // ======================== GRID/LISTA ========================
  /** Configurações do grid de listagem */
  grid?: EntityGridConfig<T>;

  // ======================== FORMULÁRIO ========================
  /** Configuração do formulário */
  form?: EntityFormConfig<T>;

  // ======================== VISUALIZAÇÃO ========================
  /** Configuração do viewer/detail */
  viewer?: EntityViewerConfig<T>;

  // ======================== PERMISSÕES ========================
  /** Permissões RBAC */
  permissions?: EntityPermissions;

  // ======================== FEATURES ========================
  /** Features habilitadas */
  features?: EntityFeatures;

  // ======================== HOOKS ========================
  /** Hooks de ciclo de vida */
  hooks?: EntityHooks<T>;

  // ======================== RELAÇÕES ========================
  /** Configuração de entidades relacionadas */
  relations?: EntityRelation[];

  // ======================== AÇÕES ========================
  /** Ações disponíveis */
  actions?: EntityActions<T>;
}

// =============================================================================
// API CONFIG
// =============================================================================

export interface EntityApiConfig {
  /** URL base da API (ex: "/api/stock/products") */
  baseUrl: string;
  /** Chave para React Query (legacy) */
  queryKey?: string;
  /** Chaves para React Query */
  queryKeys?: {
    list?: string[];
    detail?: (id: string) => string[];
  };
  /** Endpoints customizados */
  endpoints?: {
    list?: string;
    get?: string;
    create?: string;
    update?: string;
    delete?: string;
    duplicate?: string;
    bulkDelete?: string;
    batchDelete?: string;
    bulkUpdate?: string;
    export?: string;
    import?: string;
  };
  /** Headers customizados */
  headers?: Record<string, string>;
  /** Transformações de dados */
  transforms?: {
    request?: (data: unknown) => unknown;
    response?: (data: unknown) => unknown;
  };
  /** Transformação de resposta */
  responseTransform?: {
    list?: (data: unknown) => unknown;
    detail?: (data: unknown) => unknown;
  };
}

// =============================================================================
// ROUTES CONFIG
// =============================================================================

export interface EntityRoutes {
  /** Rota de listagem (ex: "/stock/products") */
  list: string;
  /** Rota de detalhe (ex: "/stock/products/:id") */
  detail?: string;
  /** Rota de criação (ex: "/stock/products/new") */
  create?: string;
  /** Rota de edição (ex: "/stock/products/:id/edit") */
  edit?: string;
  /** Rota de visualização (ex: "/stock/products/:id") - alias para detail */
  view?: string;
}

// =============================================================================
// DISPLAY CONFIG
// =============================================================================

export interface EntityDisplayConfig<T extends BaseEntity = BaseEntity> {
  /** Ícone da entidade */
  icon?: ComponentType<{ className?: string }>;
  /** Cor da entidade */
  color?: string;
  /** Gradiente para ícone */
  gradient?: string;
  /** Campo usado como título (ex: "name") */
  titleField?: keyof T;
  /** Campo usado como subtítulo (ex: "code") */
  subtitleField?: keyof T;
  /** Campo usado como descrição */
  descriptionField?: keyof T;
  /** Campo de imagem */
  imageField?: keyof T;
  /** Labels de texto */
  labels: EntityLabels;
  /** Campos para badges/tags */
  badgeFields?: EntityBadgeConfig<T>[];
  /** Campos para metadados */
  metaFields?: EntityMetaField<T>[];
  /** Função customizada para renderizar título */
  renderTitle?: (item: T) => ReactNode;
  /** Função customizada para renderizar subtítulo */
  renderSubtitle?: (item: T) => ReactNode;
  /** Placeholder de imagem */
  imagePlaceholder?: ReactNode;
  /** Cores por status */
  statusColors?: Record<string, string>;
}

/** Labels de texto para a entidade */
export interface EntityLabels {
  /** Nome singular */
  singular: string;
  /** Nome plural */
  plural: string;
  /** Texto do botão de criar */
  createButton?: string;
  /** Texto do botão de editar */
  editButton?: string;
  /** Texto do botão de excluir */
  deleteButton?: string;
  /** Mensagem de estado vazio */
  emptyState?: string;
  /** Placeholder de busca */
  searchPlaceholder?: string;
}

export interface EntityBadgeConfig<T> {
  field: keyof T;
  label?: string;
  colorMap?: Record<string, string>;
  render?: (value: unknown, item: T) => ReactNode;
}

export interface EntityMetaField<T> {
  field: keyof T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  format?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'boolean';
  render?: (value: unknown, item: T) => ReactNode;
}

// =============================================================================
// GRID CONFIG
// =============================================================================

export interface EntityGridConfig<T extends BaseEntity = BaseEntity> {
  /** View mode padrão */
  defaultView?: 'grid' | 'list' | 'table';
  /** Número de colunas */
  columns?: {
    grid?: number;
    list?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Mostrar toggle de view */
  showViewToggle?: boolean;
  /** Habilitar drag selection */
  enableDragSelection?: boolean;
  /** Configuração de cards */
  cardConfig?: {
    showBadges?: boolean;
    showStatusBadges?: boolean;
    badgeFields?: (keyof T)[];
  };
  /** Colunas do grid (para tabelas) */
  tableColumns?: EntityGridColumn<T>[];
  /** Campos pesquisáveis */
  searchableFields?: (keyof T)[];
  /** Filtros disponíveis */
  filters?: EntityFilter<T>[];
  /** Ordenação padrão */
  defaultSort?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  };
  /** Itens por página padrão */
  pageSize?: number;
  /** Opções de itens por página */
  pageSizeOptions?: number[];
  /** Seleção habilitada */
  selectable?: boolean;
  /** Layouts disponíveis */
  availableLayouts?: ('grid' | 'list' | 'table')[];
  /** Virtualização para grandes listas */
  virtualized?: boolean;
  /** Altura do item para virtualização */
  itemHeight?: number;
}

export interface EntityGridColumn<T> {
  id: string;
  field: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, item: T) => ReactNode;
  hidden?: boolean;
}

export interface EntityFilter<T> {
  id: string;
  field: keyof T;
  label: string;
  type:
    | 'text'
    | 'select'
    | 'multi-select'
    | 'date'
    | 'date-range'
    | 'number-range'
    | 'boolean';
  options?: SelectOption[];
  getOptions?: () => Promise<SelectOption[]>;
  defaultValue?: unknown;
}

// =============================================================================
// PERMISSIONS CONFIG
// =============================================================================

export interface EntityPermissions {
  /** Permissão para visualizar */
  view?: string;
  /** Permissão para criar */
  create?: string;
  /** Permissão para editar */
  update?: string;
  /** Alias para update */
  edit?: string;
  /** Permissão para deletar */
  delete?: string;
  /** Permissão para exportar */
  export?: string;
  /** Permissão para importar */
  import?: string;
  /** Permissões customizadas */
  custom?: Record<string, string>;
}

// =============================================================================
// FEATURES CONFIG
// =============================================================================

export interface EntityFeatures {
  /** Permite criar novas entidades */
  create?: boolean;
  /** Permite editar entidades */
  edit?: boolean;
  /** Permite deletar entidades */
  delete?: boolean;
  /** Permite duplicar entidades */
  duplicate?: boolean;
  /** Permite soft delete */
  softDelete?: boolean;
  /** Permite exportar */
  export?: boolean;
  /** Permite importar */
  import?: boolean;
  /** Permite busca */
  search?: boolean;
  /** Permite filtros */
  filters?: boolean;
  /** Alias para filters */
  filter?: boolean;
  /** Permite ordenação */
  sort?: boolean;
  /** Permite paginação */
  pagination?: boolean;
  /** Permite seleção */
  selection?: boolean;
  /** Permite seleção múltipla */
  multiSelect?: boolean;
  /** Permite operações em lote */
  batchOperations?: boolean;
  /** Permite favoritar */
  favorite?: boolean;
  /** Alias para favorite */
  favorites?: boolean;
  /** Permite arquivar */
  archive?: boolean;
  /** Histórico de auditoria */
  auditLog?: boolean;
  /** Alias para auditLog */
  audit?: boolean;
  /** Versionamento */
  versioning?: boolean;
  /** Realtime updates */
  realtime?: boolean;
}

// =============================================================================
// HOOKS CONFIG
// =============================================================================

export interface EntityHooks<T extends BaseEntity = BaseEntity> {
  // === Lifecycle Hooks ===
  /** Antes de criar */
  beforeCreate?: (data: Partial<T>) => Partial<T> | Promise<Partial<T>>;
  /** Depois de criar */
  afterCreate?: (item: T) => void | Promise<void>;
  /** Antes de atualizar */
  beforeUpdate?: (
    id: string,
    data: Partial<T>
  ) => Partial<T> | Promise<Partial<T>>;
  /** Depois de atualizar */
  afterUpdate?: (item: T) => void | Promise<void>;
  /** Antes de deletar */
  beforeDelete?: (id: string) => boolean | Promise<boolean>;
  /** Depois de deletar */
  afterDelete?: (id: string) => void | Promise<void>;
  /** Validação customizada */
  validate?: (
    data: Partial<T>,
    mode: 'create' | 'edit'
  ) => string[] | Promise<string[]>;

  // === Hook Names (references) ===
  /** Nome do hook de listagem */
  useList?: string;
  /** Nome do hook de detalhe */
  useDetail?: string;
  /** Nome do hook de criação */
  useCreate?: string;
  /** Nome do hook de atualização */
  useUpdate?: string;
  /** Nome do hook de exclusão */
  useDelete?: string;
  /** Nome do hook de batch delete */
  useBatchDelete?: string;
}

// =============================================================================
// RELATIONS CONFIG
// =============================================================================

export interface EntityRelation {
  /** Nome da relação */
  name: string;
  /** Entidade relacionada */
  entity: string;
  /** Tipo de relação */
  type:
    | 'one-to-one'
    | 'one-to-many'
    | 'many-to-many'
    | 'hasMany'
    | 'hasOne'
    | 'belongsTo';
  /** Campo de referência */
  foreignKey: string;
  /** Campo de referência na entidade relacionada */
  targetKey?: string;
  /** Label para exibição */
  label?: string;
  /** Campo de exibição */
  displayField?: string;
  /** Se deve carregar automaticamente */
  eager?: boolean;
}

// =============================================================================
// ACTIONS CONFIG
// =============================================================================

export interface EntityActions<T extends BaseEntity = BaseEntity> {
  /** Ações no header da página */
  header?: ActionConfig[];
  /** Ações no header - alias */
  headerActions?: ActionConfig[];
  /** Ações por item (context menu) */
  item?: EntityItemAction<T>[];
  /** Ações por item - alias */
  itemActions?: EntityItemAction<T>[];
  /** Ações em lote */
  batch?: EntityBatchAction<T>[];
  /** Ações em lote - alias */
  batchActions?: EntityBatchAction<T>[];
}

export interface EntityItemAction<T> extends Omit<ContextMenuItem, 'onClick'> {
  onClick: (item: T) => void | Promise<void>;
  show?: (item: T) => boolean;
  confirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  permission?: string;
}

export interface EntityBatchAction<T> {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  onClick: (items: T[]) => void | Promise<void>;
  /** Número mínimo de itens selecionados */
  minSelection?: number;
  /** Número máximo de itens selecionados */
  maxSelection?: number;
  /** Permissão necessária */
  permission?: string;
  /** Requer confirmação */
  confirm?: boolean;
  /** Título de confirmação */
  confirmTitle?: string;
  /** Mensagem de confirmação */
  confirmMessage?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Helper para criar uma EntityConfig tipada
 * Uso: defineEntityConfig<MyEntity>()({ ...config })
 */
export function defineEntityConfig<T extends BaseEntity>() {
  return (config: EntityConfig<T>): EntityConfig<T> => {
    return {
      // Defaults
      features: {
        search: true,
        filters: true,
        sort: true,
        pagination: true,
        selection: true,
        batchOperations: true,
        ...config.features,
      },
      grid: {
        pageSize: 20,
        pageSizeOptions: [10, 20, 50, 100],
        selectable: true,
        defaultView: 'grid',
        availableLayouts: ['grid', 'list', 'table'],
        columns: { sm: 1, md: 2, lg: 3, xl: 4 },
        ...config.grid,
      },
      ...config,
    };
  };
}
