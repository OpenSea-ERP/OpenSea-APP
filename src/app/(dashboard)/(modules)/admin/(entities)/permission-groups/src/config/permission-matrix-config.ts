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
// Standard Actions
// ---------------------------------------------------------------------------

export const STANDARD_ACTIONS = [
  'create',
  'update',
  'delete',
  'export',
  'manage',
  'import',
  'list',
  'read',
] as const;

export type StandardAction = (typeof STANDARD_ACTIONS)[number];

export const ACTION_LABELS: Record<StandardAction, string> = {
  create: 'Criar',
  update: 'Editar',
  delete: 'Excluir',
  export: 'Exportar',
  manage: 'Gerenciar',
  import: 'Importar',
  list: 'Listar',
  read: 'Ver',
};

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface MatrixResource {
  label: string;
  subtitle?: string;
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
      {
        label: 'Armazéns',
        subtitle: 'zonas, bins, endereços, etiquetas',
        backendResources: [
          'stock.warehouses',
          'stock.zones',
          'stock.bins',
          'stock.locations',
          'stock.warehouse-labels',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Categorias',
        backendResources: ['stock.categories'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'import',
          'list',
          'read',
        ],
      },
      {
        label: 'Fabricantes',
        backendResources: ['stock.manufacturers'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'import',
          'list',
          'read',
        ],
      },
      {
        label: 'Itens',
        subtitle: 'movimentações, localização',
        backendResources: ['stock.items', 'stock.movements'],
        availableActions: ['export', 'manage', 'list', 'read'],
      },
      {
        label: 'Ordens de Compra',
        subtitle: 'aprovar, cancelar',
        backendResources: ['stock.purchase-orders'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Produtos',
        subtitle: 'attachments, instruções de cuidado',
        backendResources: [
          'stock.products',
          'stock.product-attachments',
          'stock.product-care-instructions',
          'stock.care',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'import',
          'list',
          'read',
        ],
      },
      {
        label: 'Templates',
        backendResources: ['stock.templates'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Variantes',
        subtitle: 'attachments',
        backendResources: ['stock.variants', 'stock.variant-attachments'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'import',
          'list',
          'read',
        ],
      },
      {
        label: 'Volumes',
        subtitle: 'fechar, entregar, romaneio',
        backendResources: ['stock.volumes'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
    ],
  },

  // ── Tab 2: Financeiro ───────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Financeiro',
    icon: DollarSign,
    resources: [
      {
        label: 'Categorias',
        backendResources: ['finance.categories'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Centros de Custo',
        backendResources: ['finance.cost-centers'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Consórcios',
        subtitle: 'pagar, contemplar',
        backendResources: ['finance.consortia'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Contas Bancárias',
        backendResources: ['finance.bank-accounts'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Contratos',
        backendResources: ['finance.contracts'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'list',
          'read',
        ],
      },
      {
        label: 'Empréstimos',
        subtitle: 'pagar parcela',
        backendResources: ['finance.loans'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Fornecedores',
        backendResources: ['stock.suppliers'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'import',
          'list',
          'read',
        ],
      },
      {
        label: 'Lançamentos',
        subtitle: 'pagar, cancelar, attachments',
        backendResources: ['finance.entries', 'finance.attachments'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'import',
          'list',
          'read',
        ],
      },
      {
        label: 'Recorrências',
        subtitle: 'pausar, retomar, cancelar',
        backendResources: ['finance.recurring'],
        availableActions: ['create', 'update', 'manage', 'list', 'read'],
      },
    ],
  },

  // ── Tab 3: Recursos Humanos ─────────────────────────────────────────
  {
    id: 'hr',
    label: 'Recursos Humanos',
    icon: Users,
    resources: [
      {
        label: 'Ausências',
        subtitle: 'aprovar, cancelar',
        backendResources: ['hr.absences'],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Cargos',
        backendResources: ['hr.positions'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Colaboradores',
        subtitle: 'suspender, reativar, licença',
        backendResources: ['hr.employees'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'import',
          'list',
          'read',
        ],
      },
      {
        label: 'Departamentos',
        backendResources: ['hr.departments'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Escalas de Trabalho',
        backendResources: ['hr.work-schedules'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Férias',
        subtitle: 'aprovar',
        backendResources: ['hr.vacations', 'hr.vacation-periods'],
        availableActions: ['create', 'update', 'manage', 'list', 'read'],
      },
      {
        label: 'Folha de Pagamento',
        subtitle: 'bônus, descontos, processar',
        backendResources: [
          'hr.payrolls',
          'hr.bonuses',
          'hr.deductions',
          'hr.fiscal-settings',
          'hr.stakeholders',
        ],
        availableActions: ['create', 'export', 'manage', 'list', 'read'],
      },
      {
        label: 'Ponto',
        subtitle: 'controle de ponto, banco de horas',
        backendResources: [
          'hr.time-entries',
          'hr.time-control',
          'hr.time-bank',
          'hr.overtime',
        ],
        availableActions: ['create', 'export', 'list', 'read'],
      },
    ],
  },

  // ── Tab 4: Vendas ───────────────────────────────────────────────────
  {
    id: 'sales',
    label: 'Vendas',
    icon: ShoppingCart,
    resources: [
      {
        label: 'Clientes',
        backendResources: ['sales.customers'],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'import',
          'list',
          'read',
        ],
      },
      {
        label: 'Pedidos',
        subtitle: 'alterar status, cancelar',
        backendResources: [
          'sales.orders',
          'sales.reservations',
          'sales.comments',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Promoções',
        backendResources: ['sales.promotions'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
    ],
  },

  // ── Tab 5: Administração ────────────────────────────────────────────
  {
    id: 'admin',
    label: 'Administração',
    icon: Building2,
    resources: [
      {
        label: 'Auditoria: Logs',
        subtitle: 'comparar, histórico, rollback',
        backendResources: [
          'audit.logs',
          'audit.history',
          'audit.compare',
          'audit.rollback',
        ],
        availableActions: ['manage', 'list', 'read'],
      },
      {
        label: 'Empresas',
        subtitle: 'endereços, CNAEs, fiscal, sócios',
        backendResources: [
          'admin.companies',
          'admin.company-addresses',
          'admin.company-cnaes',
          'admin.company-fiscal-settings',
          'admin.company-stakeholder',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Grupos de Permissão',
        subtitle: 'atribuir permissões',
        backendResources: [
          'rbac.groups',
          'rbac.permissions',
          'rbac.associations',
          'rbac.user-groups',
          'rbac.user-permissions',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Sessões',
        subtitle: 'revogar sessões',
        backendResources: ['core.sessions'],
        availableActions: ['manage', 'list', 'read'],
      },
      {
        label: 'Usuários',
        subtitle: 'atribuir grupos, permissões diretas',
        backendResources: [
          'core.users',
          'core.teams',
          'core.teams.members',
          'core.teams.emails',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
    ],
  },

  // ── Tab 6: Ferramentas ──────────────────────────────────────────────
  {
    id: 'tools',
    label: 'Ferramentas',
    icon: Wrench,
    resources: [
      {
        label: 'Agenda',
        subtitle: 'compartilhar, participantes, lembretes',
        backendResources: [
          'calendar.events',
          'calendar.participants',
          'calendar.reminders',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'export',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Armazenamento: Arquivos',
        subtitle: 'versões, compartilhar, download',
        backendResources: [
          'storage.files',
          'storage.versions',
          'storage.stats',
          'storage.security',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Armazenamento: Pastas',
        subtitle: 'compartilhar com usuário/grupo',
        backendResources: [
          'storage.user-folders',
          'storage.filter-folders',
          'storage.system-folders',
          'storage.interface',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Email: Contas',
        subtitle: 'compartilhar, sincronizar',
        backendResources: ['email.accounts', 'email.sync'],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Email: Mensagens',
        backendResources: ['email.messages'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Tarefas: Cartões',
        subtitle: 'mover, atribuir, anexos, comentários',
        backendResources: [
          'tasks.cards',
          'tasks.comments',
          'tasks.labels',
          'tasks.custom-fields',
          'tasks.attachments',
          'tasks.watchers',
        ],
        availableActions: [
          'create',
          'update',
          'delete',
          'manage',
          'list',
          'read',
        ],
      },
      {
        label: 'Tarefas: Quadros',
        backendResources: ['tasks.boards'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
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
        backendResources: ['core.label-templates'],
        availableActions: ['create', 'update', 'delete', 'list', 'read'],
      },
      {
        label: 'Notificações',
        subtitle: 'enviar, agendar',
        backendResources: ['notifications._root'],
        availableActions: ['manage'],
      },
      {
        label: 'Permissões Pessoais',
        subtitle: 'perfil, sessões, férias, ausências, ponto',
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
        availableActions: ['update', 'manage', 'read'],
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

const STANDARD_ACTION_SET = new Set<string>(STANDARD_ACTIONS);

/**
 * Maps any backend action string to one of the 8 standard actions.
 *
 * If the action is already one of the 8 standard actions, it is returned as-is.
 * Otherwise it is bucketed under `'manage'`.
 *
 * **Note:** When computing a `ResourcePermissionMap`, if this function returns
 * `'manage'` for a non-standard action but the resource's `availableActions`
 * does not include `'manage'`, you should dynamically add `'manage'` to
 * `availableActions` for that resource.
 */
export function mapActionToStandard(action: string): StandardAction {
  if (STANDARD_ACTION_SET.has(action)) {
    return action as StandardAction;
  }

  return 'manage';
}
