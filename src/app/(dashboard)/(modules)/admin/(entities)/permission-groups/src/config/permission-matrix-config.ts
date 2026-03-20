import {
  Building2,
  DollarSign,
  LucideIcon,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Wrench,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Standard Actions (7 humanized capabilities)
// ---------------------------------------------------------------------------

export const STANDARD_ACTIONS = [
  'access',
  'register',
  'modify',
  'remove',
  'import',
  'export',
  'admin',
  'onlyself',
] as const;

export type StandardAction = (typeof STANDARD_ACTIONS)[number];

export const ACTION_LABELS: Record<StandardAction, string> = {
  access: 'Acessar',
  register: 'Cadastrar',
  modify: 'Alterar',
  remove: 'Remover',
  import: 'Importar',
  export: 'Exportar',
  admin: 'Administrar',
  onlyself: 'Apenas Próprio',
};

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface MatrixResource {
  label: string;
  /** Visual group header this resource belongs to within the tab */
  group: string;
  backendResources: string[];
  availableActions: StandardAction[];
}

export interface MatrixTab {
  id: string;
  label: string;
  icon: LucideIcon;
  resources: MatrixResource[];
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export const MATRIX_TABS: MatrixTab[] = [
  // ── Tab 1: Estoque ──────────────────────────────────────────────────
  {
    id: 'stock',
    label: 'Estoque',
    icon: Package,
    resources: [
      // Cadastros
      {
        label: 'Produtos',
        group: 'Cadastros',
        backendResources: [
          'stock.products',
          'stock.product-attachments',
          'stock.product-care-instructions',
          'stock.care',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'import', 'export', 'admin', 'onlyself'],
      },
      {
        label: 'Variantes',
        group: 'Cadastros',
        backendResources: ['stock.variants', 'stock.variant-attachments'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import', 'export', 'admin', 'onlyself'],
      },
      {
        label: 'Templates',
        group: 'Cadastros',
        backendResources: ['stock.templates'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Categorias',
        group: 'Cadastros',
        backendResources: ['stock.categories'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import', 'export'],
      },
      {
        label: 'Fabricantes',
        group: 'Cadastros',
        backendResources: ['stock.manufacturers'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import', 'export'],
      },
      // Operações
      {
        label: 'Itens',
        group: 'Operações',
        backendResources: ['stock.items', 'stock.movements'],
        availableActions: ['access', 'export', 'admin'],
      },
      {
        label: 'Ordens de Compra',
        group: 'Operações',
        backendResources: ['stock.purchase-orders'],
        availableActions: ['access', 'register', 'modify', 'remove', 'export', 'admin', 'onlyself'],
      },
      {
        label: 'Volumes',
        group: 'Operações',
        backendResources: ['stock.volumes'],
        availableActions: ['access', 'register', 'modify', 'remove', 'export', 'admin', 'onlyself'],
      },
      // Infraestrutura
      {
        label: 'Armazéns',
        group: 'Infraestrutura',
        backendResources: [
          'stock.warehouses',
          'stock.zones',
          'stock.bins',
          'stock.locations',
          'stock.warehouse-labels',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
    ],
  },

  // ── Tab 2: Financeiro ───────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Financeiro',
    icon: DollarSign,
    resources: [
      // Cadastros
      {
        label: 'Categorias',
        group: 'Cadastros',
        backendResources: ['finance.categories'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Centros de Custo',
        group: 'Cadastros',
        backendResources: ['finance.cost-centers'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Contas Bancárias',
        group: 'Cadastros',
        backendResources: ['finance.bank-accounts'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Fornecedores',
        group: 'Cadastros',
        backendResources: ['stock.suppliers'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import', 'export'],
      },
      {
        label: 'Contratos',
        group: 'Cadastros',
        backendResources: ['finance.contracts'],
        availableActions: ['access', 'register', 'modify', 'remove', 'export'],
      },
      // Operações
      {
        label: 'Lançamentos',
        group: 'Operações',
        backendResources: ['finance.entries', 'finance.attachments'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import', 'export', 'admin', 'onlyself'],
      },
      {
        label: 'Consórcios',
        group: 'Operações',
        backendResources: ['finance.consortia'],
        availableActions: ['access', 'register', 'modify', 'remove', 'export', 'admin', 'onlyself'],
      },
      {
        label: 'Empréstimos',
        group: 'Operações',
        backendResources: ['finance.loans'],
        availableActions: ['access', 'register', 'modify', 'remove', 'export', 'admin', 'onlyself'],
      },
      {
        label: 'Recorrências',
        group: 'Operações',
        backendResources: ['finance.recurring'],
        availableActions: ['access', 'register', 'modify', 'admin', 'onlyself'],
      },
    ],
  },

  // ── Tab 3: Recursos Humanos ─────────────────────────────────────────
  {
    id: 'hr',
    label: 'Recursos Humanos',
    icon: Users,
    resources: [
      // Cadastros
      {
        label: 'Cargos',
        group: 'Cadastros',
        backendResources: ['hr.positions'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Departamentos',
        group: 'Cadastros',
        backendResources: ['hr.departments'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Escalas de Trabalho',
        group: 'Cadastros',
        backendResources: ['hr.work-schedules'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      // Operações
      {
        label: 'Colaboradores',
        group: 'Operações',
        backendResources: ['hr.employees'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import', 'export', 'admin', 'onlyself'],
      },
      {
        label: 'Férias',
        group: 'Operações',
        backendResources: ['hr.vacations', 'hr.vacation-periods'],
        availableActions: ['access', 'register', 'modify', 'admin', 'onlyself'],
      },
      {
        label: 'Ausências',
        group: 'Operações',
        backendResources: ['hr.absences'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin', 'onlyself'],
      },
      {
        label: 'Folha de Pagamento',
        group: 'Operações',
        backendResources: [
          'hr.payrolls',
          'hr.bonuses',
          'hr.deductions',
          'hr.fiscal-settings',
          'hr.stakeholders',
        ],
        availableActions: ['access', 'register', 'export', 'admin'],
      },
      {
        label: 'Ponto',
        group: 'Operações',
        backendResources: [
          'hr.time-entries',
          'hr.time-control',
          'hr.time-bank',
          'hr.overtime',
        ],
        availableActions: ['access', 'register', 'export'],
      },
    ],
  },

  // ── Tab 4: Vendas ───────────────────────────────────────────────────
  {
    id: 'sales',
    label: 'Vendas',
    icon: ShoppingCart,
    resources: [
      // Cadastros
      {
        label: 'Clientes',
        group: 'Cadastros',
        backendResources: ['sales.customers'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import', 'export', 'onlyself'],
      },
      {
        label: 'Promoções',
        group: 'Cadastros',
        backendResources: ['sales.promotions'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      // Operações
      {
        label: 'Pedidos',
        group: 'Operações',
        backendResources: [
          'sales.orders',
          'sales.reservations',
          'sales.comments',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'export', 'admin', 'onlyself'],
      },
    ],
  },

  // ── Tab 5: Administração ────────────────────────────────────────────
  {
    id: 'admin',
    label: 'Administração',
    icon: Building2,
    resources: [
      // Gestão
      {
        label: 'Usuários',
        group: 'Gestão',
        backendResources: [
          'core.users',
          'core.teams',
          'core.teams.members',
          'core.teams.emails',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Grupos de Permissão',
        group: 'Gestão',
        backendResources: [
          'rbac.groups',
          'rbac.permissions',
          'rbac.associations',
          'rbac.user-groups',
          'rbac.user-permissions',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Empresas',
        group: 'Gestão',
        backendResources: [
          'admin.companies',
          'admin.company-addresses',
          'admin.company-cnaes',
          'admin.company-fiscal-settings',
          'admin.company-stakeholder',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      // Sistema
      {
        label: 'Sessões',
        group: 'Sistema',
        backendResources: ['core.sessions'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Auditoria',
        group: 'Sistema',
        backendResources: [
          'audit.logs',
          'audit.history',
          'audit.compare',
          'audit.rollback',
        ],
        availableActions: ['access', 'admin'],
      },
    ],
  },

  // ── Tab 6: Ferramentas ──────────────────────────────────────────────
  {
    id: 'tools',
    label: 'Ferramentas',
    icon: Wrench,
    resources: [
      // Comunicação
      {
        label: 'Email: Contas',
        group: 'Comunicação',
        backendResources: ['email.accounts', 'email.sync'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Email: Mensagens',
        group: 'Comunicação',
        backendResources: ['email.messages'],
        availableActions: ['access', 'register', 'modify', 'remove', 'onlyself'],
      },
      // Produtividade
      {
        label: 'Tarefas: Quadros',
        group: 'Produtividade',
        backendResources: ['tasks.boards'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Tarefas: Cartões',
        group: 'Produtividade',
        backendResources: [
          'tasks.cards',
          'tasks.comments',
          'tasks.labels',
          'tasks.custom-fields',
          'tasks.attachments',
          'tasks.watchers',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin', 'onlyself'],
      },
      {
        label: 'Agenda',
        group: 'Produtividade',
        backendResources: [
          'calendar.events',
          'calendar.participants',
          'calendar.reminders',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'export', 'admin', 'onlyself'],
      },
      // Arquivos
      {
        label: 'Pastas',
        group: 'Arquivos',
        backendResources: [
          'storage.user-folders',
          'storage.filter-folders',
          'storage.system-folders',
          'storage.interface',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Arquivos',
        group: 'Arquivos',
        backendResources: [
          'storage.files',
          'storage.versions',
          'storage.stats',
          'storage.security',
        ],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
    ],
  },

  // ── Tab 7: Sistema ──────────────────────────────────────────────────
  {
    id: 'system',
    label: 'Sistema',
    icon: Settings,
    resources: [
      {
        label: 'Modelos de Etiqueta',
        group: 'Geral',
        backendResources: ['core.label-templates'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Notificações',
        group: 'Geral',
        backendResources: ['notifications._root'],
        availableActions: ['admin'],
      },
      {
        label: 'Permissões Pessoais',
        group: 'Geral',
        backendResources: [
          'self.profile',
          'self.sessions',
          'self.permissions',
          'self.groups',
          'self.audit',
          'self.employee',
          'self.time-entries',
          'self.schedule',
          'self.time-bank',
          'self.vacations',
          'self.absences',
          'self.payslips',
          'self.overtime',
          'self.requests',
        ],
        availableActions: ['access', 'modify', 'admin'],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Builds a lookup map from backend resource key (e.g. `"stock.products"`)
 * to the tab and resource index where it appears.
 */
export function buildBackendResourceToTabMap(): Map<
  string,
  { tabId: string; resourceIndex: number }
> {
  const map = new Map<string, { tabId: string; resourceIndex: number }>();

  for (const tab of MATRIX_TABS) {
    for (let i = 0; i < tab.resources.length; i++) {
      for (const backendRes of tab.resources[i].backendResources) {
        map.set(backendRes, { tabId: tab.id, resourceIndex: i });
      }
    }
  }

  return map;
}

/**
 * Maps a backend action string to one of the 7 humanized actions.
 *
 * Backend actions `list` and `read` both map to `access`.
 * `create` → `register`, `update` → `modify`, `delete` → `remove`,
 * `manage` → `admin`. `import` and `export` stay as-is.
 * Any unknown action maps to `admin`.
 */
const BACKEND_ACTION_MAP: Record<string, StandardAction> = {
  list: 'access',
  read: 'access',
  create: 'register',
  update: 'modify',
  delete: 'remove',
  import: 'import',
  export: 'export',
  manage: 'admin',
};

export function mapActionToStandard(action: string): StandardAction {
  return BACKEND_ACTION_MAP[action] ?? 'admin';
}

/**
 * Maps `data.import.*` and `data.export.*` permission codes to the correct
 * visual resource. The backend stores import/export as `data.import.{entity}`
 * (e.g., `data.import.products`), but visually they belong to each entity's
 * import/export column.
 *
 * Returns: `{ targetBackendResource: string, action: StandardAction }` or null.
 */
const DATA_ENTITY_TO_RESOURCE: Record<string, string> = {
  products: 'stock.products',
  variants: 'stock.variants',
  categories: 'stock.categories',
  customers: 'sales.customers',
  suppliers: 'stock.suppliers',
  employees: 'hr.employees',
  movements: 'stock.movements',
  orders: 'sales.orders',
  bulk: 'stock.products', // bulk import → products
  reports: 'finance.entries', // report export → entries
  audit: 'audit.logs',
};

export function resolveDataPermission(
  code: string
): { targetBackendResource: string; action: StandardAction } | null {
  // Match data.import.* or data.export.*
  const match = code.match(/^data\.(import|export)\.(.+)$/);
  if (!match) return null;

  const direction = match[1] as 'import' | 'export';
  const entity = match[2];
  const target = DATA_ENTITY_TO_RESOURCE[entity];
  if (!target) return null;

  return { targetBackendResource: target, action: direction };
}

/**
 * Extracts unique ordered group names from a tab's resources.
 */
export function getResourceGroups(tab: MatrixTab): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const r of tab.resources) {
    if (!seen.has(r.group)) {
      seen.add(r.group);
      groups.push(r.group);
    }
  }
  return groups;
}
