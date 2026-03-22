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
  // Ações
  'access',
  'register',
  'modify',
  'remove',
  'import',
  'print',
  // Compartilhamento
  'export',
  'share',
  // Gerenciamento
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
  export: 'Externo',
  print: 'Imprimir',
  admin: 'Global',
  share: 'Interno',
  onlyself: 'Pessoal',
};

/** Column groups for the matrix table super-header */
export interface ActionGroup {
  label: string;
  actions: StandardAction[];
}

export const ACTION_GROUPS: ActionGroup[] = [
  {
    label: 'Ações',
    actions: ['access', 'register', 'modify', 'remove', 'import', 'print'],
  },
  { label: 'Compartilhamento', actions: ['export', 'share'] },
  { label: 'Gerenciamento', actions: ['admin', 'onlyself'] },
];

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
        backendResources: ['stock.products'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'export',
          'print',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Variantes',
        group: 'Cadastros',
        backendResources: ['stock.variants'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'export',
          'print',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Templates',
        group: 'Cadastros',
        backendResources: ['stock.templates'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import'],
      },
      {
        label: 'Categorias',
        group: 'Cadastros',
        backendResources: ['stock.categories'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'export',
        ],
      },
      {
        label: 'Fabricantes',
        group: 'Cadastros',
        backendResources: ['stock.manufacturers'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'export',
        ],
      },
      // Operações
      {
        label: 'Itens',
        group: 'Operações',
        backendResources: ['stock.items'],
        availableActions: ['access', 'import', 'export', 'print', 'admin'],
      },
      {
        label: 'Ordens de Compra',
        group: 'Operações',
        backendResources: ['stock.purchase-orders'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'export',
          'print',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Volumes',
        group: 'Operações',
        backendResources: ['stock.volumes'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'export',
          'print',
          'admin',
          'onlyself',
        ],
      },
      // Infraestrutura
      {
        label: 'Armazéns',
        group: 'Infraestrutura',
        backendResources: ['stock.warehouses'],
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
        backendResources: ['finance.suppliers'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'export',
        ],
      },
      {
        label: 'Contratos',
        group: 'Cadastros',
        backendResources: ['finance.contracts'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'export',
          'print',
        ],
      },
      // Operações
      {
        label: 'Lançamentos',
        group: 'Operações',
        backendResources: ['finance.entries'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'export',
          'print',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Consórcios',
        group: 'Operações',
        backendResources: ['finance.consortia'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'export',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Empréstimos',
        group: 'Operações',
        backendResources: ['finance.loans'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'export',
          'admin',
          'onlyself',
        ],
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
        availableActions: ['access', 'register', 'modify', 'remove', 'import'],
      },
      {
        label: 'Departamentos',
        group: 'Cadastros',
        backendResources: ['hr.departments'],
        availableActions: ['access', 'register', 'modify', 'remove', 'import'],
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
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'export',
          'print',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Férias',
        group: 'Operações',
        backendResources: ['hr.vacations'],
        availableActions: ['access', 'register', 'modify', 'admin', 'onlyself'],
      },
      {
        label: 'Ausências',
        group: 'Operações',
        backendResources: ['hr.absences'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Folha de Pagamento',
        group: 'Operações',
        backendResources: ['hr.payroll'],
        availableActions: ['access', 'register', 'export', 'print', 'admin'],
      },
      {
        label: 'Ponto',
        group: 'Operações',
        backendResources: ['hr.time-control'],
        availableActions: ['access', 'register', 'export', 'print'],
      },
    ],
  },

  // ── Tab 4: Vendas ───────────────────────────────────────────────────
  {
    id: 'sales',
    label: 'Vendas',
    icon: ShoppingCart,
    resources: [
      // CRM
      {
        label: 'Clientes',
        group: 'CRM',
        backendResources: ['sales.customers'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'export',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Contatos',
        group: 'CRM',
        backendResources: ['sales.contacts'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Negócios',
        group: 'CRM',
        backendResources: ['sales.deals'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Pipelines',
        group: 'CRM',
        backendResources: ['sales.pipelines'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Atividades',
        group: 'CRM',
        backendResources: ['sales.activities'],
        availableActions: ['access', 'register'],
      },
      {
        label: 'Conversas',
        group: 'CRM',
        backendResources: ['sales.conversations'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Workflows',
        group: 'CRM',
        backendResources: ['sales.workflows'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Formulários',
        group: 'CRM',
        backendResources: ['sales.forms'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Propostas',
        group: 'CRM',
        backendResources: ['sales.proposals'],
        availableActions: ['access', 'register', 'admin'],
      },
      {
        label: 'Templates de Mensagem',
        group: 'CRM',
        backendResources: ['sales.msg-templates'],
        availableActions: ['access', 'admin'],
      },
      // Pedidos e Orçamentos
      {
        label: 'Pedidos',
        group: 'Pedidos e Orçamentos',
        backendResources: ['sales.orders'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'export',
          'print',
          'admin',
          'onlyself',
        ],
      },
      {
        label: 'Orçamentos',
        group: 'Pedidos e Orçamentos',
        backendResources: ['sales.quotes'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'print',
          'onlyself',
        ],
      },
      {
        label: 'Devoluções',
        group: 'Pedidos e Orçamentos',
        backendResources: ['sales.returns'],
        availableActions: ['access', 'register', 'admin'],
      },
      // Preços e Promoções
      {
        label: 'Promoções',
        group: 'Preços e Promoções',
        backendResources: ['sales.promotions'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Tabelas de Preço',
        group: 'Preços e Promoções',
        backendResources: ['sales.price-tables'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Preços de Cliente',
        group: 'Preços e Promoções',
        backendResources: ['sales.customer-prices'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Descontos',
        group: 'Preços e Promoções',
        backendResources: ['sales.discounts'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Cupons',
        group: 'Preços e Promoções',
        backendResources: ['sales.coupons'],
        availableActions: ['access', 'register', 'remove', 'admin'],
      },
      {
        label: 'Combos',
        group: 'Preços e Promoções',
        backendResources: ['sales.combos'],
        availableActions: ['access', 'register', 'remove', 'admin'],
      },
      {
        label: 'Campanhas',
        group: 'Preços e Promoções',
        backendResources: ['sales.campaigns'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      // PDV e Caixa
      {
        label: 'PDV',
        group: 'PDV e Caixa',
        backendResources: ['sales.pos'],
        availableActions: ['access', 'admin', 'onlyself'],
      },
      {
        label: 'Caixa',
        group: 'PDV e Caixa',
        backendResources: ['sales.cashier'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Comissões',
        group: 'PDV e Caixa',
        backendResources: ['sales.commissions'],
        availableActions: ['access', 'admin', 'onlyself'],
      },
      // Licitações
      {
        label: 'Licitações',
        group: 'Licitações',
        backendResources: ['sales.bids'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Propostas de Licitação',
        group: 'Licitações',
        backendResources: ['sales.bid-proposals'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Bot de Licitação',
        group: 'Licitações',
        backendResources: ['sales.bid-bot'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Contratos de Licitação',
        group: 'Licitações',
        backendResources: ['sales.bid-contracts'],
        availableActions: ['access', 'register', 'admin'],
      },
      {
        label: 'Documentos de Licitação',
        group: 'Licitações',
        backendResources: ['sales.bid-documents'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Empenhos',
        group: 'Licitações',
        backendResources: ['sales.bid-empenhos'],
        availableActions: ['access', 'register', 'modify'],
      },
      // Catálogos e Conteúdo
      {
        label: 'Catálogos',
        group: 'Catálogos e Conteúdo',
        backendResources: ['sales.catalogs'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Conteúdo',
        group: 'Catálogos e Conteúdo',
        backendResources: ['sales.content'],
        availableActions: ['access', 'register', 'remove', 'admin'],
      },
      {
        label: 'Identidade Visual',
        group: 'Catálogos e Conteúdo',
        backendResources: ['sales.brand'],
        availableActions: ['access', 'modify'],
      },
      {
        label: 'Portal do Cliente',
        group: 'Catálogos e Conteúdo',
        backendResources: ['sales.customer-portal'],
        availableActions: ['access', 'register', 'remove'],
      },
      // Marketplaces
      {
        label: 'Marketplaces: Conexões',
        group: 'Marketplaces',
        backendResources: ['sales.marketplace-connections'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Marketplaces: Anúncios',
        group: 'Marketplaces',
        backendResources: ['sales.marketplace-listings'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Marketplaces: Pedidos',
        group: 'Marketplaces',
        backendResources: ['sales.marketplace-orders'],
        availableActions: ['access', 'modify'],
      },
      {
        label: 'Marketplaces: Pagamentos',
        group: 'Marketplaces',
        backendResources: ['sales.marketplace-payments'],
        availableActions: ['access'],
      },
      {
        label: 'Marketplaces (geral)',
        group: 'Marketplaces',
        backendResources: ['sales.marketplaces'],
        availableActions: ['access', 'admin'],
      },
      // Analytics
      {
        label: 'Analytics',
        group: 'Analytics',
        backendResources: ['sales.analytics'],
        availableActions: ['access', 'export', 'admin', 'onlyself'],
      },
      {
        label: 'Metas',
        group: 'Analytics',
        backendResources: ['sales.analytics-goals'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Relatórios',
        group: 'Analytics',
        backendResources: ['sales.analytics-reports'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Dashboards',
        group: 'Analytics',
        backendResources: ['sales.analytics-dashboards'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      {
        label: 'Rankings',
        group: 'Analytics',
        backendResources: ['sales.analytics-rankings'],
        availableActions: ['access'],
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
        backendResources: ['admin.users'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'admin',
        ],
      },
      {
        label: 'Grupos de Permissão',
        group: 'Gestão',
        backendResources: ['admin.permission-groups'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Empresas',
        group: 'Gestão',
        backendResources: ['admin.companies'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'import',
          'admin',
        ],
      },
      // Sistema
      {
        label: 'Sessões',
        group: 'Sistema',
        backendResources: ['admin.sessions'],
        availableActions: ['access', 'admin'],
      },
      {
        label: 'Auditoria',
        group: 'Sistema',
        backendResources: ['admin.audit'],
        availableActions: ['access', 'export', 'admin'],
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
        backendResources: ['tools.email.accounts'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'admin',
          'share',
        ],
      },
      {
        label: 'Email: Mensagens',
        group: 'Comunicação',
        backendResources: ['tools.email.messages'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'onlyself',
        ],
      },
      // Produtividade
      {
        label: 'Tarefas: Quadros',
        group: 'Produtividade',
        backendResources: ['tools.tasks.boards'],
        availableActions: ['access', 'register', 'modify', 'remove', 'share'],
      },
      {
        label: 'Tarefas: Cartões',
        group: 'Produtividade',
        backendResources: ['tools.tasks.cards'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'admin',
          'share',
          'onlyself',
        ],
      },
      {
        label: 'Agenda',
        group: 'Produtividade',
        backendResources: ['tools.calendar'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'export',
          'admin',
          'share',
          'onlyself',
        ],
      },
      // Arquivos
      {
        label: 'Pastas',
        group: 'Arquivos',
        backendResources: ['tools.storage.folders'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'admin',
          'share',
        ],
      },
      {
        label: 'Arquivos',
        group: 'Arquivos',
        backendResources: ['tools.storage.files'],
        availableActions: [
          'access',
          'register',
          'modify',
          'remove',
          'admin',
          'share',
          'onlyself',
        ],
      },
      // Assinatura Digital
      {
        label: 'Envelopes',
        group: 'Assinatura Digital',
        backendResources: ['tools.signature.envelopes'],
        availableActions: ['access', 'register', 'modify', 'remove', 'admin'],
      },
      {
        label: 'Certificados',
        group: 'Assinatura Digital',
        backendResources: ['tools.signature.certificates'],
        availableActions: ['access', 'register', 'remove', 'admin'],
      },
      {
        label: 'Templates de Assinatura',
        group: 'Assinatura Digital',
        backendResources: ['tools.signature.templates'],
        availableActions: ['access', 'register', 'modify', 'remove'],
      },
      // IA
      {
        label: 'Chat IA',
        group: 'Inteligência Artificial',
        backendResources: ['tools.ai.chat'],
        availableActions: ['access'],
      },
      {
        label: 'Insights IA',
        group: 'Inteligência Artificial',
        backendResources: ['tools.ai.insights'],
        availableActions: ['access'],
      },
      {
        label: 'Configuração IA',
        group: 'Inteligência Artificial',
        backendResources: ['tools.ai.config'],
        availableActions: ['access', 'modify'],
      },
      {
        label: 'Favoritos IA',
        group: 'Inteligência Artificial',
        backendResources: ['tools.ai.favorites'],
        availableActions: ['access', 'register', 'remove'],
      },
      {
        label: 'Ações IA',
        group: 'Inteligência Artificial',
        backendResources: ['tools.ai.actions'],
        availableActions: ['access'],
      },
    ],
  },

  // ── Tab 7: Sistema ──────────────────────────────────────────────────
  {
    id: 'system',
    label: 'Sistema',
    icon: Settings,
    resources: [
      // Usuário
      {
        label: 'Perfil',
        group: 'Usuário',
        backendResources: ['system.self'],
        availableActions: ['access', 'modify', 'admin'],
      },
      {
        label: 'Notificações',
        group: 'Usuário',
        backendResources: ['system.notifications'],
        availableActions: ['admin'],
      },
      // Sistema
      {
        label: 'Etiquetas',
        group: 'Sistema',
        backendResources: ['system.label-templates'],
        availableActions: ['access', 'register', 'modify', 'remove'],
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
 * Maps a backend action string to a StandardAction.
 *
 * New codes use actions directly (access, register, modify, etc.).
 * Legacy codes are also handled: list/read → access, create → register,
 * update → modify, delete → remove, manage → admin.
 */
const STANDARD_ACTION_SET = new Set<string>(STANDARD_ACTIONS);

const LEGACY_ACTION_MAP: Record<string, StandardAction> = {
  list: 'access',
  read: 'access',
  create: 'register',
  update: 'modify',
  delete: 'remove',
  manage: 'admin',
};

export function mapActionToStandard(action: string): StandardAction {
  if (STANDARD_ACTION_SET.has(action)) return action as StandardAction;
  return LEGACY_ACTION_MAP[action] ?? 'admin';
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
