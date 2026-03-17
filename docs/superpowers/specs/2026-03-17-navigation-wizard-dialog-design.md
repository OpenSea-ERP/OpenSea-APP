# NavigationWizardDialog + Variant/Item Modal Redesign

**Date:** 2026-03-17
**Status:** Approved
**Scope:** New reusable component + redesign of VariantFormModal and ItemEntryFormModal

---

## 1. Overview

Create a reusable `NavigationWizardDialog` component that encapsulates the sidebar-navigation modal pattern currently duplicated across VariantFormModal and ItemEntryFormModal. Redesign both modals to use it, adding missing backend fields and improving section distribution.

## 2. Component: NavigationWizardDialog

**File:** `src/components/ui/navigation-wizard-dialog.tsx`

### Props

```typescript
interface NavigationSection {
  id: string;
  label: string;
  icon: ReactNode;
  description?: string; // used only in "detailed" variant
  hidden?: boolean;      // dynamically hide sections (e.g., no template attributes)
}

interface NavigationWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  variant?: 'compact' | 'detailed'; // default: 'detailed'
  children: ReactNode;              // content for the active section
  footer: ReactNode;                // Cancel + Save buttons slot
  sectionErrors?: Record<string, boolean>; // sections with validation errors
  isPending?: boolean;              // disables sidebar nav + close during submission
}
```

### Layout

- Fixed size: `1000px x 600px`
- Three zones: Header (compact) | Body (sidebar + content) | Footer
- Header: title + subtitle left, X close button right
- Sidebar: left column, width varies by variant
- Content: ScrollArea, flex-1
- Footer: right-aligned button slot

### Variant "compact" (A)

- Sidebar width: ~140px
- Each item: icon in pill (24px) + label text
- Active state: pill bg blue-500/10, text blue-600 (dark: blue-400)
- Inactive: icon muted, text gray-600 (dark: white/60), hover bg subtle
- No description, no chevron

### Variant "detailed" (B — default)

- Sidebar width: ~180px
- Each item: icon in rounded box + label + description line
- Active state: left border 2px blue-500, bg blue-500/5, text blue-600
- Inactive: hover bg gray-100 (dark: white/5)
- Description: text-[10px] muted

### Section Error Indicators

- When `sectionErrors[sectionId]` is true, a small rose dot (w-2 h-2) appears on the sidebar item
- Provides visual cue for which sections need attention

### Hidden Sections

- Sections with `hidden: true` are filtered out of the sidebar and never rendered
- Used for conditional sections like Attributes when template has none

### Close Behavior

- X button calls `onOpenChange(false)`
- Overlay/backdrop click also closes (standard Radix behavior)
- When `isPending` is true: sidebar navigation disabled, X button disabled, overlay click prevented
- No separate `onClose` prop needed — `onOpenChange(false)` is the single close mechanism

### Section Transitions

- Instant swap via conditional rendering (no animation)
- ScrollArea resets scroll position on section change

## 3. VariantFormModal Redesign

**File:** `src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/variant-form-modal.tsx`

### Section Distribution (5 sections)

#### Section 1: Informacoes (FileText icon)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Nome da Variante | text input | Yes | autoFocus only on create mode (not edit) |
| SKU | text input | No | max 64 chars (matches DB VarChar(64); fix frontend type comment that says 100) |
| Referencia | text input | No | max 128 chars |
| Fora de Linha | switch | No | default false |
| Ativo | switch | No | default true |

Layout: Name + SKU in 2-col grid. Reference full-width. Switches in 2-col grid with border containers.

**Note:** Color fields (colorHex, colorPantone) are **removed** from this section and moved to the new Aparencia section.

#### Section 2: Aparencia (Palette icon) — NEW

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Cor Primaria (hex) | color picker + text | No | #RRGGBB, max 7 |
| Cor Primaria (pantone) | text input | No | max 32 (matches DB VarChar(32); fix existing modal maxLength=50) |
| Cor Secundaria (hex) | color picker + text | No | #RRGGBB, max 7 |
| Cor Secundaria (pantone) | text input | No | max 32 |
| Padrao | select | No | SOLID, STRIPED, PLAID, PRINTED, GRADIENT, JACQUARD |

Layout: Primary color row (picker + hex + pantone in 3-col). Secondary color row same layout. Pattern select full-width below.

#### Section 3: Precos (DollarSign icon)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Custo Calculado | money (disabled) | — | Avg from items |
| Custo Informado | money input | No | |
| Margem de Lucro % | number input | No | |
| Venda Calculado | money (disabled) | — | From cost + margin |
| Preco de Venda | money input | No | |
| Margem Calculada % | number (disabled) | — | From defined price |

Layout: 3-col grid, two rows. Same as current.

#### Section 4: Estoque (Package icon)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Estoque Minimo | number input | No | |
| Estoque Maximo | number input | No | |
| Ponto de Reposicao | number input | No | |
| Quantidade de Reposicao | number input | No | |

Layout: 2x2 grid. Same as current.

#### Section 5: Atributos (SlidersHorizontal icon) — CONDITIONAL

- Hidden when template has no variant attributes
- Dynamic grid of template-defined fields (text, number, date, select, boolean)
- 2-col grid layout

### Form State

Add to FormData:
- `sku: string`
- `secondaryColorHex: string`
- `secondaryColorPantone: string`
- `pattern: string` (Pattern enum value or empty)

### Edit Mode Population

When `variant` prop is provided (edit mode), populate new fields from variant object:
- `sku` from `variant.sku || ''`
- `secondaryColorHex` from `variant.secondaryColorHex || ''`
- `secondaryColorPantone` from `variant.secondaryColorPantone || ''`
- `pattern` from `variant.pattern || ''`

### Submit Payload

Add to cleanData:
- `sku` (if not empty)
- `secondaryColorHex` (if not empty)
- `secondaryColorPantone` (if not empty)
- `pattern` (if not empty)

## 4. ItemEntryFormModal Redesign

**File:** `src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/item-entry-form-modal.tsx`

### Section Distribution (4 sections)

#### Section 1: Entrada (Package icon)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Tipo de Entrada | card selector | Yes | PURCHASE / CUSTOMER_RETURN |
| Localizacao (Bin) | BinSelector | Yes | |
| Quantidade | text (decimal) | Yes | max 3 decimal places |

Layout: Entry type cards in 2-col. Bin + Quantity in 2-col grid.

#### Section 2: Custos (DollarSign icon)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Custo Unitario | money input | No | |
| Custo Total | money (disabled) | — | unitCost * quantity |

Layout: 2-col grid.

#### Section 3: Rastreabilidade (CalendarDays icon)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Codigo Unico | text input | No | max 128, discrete placement at top |
| N do Lote | text input | No | max 64 |
| N da Nota Fiscal | text input | No | |
| Data de Fabricacao | date input | No | |
| Data de Validade | date input | No | |
| Observacoes | textarea | No | max 1000, 3 rows |

Layout: uniqueCode full-width at top. Lote + NF in 2-col. Dates in 2-col. Notes full-width.

#### Section 4: Atributos (SlidersHorizontal icon) — CONDITIONAL

- Hidden when template has no item attributes
- Same dynamic rendering as variant attributes

### Form State

Add to FormData:
- `uniqueCode: string`

### Submit Payload

Add to createData:
- `uniqueCode` (if not empty)

## 5. Validation Flow

Both modals share the same validation behavior:

1. Save button is **always enabled**
2. On click, validate all required fields across all sections
3. If validation fails:
   - Show toast: "Preencha os campos obrigatórios"
   - Set `sectionErrors` on sections containing invalid fields
   - Navigate to the first section with errors
   - Invalid required fields get rose border + error message below
4. If validation passes: submit mutation as usual
5. `sectionErrors` clearing is the consumer's responsibility (the modal component clears errors when fields in that section are modified). The NavigationWizardDialog only renders the error indicators.

### Required Fields by Modal

**VariantFormModal:** name only
**ItemEntryFormModal:** entryType (has default), binId, quantity

## 6. Files to Create

| File | Description |
|------|-------------|
| `src/components/ui/navigation-wizard-dialog.tsx` | New reusable component |

## 7. Files to Modify

| File | Description |
|------|-------------|
| `src/app/.../products/src/modals/variant-form-modal.tsx` | Refactor to use NavigationWizardDialog, add new fields |
| `src/app/.../products/src/modals/item-entry-form-modal.tsx` | Refactor to use NavigationWizardDialog, add uniqueCode |
| `src/types/stock/variant.types.ts` | Add secondaryColorHex, secondaryColorPantone, pattern to Variant type; fix SKU maxLength comment (100 -> 64) |
| `src/types/stock/item.types.ts` | Ensure uniqueCode is in Item type and RegisterItemEntryRequest |
| `src/services/stock/variants.service.ts` (if needed) | Ensure new fields in create/update payloads |

## 8. Design Decisions

- **Sidebar variant as prop**: `compact` vs `detailed` enables A/B testing without code changes
- **Section hiding**: Attributes section hidden dynamically — no empty states for missing template attributes
- **Appearance section**: Extracted from Basic because color fields grew from 2 to 5+ with secondary colors and pattern
- **uniqueCode placement**: In Rastreabilidade section, top position, simple text input — present but not prominent
- **Validation UX**: Save always active with on-click validation + section error indicators is more discoverable than silent disable
- **Fixed modal size**: 1000x600px provides consistent experience with enough room for 2-col grids
