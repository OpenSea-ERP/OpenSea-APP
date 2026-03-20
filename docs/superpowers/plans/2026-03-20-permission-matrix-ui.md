# Permission Matrix UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current tree-based ManagePermissionsModal with a matrix UI featuring vertical module tabs and a checkbox grid, without changing backend permission codes.

**Architecture:** The existing modal shell (Dialog, save logic, data loading) stays the same. The body is replaced with a two-panel layout: left sidebar with 7 module tabs, right area with a header (module title + counts + "Selecionar tudo"/"Limpar tudo") + table where rows are resources and columns are the 8 standard actions. A config file maps the existing ~721 backend permissions (grouped by module/resource/action) into the 7 visual tabs using CURRENT backend codes (not the future restructured codes from the spec — backend migration is a separate phase). Non-standard actions (approve, cancel, transfer, etc.) are bucketed under the "Gerenciar" column via `mapActionToStandard()`.

**Important:** The `backendResources` arrays in the config use the CURRENT backend permission code prefixes (e.g., `audit.logs`, `rbac.groups`, `calendar.events`) because `listAllPermissions()` returns permissions grouped by these existing modules/resources. The config's job is purely visual reorganization — it groups these existing codes into 7 user-friendly tabs without any backend changes.

**Tech Stack:** React 19, shadcn/ui (Dialog, Checkbox, Button, Tooltip, Popover), Lucide icons, TailwindCSS 4

**Spec Reference:** `docs/superpowers/specs/2026-03-19-permission-wizard-redesign.md`

---

## File Structure

| Action  | File                                                                     | Responsibility                                                                                                                                  |
| ------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Create  | `permission-groups/src/config/permission-matrix-config.ts`               | Maps backend modules/resources → 7 visual tabs with display names, icons, subtitles, and which of the 8 standard actions each resource supports |
| Rewrite | `permission-groups/src/modals/manage-permissions-modal.tsx`              | New matrix layout: module tabs + checkbox grid, reuses existing data loading and diff-based save                                                |
| Create  | `permission-groups/src/components/module-tab-list.tsx`                   | Left sidebar: 7 vertical tabs with icon, label, selected count badge                                                                            |
| Create  | `permission-groups/src/components/permission-matrix-table.tsx`           | Right area: sticky header row with 8 action columns + select-all buttons, resource rows with checkboxes                                         |
| Keep    | `permission-groups/src/modals/manage-permissions-modal.tsx` (save logic) | Diff-based save: bulk add + individual remove — unchanged                                                                                       |

All paths relative to: `src/app/(dashboard)/(modules)/admin/(entities)/`

---

## Task 1: Create Permission Matrix Config

**Files:**

- Create: `permission-groups/src/config/permission-matrix-config.ts`

This is the mapping layer between the existing backend permission structure and the 7-tab matrix view. It does NOT change any backend codes — it simply organizes the existing permissions for display.

- [ ] **Step 1: Create the config file with types and tab definitions**

```ts
// permission-matrix-config.ts
import {
  Package,
  DollarSign,
  Users,
  ShoppingCart,
  Building2,
  Wrench,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** The 8 standard actions displayed as matrix columns */
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

/** PT-BR column headers */
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

/** A resource row in the matrix */
export interface MatrixResource {
  /** Display name in PT-BR */
  label: string;
  /** Subtitle text (consolidated sub-resources) */
  subtitle?: string;
  /**
   * Maps backend module.resource keys to this visual row.
   * e.g., ['stock.products', 'stock.product-attachments']
   * The config consumer will collect all permissions from these
   * backend resources and bucket them into the 8 standard columns.
   */
  backendResources: string[];
  /**
   * Which of the 8 standard actions this resource supports.
   * Actions not listed here render as N/A (grayed out, not clickable).
   */
  availableActions: StandardAction[];
}

/** A tab in the left sidebar */
export interface MatrixTab {
  id: string;
  label: string;
  icon: LucideIcon;
  resources: MatrixResource[];
}

export const MATRIX_TABS: MatrixTab[] = [
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
        backendResources: ['stock.suppliers', 'finance.suppliers'],
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
        subtitle: 'suspender, reativar, licenca',
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
          'hr.payroll',
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
          'hr.time-control',
          'hr.time-entries',
          'hr.time-bank',
          'hr.overtime',
        ],
        availableActions: ['create', 'export', 'list', 'read'],
      },
    ],
  },
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
        subtitle: 'enderecos, CNAEs, fiscal, socios',
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
        backendResources: ['core.users', 'core.teams'],
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
        subtitle: 'versoes, compartilhar, download',
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
        subtitle: 'compartilhar com usuario/grupo',
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
        backendResources: [
          'notifications.notifications',
          'notifications.broadcasts',
        ],
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
          'self.time-entries',
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

/**
 * Builds a lookup: `"module.resource"` → tab ID.
 * Used to bucket backend permissions into matrix tabs.
 */
export function buildBackendResourceToTabMap(): Map<
  string,
  { tabId: string; resourceIndex: number }
> {
  const map = new Map<string, { tabId: string; resourceIndex: number }>();
  for (const tab of MATRIX_TABS) {
    tab.resources.forEach((resource, idx) => {
      for (const br of resource.backendResources) {
        map.set(br, { tabId: tab.id, resourceIndex: idx });
      }
    });
  }
  return map;
}

/**
 * Determines if a backend action maps to one of the 8 standard actions.
 * Non-standard actions (approve, cancel, transfer, etc.) map to 'manage'.
 *
 * NOTE: When computing ResourcePermissionMap, if this returns 'manage'
 * but the resource's availableActions does not include 'manage',
 * dynamically add 'manage' to availableActions for that resource.
 * This prevents silently dropping permissions.
 */
export function mapActionToStandard(action: string): StandardAction {
  if (STANDARD_ACTIONS.includes(action as StandardAction)) {
    return action as StandardAction;
  }
  // All domain-specific actions bucket under 'manage'
  return 'manage';
}
```

- [ ] **Step 2: Verify config compiles**

Run: `cd OpenSea-APP && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to the new file

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/config/permission-matrix-config.ts
git commit -m "feat(rbac): add permission matrix config mapping backend resources to 7 visual tabs"
```

---

## Task 2: Create ModuleTabList Component

**Files:**

- Create: `permission-groups/src/components/module-tab-list.tsx`

Vertical sidebar with 7 module tabs. Each tab shows icon + label + selected permission count badge.

- [ ] **Step 1: Create the component**

```tsx
// module-tab-list.tsx
'use client';

import { cn } from '@/lib/utils';
import type { MatrixTab } from '../config/permission-matrix-config';

interface ModuleTabListProps {
  tabs: MatrixTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  /** Count of selected permissions per tab: { tabId: number } */
  selectedCounts: Record<string, number>;
  /** Total permissions per tab */
  totalCounts: Record<string, number>;
}

export function ModuleTabList({
  tabs,
  activeTabId,
  onTabChange,
  selectedCounts,
  totalCounts,
}: ModuleTabListProps) {
  return (
    <div className="flex flex-col gap-1 w-[180px] shrink-0 border-r border-border pr-3 overflow-y-auto">
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        const selected = selectedCounts[tab.id] ?? 0;
        const total = totalCounts[tab.id] ?? 0;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left transition-colors',
              isActive
                ? 'bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300'
                : 'border border-transparent opacity-60 hover:opacity-100 hover:bg-muted/50'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tab.label}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {selected}/{total}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Export from barrel**

Add to `permission-groups/src/index.ts`:

```ts
export { ModuleTabList } from './components/module-tab-list';
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/components/module-tab-list.tsx
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/index.ts
git commit -m "feat(rbac): add ModuleTabList sidebar component for permission matrix"
```

---

## Task 3: Create PermissionMatrixTable Component

**Files:**

- Create: `permission-groups/src/components/permission-matrix-table.tsx`

The core matrix: sticky header with 8 action columns + select-all buttons, resource rows with checkboxes.

- [ ] **Step 1: Create the component**

```tsx
// permission-matrix-table.tsx
'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowRight } from 'lucide-react';
import {
  STANDARD_ACTIONS,
  ACTION_LABELS,
  type MatrixResource,
  type StandardAction,
} from '../config/permission-matrix-config';

/** For each resource row, which permission codes map to which standard action */
export interface ResourcePermissionMap {
  /** resource index in the tab's resources array */
  resourceIndex: number;
  /** action → Set of backend permission codes that map to this action */
  actionCodes: Record<StandardAction, Set<string>>;
}

interface PermissionMatrixTableProps {
  resources: MatrixResource[];
  /** Pre-computed mapping for each resource */
  permissionMaps: ResourcePermissionMap[];
  selectedCodes: Set<string>;
  onToggleCode: (code: string) => void;
  onToggleCodes: (codes: string[], forceState?: boolean) => void;
  /** When true, all checkboxes and select-all buttons are disabled (detail page) */
  readOnly?: boolean;
}

export function PermissionMatrixTable({
  resources,
  permissionMaps,
  selectedCodes,
  onToggleCode,
  onToggleCodes,
}: PermissionMatrixTableProps) {
  // Select-all for a column (action) across all resources
  const handleToggleColumn = (action: StandardAction) => {
    const allCodes: string[] = [];
    for (const pm of permissionMaps) {
      const resource = resources[pm.resourceIndex];
      if (!resource.availableActions.includes(action)) continue;
      pm.actionCodes[action].forEach(c => allCodes.push(c));
    }
    const allSelected =
      allCodes.length > 0 && allCodes.every(c => selectedCodes.has(c));
    onToggleCodes(allCodes, !allSelected);
  };

  // Select-all for a row (resource) across all actions
  const handleToggleRow = (resourceIndex: number) => {
    const pm = permissionMaps.find(p => p.resourceIndex === resourceIndex);
    if (!pm) return;
    const resource = resources[resourceIndex];
    const allCodes: string[] = [];
    for (const action of resource.availableActions) {
      pm.actionCodes[action].forEach(c => allCodes.push(c));
    }
    const allSelected =
      allCodes.length > 0 && allCodes.every(c => selectedCodes.has(c));
    onToggleCodes(allCodes, !allSelected);
  };

  // Check column state for select-all icon
  const getColumnState = (action: StandardAction): 'all' | 'some' | 'none' => {
    const codes: string[] = [];
    for (const pm of permissionMaps) {
      const resource = resources[pm.resourceIndex];
      if (!resource.availableActions.includes(action)) continue;
      pm.actionCodes[action].forEach(c => codes.push(c));
    }
    if (codes.length === 0) return 'none';
    const selected = codes.filter(c => selectedCodes.has(c)).length;
    if (selected === codes.length) return 'all';
    if (selected > 0) return 'some';
    return 'none';
  };

  // Check row state
  const getRowState = (resourceIndex: number): 'all' | 'some' | 'none' => {
    const pm = permissionMaps.find(p => p.resourceIndex === resourceIndex);
    if (!pm) return 'none';
    const resource = resources[resourceIndex];
    const codes: string[] = [];
    for (const action of resource.availableActions) {
      pm.actionCodes[action].forEach(c => codes.push(c));
    }
    if (codes.length === 0) return 'none';
    const selected = codes.filter(c => selectedCodes.has(c)).length;
    if (selected === codes.length) return 'all';
    if (selected > 0) return 'some';
    return 'none';
  };

  // Cell state for a specific resource + action
  const getCellState = (
    pm: ResourcePermissionMap,
    action: StandardAction
  ): 'checked' | 'unchecked' | 'indeterminate' | 'na' => {
    const resource = resources[pm.resourceIndex];
    if (!resource.availableActions.includes(action)) return 'na';
    const codes = pm.actionCodes[action];
    if (codes.size === 0) return 'na';
    const selected = [...codes].filter(c => selectedCodes.has(c)).length;
    if (selected === codes.size) return 'checked';
    if (selected > 0) return 'indeterminate';
    return 'unchecked';
  };

  // Toggle all codes for a cell
  const handleToggleCell = (
    pm: ResourcePermissionMap,
    action: StandardAction
  ) => {
    const codes = [...pm.actionCodes[action]];
    if (codes.length === 0) return;
    const allSelected = codes.every(c => selectedCodes.has(c));
    onToggleCodes(codes, !allSelected);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b border-border">
            {/* Resource name column */}
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-[220px] min-w-[220px]">
              Recurso
            </th>
            {/* Action columns */}
            {STANDARD_ACTIONS.map(action => {
              const colState = getColumnState(action);
              return (
                <th
                  key={action}
                  className="py-2 px-1 text-center w-[72px] min-w-[72px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {ACTION_LABELS[action]}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleToggleColumn(action)}
                          className={cn(
                            'flex items-center justify-center h-5 w-5 rounded transition-colors',
                            colState === 'all'
                              ? 'bg-blue-500/70 text-white'
                              : colState === 'some'
                                ? 'bg-blue-500/30 text-blue-500'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          )}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">
                          {colState === 'all'
                            ? 'Desmarcar coluna'
                            : 'Selecionar coluna'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {resources.map((resource, idx) => {
            const pm = permissionMaps.find(p => p.resourceIndex === idx);
            if (!pm) return null;
            const rowState = getRowState(idx);

            return (
              <tr
                key={idx}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
              >
                {/* Resource name + select-all row */}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleToggleRow(idx)}
                          className={cn(
                            'flex items-center justify-center h-5 w-5 rounded shrink-0 transition-colors',
                            rowState === 'all'
                              ? 'bg-blue-500/70 text-white'
                              : rowState === 'some'
                                ? 'bg-blue-500/30 text-blue-500'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          )}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-xs">
                          {rowState === 'all'
                            ? 'Desmarcar linha'
                            : 'Selecionar linha'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {resource.label}
                      </p>
                      {resource.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {resource.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                {/* Action cells */}
                {STANDARD_ACTIONS.map(action => {
                  const cellState = getCellState(pm, action);
                  const isManage = action === 'manage' && cellState !== 'na';

                  if (cellState === 'na') {
                    return (
                      <td key={action} className="py-2.5 px-1 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-4 w-4 rounded border border-muted/30 opacity-20" />
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={action} className="py-2.5 px-1 text-center">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={
                            cellState === 'checked'
                              ? true
                              : cellState === 'indeterminate'
                                ? 'indeterminate'
                                : false
                          }
                          onCheckedChange={() => handleToggleCell(pm, action)}
                          className={cn(
                            'h-4 w-4',
                            isManage &&
                              cellState === 'checked' &&
                              'data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500'
                          )}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Export from barrel**

Add to `permission-groups/src/index.ts`:

```ts
export { PermissionMatrixTable } from './components/permission-matrix-table';
export type { ResourcePermissionMap } from './components/permission-matrix-table';
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/components/permission-matrix-table.tsx
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/index.ts
git commit -m "feat(rbac): add PermissionMatrixTable checkbox grid component"
```

---

## Task 4: Rewrite ManagePermissionsModal with Matrix Layout

**Files:**

- Modify: `permission-groups/src/modals/manage-permissions-modal.tsx`

Replace the tree-based body with the two-panel matrix layout. Keep the same Dialog shell, data loading, and diff-based save logic.

- [ ] **Step 1: Rewrite the modal**

The new modal structure:

- Same `Dialog` + `DialogContent max-w-6xl h-[85vh]`
- Same `DialogHeader` with group icon + name + global count "X de Y permissões selecionadas"
- Body: flex row → `ModuleTabList` (left, 180px) + Right panel:
  - **Right-panel header**: Active tab name as `<h3>` + subtitle "X de Y permissões ativas neste módulo" + "Selecionar tudo" (outline) / "Limpar tudo" (outline) buttons aligned right
  - **Matrix table**: `PermissionMatrixTable` with scrollable overflow
- `DialogFooter`:
  - **Left side**: Hint text `"Dica: Clique no ícone → para selecionar toda a linha, ou ⬇ para toda a coluna"` (text-xs text-muted-foreground)
  - **Right side**: "Cancelar" (outline) + "Salvar Permissões" (primary blue, NOT just "Salvar")
- New internal logic: `buildPermissionMaps()` that processes `AllPermissionsResponse` into `ResourcePermissionMap[]` per tab using the config

Key changes from current:

1. Remove `Collapsible` tree rendering
2. Add `activeTab` state (default: first tab)
3. Add `useMemo` to compute `ResourcePermissionMap[]` per tab from backend data
4. Replace individual `togglePermission`/`toggleResource`/`toggleAllInModule` with generic `onToggleCodes(codes[], forceState)`
5. Add right-panel header with module title + per-module count + "Selecionar tudo"/"Limpar tudo"
6. Add footer hint text on the left side
7. Rename save button from "Salvar" to "Salvar Permissões"
8. Increase modal width to `max-w-6xl`
9. When computing `ResourcePermissionMap`, if `mapActionToStandard()` returns `'manage'` for a permission but the resource's `availableActions` doesn't include `'manage'`, dynamically add it

**Note:** `SelectAllColumnButton` and `SelectAllRowButton` from the spec are implemented as inline elements within `PermissionMatrixTable`, not as separate component files.

The complete rewrite should:

- Import `MATRIX_TABS`, `buildBackendResourceToTabMap`, `mapActionToStandard`, `STANDARD_ACTIONS` from config
- Import `ModuleTabList` and `PermissionMatrixTable`
- Keep `loadData` function identical (same API calls)
- Keep `handleSave` function identical (same diff logic)
- Replace body with matrix layout

- [ ] **Step 2: Verify it compiles**

Run: `cd OpenSea-APP && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Visual test — open the modal in browser**

1. Run `npm run dev`
2. Navigate to `/admin/permission-groups`
3. Click any group → context menu → "Permissoes"
4. Verify: modal opens with left tabs + right matrix
5. Verify: clicking tabs switches the matrix content
6. Verify: checkboxes toggle correctly
7. Verify: select-all row/column buttons work
8. Verify: "Selecionar tudo" / "Limpar tudo" work
9. Verify: save works (check network tab for correct API calls)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/modals/manage-permissions-modal.tsx
git commit -m "feat(rbac): rewrite ManagePermissionsModal with matrix UI — 7 tabs + checkbox grid"
```

---

## Task 5: Update Detail Page Permissions Tab

**Files:**

- Modify: `permission-groups/[id]/page.tsx`

The detail page's "Permissoes" tab currently shows a read-only tree. Update it to show a read-only version of the matrix (same layout, disabled checkboxes).

- [ ] **Step 1: Update the permissions tab rendering**

Replace the collapsible tree in the permissions tab with the same matrix layout but with all interactions disabled:

- Pass `readOnly={true}` to `PermissionMatrixTable` — this prop (defined in Task 3) disables all checkboxes and hides select-all row/column buttons
- Inside `PermissionMatrixTable`, when `readOnly` is true: render checkboxes with `disabled` prop, hide `ArrowDown`/`ArrowRight` toggle buttons, add `opacity-70` to unchecked cells
- Show `ModuleTabList` with counts (clickable for navigation between tabs, just no edit capability)
- Keep the same data fetching (`listAllPermissions` + `listGroupPermissions`)
- Reuse the same `useMemo` logic from the modal to build `ResourcePermissionMap[]` — extract this into a shared hook `usePermissionMatrixData` if it makes the code cleaner

- [ ] **Step 2: Visual test**

1. Navigate to `/admin/permission-groups/{id}`
2. Click "Permissoes" tab
3. Verify matrix displays correctly in read-only mode
4. Verify counts match between tabs and matrix

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/\[id\]/page.tsx
git commit -m "feat(rbac): update permission group detail page with read-only matrix view"
```

---

## Task 6: Handle Unmapped Permissions

**Files:**

- Modify: `permission-groups/src/config/permission-matrix-config.ts`
- Modify: `permission-groups/src/modals/manage-permissions-modal.tsx`

Some backend permissions may not map to any tab (e.g., `ui.*`, `reports.*`, `data.*`, `settings.*`, wildcard permissions). These need to be visible so they aren't silently lost.

- [ ] **Step 1: Add "Outras" overflow section**

In the modal, after the matrix table, add a collapsible section "Outras permissões ({count})" that shows unmapped permissions as simple checkboxes (similar to current tree style but flat). This ensures no permission is hidden.

- [ ] **Step 2: Compute unmapped permissions**

In the modal's `useMemo`, after bucketing permissions into tabs, collect any permission codes that didn't map to any tab resource. Display these in the overflow section.

- [ ] **Step 3: Visual test**

1. Open the modal
2. If there are unmapped permissions, verify the "Outras" section appears below the matrix
3. Verify these can be toggled and saved

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/
git commit -m "feat(rbac): add overflow section for unmapped permissions in matrix modal"
```

---

## Task 7: Polish & Edge Cases

**Files:**

- Modify: `permission-groups/src/modals/manage-permissions-modal.tsx`
- Modify: `permission-groups/src/components/permission-matrix-table.tsx`

- [ ] **Step 1: Add keyboard navigation**

- Tab key moves between checkboxes
- Space toggles checkbox (already built-in with shadcn)

- [ ] **Step 2: Add empty state**

If a tab has 0 permissions (e.g., a module not yet implemented), show a centered message "Nenhuma permissao disponivel neste modulo".

- [ ] **Step 3: Add loading skeleton**

Replace the simple Loader2 spinner with a skeleton that mimics the matrix layout (sidebar tabs + table rows).

- [ ] **Step 4: Responsive behavior**

On smaller screens, the left sidebar should collapse to icons-only (no labels).

- [ ] **Step 5: Final visual review + commit**

```bash
git add src/app/\(dashboard\)/\(modules\)/admin/\(entities\)/permission-groups/src/
git commit -m "feat(rbac): polish permission matrix — keyboard nav, empty states, skeleton, responsive"
```

---

## Summary

| Task | Description                          | Files      |
| ---- | ------------------------------------ | ---------- |
| 1    | Config mapping backend → 7 tabs      | 1 new      |
| 2    | ModuleTabList sidebar component      | 1 new      |
| 3    | PermissionMatrixTable grid component | 1 new      |
| 4    | Rewrite ManagePermissionsModal       | 1 modified |
| 5    | Update detail page read-only view    | 1 modified |
| 6    | Handle unmapped permissions overflow | 2 modified |
| 7    | Polish & edge cases                  | 2 modified |

Total: 3 new files, 3 modified files. No backend changes.
