# Permission UI Redesign — Toggle Chips

**Date**: 2026-04-02
**Supersedes**: 2026-03-19-permission-wizard-redesign.md (matrix approach)

## Overview

Replace the current checkbox matrix permission UI with a **NavigationWizardDialog** containing **collapsible resource cards** with **clickable toggle chips**. This is a frontend-only change — backend API, permission codes, and middleware remain untouched.

## Goals

1. Replace matrix table with toggle chips inside collapsible resource cards
2. Keep NavigationWizardDialog for module navigation (left sidebar)
3. Support unlimited actions per resource (not locked to 10 columns)
4. Add tooltips with permission descriptions
5. Preserve bulk selection (group, resource, module level)
6. Mobile-responsive with collapsible nav drawer
7. Auto-categorize new permissions from code structure

## Design

### Modal Structure

- **Component**: `NavigationWizardDialog` (existing pattern)
- **Left sidebar** (~230px): Module tabs with badge counters
- **Right content**: Search bar + collapsible resource cards with chips

### Left Sidebar — Module Navigation

Each module item shows:

- Module icon (Lucide)
- Module label (PT-BR)
- Badge with `active/total` count
- Badge color varies by state:
  - All active → emerald (`bg-emerald-500/10 text-emerald-400`)
  - Partial → sky (`bg-sky-500/10 text-sky-400`)
  - None active → muted (`bg-muted text-muted-foreground`)
  - Currently selected → violet (`bg-violet-500/15 text-violet-300`)
- Footer: "Total: X / Y permissões"

### Right Content Area

#### Header Bar

- **Search input**: Filters permissions by label or code. When filtering, auto-expands matching resource cards
- **"Ativar tudo"** button: Activates all permissions in current module
- **"Limpar"** button: Deactivates all in current module
- **"Expandir tudo" / "Colapsar tudo"** toggle button: Expands or collapses all resource cards at once

#### Group Headers

- Group label (e.g., "Cadastros", "Operações") in violet
- Resource count ("4 recursos")
- "Ativar grupo" button — toggles all permissions in the group

#### Resource Cards (Collapsible)

Each resource (e.g., "Produtos", "Categorias") is a card:

**Collapsed state:**

- Arrow indicator (▶)
- Resource name
- Badge: `active/total` with semantic color (same rules as module badges)
- "Tudo" button to activate all

**Expanded state:**

- Arrow rotated (▼)
- Resource name + badge
- "Tudo" / "Limpar" button (shows "Limpar" when all active)
- Chips area with toggle chips

**Card border color:**

- Has active permissions → `border-violet-500/20`
- All active → `border-emerald-500/15`
- None active → `border-border`

#### Toggle Chips

Each permission is a clickable chip:

**Active chip:**

- Modern checkbox icon (rounded square with checkmark SVG) + label
- Filled background (violet gradient)
- `font-weight: 500`

**Inactive chip:**

- Empty checkbox icon (rounded square, no checkmark) + label
- Outline/muted background
- `text-muted-foreground`

**Chip divider:** A vertical line separates regular actions from special ones (admin, onlyself) within the same resource.

**Tooltip on hover:** Shows permission description text. Uses standard shadcn Tooltip component.

### Mobile Responsiveness

- **Breakpoint**: Below `md` (768px)
- Nav sidebar becomes a **drawer** (slide from left)
- Top bar shows: hamburger button + current module name + badge
- Clicking hamburger opens drawer with overlay backdrop
- Drawer has close button (✕) at top
- Chips wrap naturally at smaller widths (already flex-wrap)

## Data Flow

### Configuration (replaces `permission-matrix-config.ts`)

The existing `MatrixTab` / `MatrixResource` config structure is reusable with minor additions:

```typescript
// Rename or extend existing config
interface PermissionResource {
  label: string;
  group: string;
  backendResources: string[];
  availableActions: string[]; // no longer constrained to StandardAction
}

interface PermissionModule {
  id: string;
  label: string;
  icon: LucideIcon;
  resources: PermissionResource[];
}
```

### Action Labels & Descriptions

Extend the action label map to include descriptions for tooltips:

```typescript
const ACTION_CONFIG: Record<string, { label: string; description: string }> = {
  access: {
    label: 'Visualizar',
    description: 'Permite visualizar e listar registros',
  },
  register: {
    label: 'Criar',
    description: 'Permite cadastrar novos registros',
  },
  modify: {
    label: 'Editar',
    description: 'Permite alterar registros existentes',
  },
  remove: {
    label: 'Excluir',
    description: 'Permite excluir registros permanentemente',
  },
  import: {
    label: 'Importar',
    description: 'Permite importar registros em massa via planilha',
  },
  export: {
    label: 'Exportar',
    description: 'Permite exportar dados para Excel/CSV',
  },
  print: {
    label: 'Imprimir',
    description: 'Permite gerar documentos para impressão/PDF',
  },
  share: {
    label: 'Compartilhar',
    description: 'Permite compartilhar registros internamente',
  },
  admin: {
    label: 'Administrar',
    description:
      'Acesso administrativo — gerencia registros de todos os usuários',
  },
  onlyself: {
    label: 'Somente próprios',
    description: 'Restringe acesso apenas aos próprios registros',
  },
  // Domain-specific actions (Sales, etc.) added here
};
```

**Auto-categorization:** If an action code isn't in the map, display a formatted version of the code (`kebab-to-title`) and place in an "Outros" group. This ensures new permissions never get lost.

### Selection State

Same diff-based approach as current implementation:

1. Load `currentCodes: Set<string>` from API
2. User toggles chips → updates `selectedCodes: Set<string>`
3. On save: `toAdd = selectedCodes - currentCodes`, `toRemove = currentCodes - selectedCodes`
4. Call existing bulk API endpoints

### Badge Count Calculation

Computed from the config + selected codes:

- For each module: count how many of its `backendResources.*.action` codes are in `selectedCodes`
- For each resource: count its active actions vs available actions
- For each group: sum its resources

## Components

### New Components

- `ManagePermissionsModal` — complete rewrite using NavigationWizardDialog
- `PermissionResourceCard` — collapsible card with chips
- `PermissionChip` — individual toggle chip with tooltip
- `PermissionGroupHeader` — group section header with bulk toggle

### Reused Components

- `NavigationWizardDialog` (existing)
- `Tooltip` from shadcn/ui
- `Badge` from shadcn/ui
- `Input` for search (shadcn)

### Removed Components

- `PermissionMatrixTable` (current matrix)
- Matrix-specific column/row select logic

## Files Changed

| File                                                            | Change                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| `permission-groups/src/modals/manage-permissions-modal.tsx`     | Complete rewrite                                       |
| `permission-groups/src/config/permission-matrix-config.ts`      | Evolve to chip config (add descriptions, rename types) |
| `permission-groups/src/components/permission-resource-card.tsx` | New                                                    |
| `permission-groups/src/components/permission-chip.tsx`          | New                                                    |
| `permission-groups/src/components/permission-group-header.tsx`  | New                                                    |

## Out of Scope

- Backend permission code changes
- New permission creation workflow
- Permission inheritance/hierarchy UI
- Role presets management (kept as-is)
