# NavigationWizardDialog + Variant/Item Modal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable NavigationWizardDialog component and redesign VariantFormModal + ItemEntryFormModal with new backend fields and improved UX.

**Architecture:** Extract the duplicated sidebar-navigation modal pattern into a generic `NavigationWizardDialog` component with two visual variants (compact/detailed). Refactor both modals to consume it, adding missing fields (secondary colors, pattern, SKU, uniqueCode) and new Appearance section.

**Tech Stack:** React 19, Next.js 16, TailwindCSS 4, shadcn/ui (Dialog, ScrollArea, Button), lucide-react, React Query, sonner (toasts)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/ui/navigation-wizard-dialog.tsx` | Create | Reusable modal with sidebar navigation, two visual variants, section error indicators, isPending state |
| `src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/variant-form-modal.tsx` | Rewrite | Refactor to use NavigationWizardDialog, add Appearance section, SKU, secondary colors, pattern, validation UX |
| `src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/item-entry-form-modal.tsx` | Rewrite | Refactor to use NavigationWizardDialog, add uniqueCode field, validation UX |

**No changes needed to:**
- `src/types/stock/variant.types.ts` — already has all fields (secondaryColorHex, secondaryColorPantone, pattern, sku). Minor: fix maxLength comments (sku 100->64, pantone 50->32) during Task 2.
- `src/types/stock/item.types.ts` — already has uniqueCode in Item and RegisterItemEntryRequest
- `src/services/stock/` — services already accept all fields

**Important implementation notes:**
- No `<form>` element wrapping — native form validation (`required` attr) is replaced by the custom `validate()` function. Remove all `required` attributes from inputs; validation is handled entirely by `validate()` + `fieldErrors` state.
- The old chevron-right animation on sidebar items is intentionally dropped in favor of the new left-border indicator (detailed variant) or pill highlight (compact variant).
- `autoFocus` on the name input should be conditional: `autoFocus={!isEditMode}` — only auto-focus on create mode.
- Submit button uses `onClick={handleSubmit}` (not `type="submit"`), since there is no `<form>`.
- Reset `sectionErrors` and `fieldErrors` to `{}` in the useEffect that resets form state when modal opens/closes.

---

## Task 1: Create NavigationWizardDialog Component

**Files:**
- Create: `src/components/ui/navigation-wizard-dialog.tsx`

**Reference:** Current `StepWizardDialog` at `src/components/ui/step-wizard-dialog.tsx` for Dialog/styling patterns.

- [ ] **Step 1: Create the component file with types and exports**

```tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavigationSection {
  id: string;
  label: string;
  icon: ReactNode;
  description?: string;
  hidden?: boolean;
}

export interface NavigationWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  variant?: 'compact' | 'detailed';
  children: ReactNode;
  footer: ReactNode;
  sectionErrors?: Record<string, boolean>;
  isPending?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NavigationWizardDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  sections,
  activeSection,
  onSectionChange,
  variant = 'detailed',
  children,
  footer,
  sectionErrors,
  isPending,
}: NavigationWizardDialogProps) {
  const visibleSections = sections.filter(s => !s.hidden);

  const handleClose = () => {
    if (!isPending) onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={val => {
        if (!val) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[1000px] max-w-[1000px] h-[600px] p-0 gap-0 overflow-hidden flex flex-col"
        onPointerDownOutside={e => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (isPending) e.preventDefault();
        }}
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-lg font-semibold leading-none">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className={cn(
              'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              isPending && 'opacity-30 cursor-not-allowed'
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <nav
            className={cn(
              'shrink-0 border-r border-border/50 p-2 space-y-1 overflow-auto',
              variant === 'compact' ? 'w-[140px]' : 'w-[180px]'
            )}
          >
            {visibleSections.map(section => {
              const isActive = activeSection === section.id;
              const hasError = sectionErrors?.[section.id];

              if (variant === 'compact') {
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => !isPending && onSectionChange(section.id)}
                    disabled={isPending}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200',
                      'text-left group relative',
                      isActive
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5',
                      isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'p-1 rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-white/50'
                      )}
                    >
                      {section.icon}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium truncate',
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {section.label}
                    </span>
                    {hasError && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              }

              // Detailed variant
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => !isPending && onSectionChange(section.id)}
                  disabled={isPending}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all duration-200',
                    'text-left group relative',
                    isActive
                      ? 'bg-blue-500/5 border-l-2 border-l-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-l-2 border-l-transparent text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5',
                    isPending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 group-hover:bg-gray-200 dark:group-hover:bg-white/15'
                    )}
                  >
                    {section.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium text-xs',
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {section.label}
                    </p>
                    {section.description && (
                      <p className="text-[10px] text-gray-500 dark:text-white/40 truncate">
                        {section.description}
                      </p>
                    )}
                  </div>
                  {hasError && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            <div className="p-6">{children}</div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 shrink-0">
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify component renders**

Run: `npm run dev` and verify no build errors. The component is not yet used anywhere — just ensure clean compilation.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/navigation-wizard-dialog.tsx
git commit -m "feat(ui): add NavigationWizardDialog reusable component

Sidebar-navigation modal with two visual variants (compact/detailed),
section error indicators, and isPending state management."
```

---

## Task 2: Rewrite VariantFormModal

**Files:**
- Rewrite: `src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/variant-form-modal.tsx`

**Changes from current implementation:**
1. Replace ad-hoc Dialog+sidebar with `NavigationWizardDialog`
2. Add new section: Aparencia (Palette) with secondary colors + pattern
3. Move color fields from Basic to Aparencia
4. Add SKU field to Informacoes
5. Hide Atributos section when template has no variant attributes
6. Implement validation UX: save always enabled, on-click validation highlights sections + fields
7. Add edit-mode population for new fields (sku, secondaryColorHex, secondaryColorPantone, pattern)
8. Fix pantone maxLength from 50 to 32

- [ ] **Step 1: Update the SectionId type and SECTIONS constant**

Change `SectionId` to include `'appearance'`:
```typescript
type SectionId = 'basic' | 'appearance' | 'pricing' | 'stock' | 'attributes';
```

Update SECTIONS array to use `NavigationSection` format with 5 entries.

- [ ] **Step 2: Update FormData interface with new fields**

Add to FormData:
```typescript
sku: string;
secondaryColorHex: string;
secondaryColorPantone: string;
pattern: string;
```

Update INITIAL_FORM with empty defaults for new fields.

- [ ] **Step 3: Update edit-mode useEffect to populate new fields**

In the `useEffect` that populates form from `variant`:
```typescript
sku: variant.sku || '',
secondaryColorHex: variant.secondaryColorHex || '',
secondaryColorPantone: variant.secondaryColorPantone || '',
pattern: variant.pattern || '',
```

- [ ] **Step 4: Update handleSubmit to include new fields in payload**

Add to cleanData object:
```typescript
sku: formData.sku.trim() || undefined,
secondaryColorHex: formData.secondaryColorHex.trim() || undefined,
secondaryColorPantone: formData.secondaryColorPantone.trim() || undefined,
pattern: (formData.pattern && formData.pattern !== 'none') ? formData.pattern : undefined,
```

- [ ] **Step 5: Add validation logic and sectionErrors state**

```typescript
const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>({});
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

const validate = useCallback((): boolean => {
  const errors: Record<string, string> = {};
  const sections: Record<string, boolean> = {};

  if (!formData.name.trim()) {
    errors.name = 'Nome é obrigatório';
    sections.basic = true;
  }

  setFieldErrors(errors);
  setSectionErrors(sections);

  if (Object.keys(errors).length > 0) {
    toast.error('Preencha os campos obrigatórios');
    // Navigate to first section with error
    const firstErrorSection = Object.keys(sections)[0] as SectionId;
    if (firstErrorSection) setActiveSection(firstErrorSection);
    return false;
  }
  return true;
}, [formData]);
```

Clear section errors when fields change:
```typescript
// In updateField, clear errors for the section containing the changed field
const updateField = useCallback(
  <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear field error
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    // Clear section error based on which section the field belongs to
    const sectionMap: Record<string, SectionId> = { name: 'basic', sku: 'basic', reference: 'basic' };
    const section = sectionMap[key as string];
    if (section) {
      setSectionErrors(prev => {
        if (!prev[section]) return prev;
        const next = { ...prev };
        delete next[section];
        return next;
      });
    }
  },
  []
);
```

- [ ] **Step 6: Replace Dialog wrapper with NavigationWizardDialog**

Replace the entire return JSX. The component should:
- Use `NavigationWizardDialog` with `variant="detailed"` (default)
- Pass `sectionErrors` and `isPending`
- Render section content as `children` based on `activeSection`
- Footer: Cancelar (outline) + Criar/Salvar (default)
- No `<form>` element — submit via `onClick={handleSubmit}` on Save button
- Remove `required` attributes from all inputs (validation handled by `validate()`)

Key structure:
```tsx
<NavigationWizardDialog
  open={open}
  onOpenChange={handleClose}
  title={isEditMode ? 'Editar Variante' : 'Nova Variante'}
  subtitle={isEditMode ? `Editando ${variant?.name}` : `Adicionar variante para ${product.name}`}
  sections={sections}
  activeSection={activeSection}
  onSectionChange={id => setActiveSection(id as SectionId)}
  sectionErrors={sectionErrors}
  isPending={isPending}
  footer={
    <>
      <Button variant="outline" onClick={handleClose} disabled={isPending}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEditMode ? 'Salvando...' : 'Criando...'}</>
         : isEditMode ? <><Save className="w-4 h-4 mr-2" />Salvar Alterações</>
         : <><Plus className="w-4 h-4 mr-2" />Criar Variante</>}
      </Button>
    </>
  }
>
  {activeSection === 'basic' && <BasicSection ... />}
  {activeSection === 'appearance' && <AppearanceSection ... />}
  {activeSection === 'pricing' && <PricingSection ... />}
  {activeSection === 'stock' && <StockSection ... />}
  {activeSection === 'attributes' && <AttributesSection ... />}
</NavigationWizardDialog>
```

- [ ] **Step 7: Create AppearanceSection component**

New section component with:
- Primary color: color picker + hex input (max 7) + pantone input (max 32)
- Secondary color: same layout as primary
- Pattern: Select with PATTERN_LABELS from variant.types.ts
- Each color row in 3-col grid (picker+hex as one unit, pantone, clear button)
- Import `PATTERN_LABELS` from `@/types/stock`

```tsx
function AppearanceSection({ formData, updateField, isPending }: SectionProps) {
  return (
    <div className="space-y-6">
      {/* Cor Primária */}
      <div className="space-y-1.5">
        <Label>Cor Primária</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.colorHex || '#000000'}
              onChange={e => updateField('colorHex', e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
              disabled={isPending}
            />
            <Input
              value={formData.colorHex}
              onChange={e => updateField('colorHex', e.target.value)}
              placeholder="#000000"
              maxLength={7}
              className="flex-1"
              disabled={isPending}
            />
            {formData.colorHex && (
              <Button type="button" variant="ghost" size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => updateField('colorHex', '')}>
                Limpar
              </Button>
            )}
          </div>
          <div className="space-y-1.5">
            <Input
              value={formData.colorPantone}
              onChange={e => updateField('colorPantone', e.target.value)}
              placeholder="Ex: PANTONE 19-4052"
              maxLength={32}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Cor Secundária */}
      <div className="space-y-1.5">
        <Label>Cor Secundária</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.secondaryColorHex || '#000000'}
              onChange={e => updateField('secondaryColorHex', e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
              disabled={isPending}
            />
            <Input
              value={formData.secondaryColorHex}
              onChange={e => updateField('secondaryColorHex', e.target.value)}
              placeholder="#000000"
              maxLength={7}
              className="flex-1"
              disabled={isPending}
            />
            {formData.secondaryColorHex && (
              <Button type="button" variant="ghost" size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => updateField('secondaryColorHex', '')}>
                Limpar
              </Button>
            )}
          </div>
          <div className="space-y-1.5">
            <Input
              value={formData.secondaryColorPantone}
              onChange={e => updateField('secondaryColorPantone', e.target.value)}
              placeholder="Ex: PANTONE 19-4052"
              maxLength={32}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Padrão */}
      <div className="space-y-1.5">
        <Label>Padrão</Label>
        <Select
          value={formData.pattern}
          onValueChange={value => updateField('pattern', value)}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um padrão..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {Object.entries(PATTERN_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Update BasicSection — remove color fields, add SKU**

- Remove colorHex, colorPantone fields (moved to AppearanceSection)
- Add SKU field alongside Name in 2-col grid
- Remove `required` from name input (validation handled by `validate()`)
- Add `autoFocus={!isEditMode}` to name input (conditional — no autofocus in edit mode)
- Keep reference, outOfLine, isActive
- Add `fieldErrors` support for name field (rose border + error message when `fieldErrors.name` is set)
- Pass `fieldErrors` to BasicSection via extended SectionProps: `fieldErrors?: Record<string, string>`

- [ ] **Step 9: Build sections array with dynamic hiding**

```typescript
const sections = useMemo(() => [
  { id: 'basic', label: 'Informações', icon: <FileText className="w-4 h-4" />, description: 'Nome, SKU, referência' },
  { id: 'appearance', label: 'Aparência', icon: <Palette className="w-4 h-4" />, description: 'Cores e padrão' },
  { id: 'pricing', label: 'Preços', icon: <DollarSign className="w-4 h-4" />, description: 'Custo, margem, venda' },
  { id: 'stock', label: 'Estoque', icon: <Package className="w-4 h-4" />, description: 'Mín, máx, reposição' },
  { id: 'attributes', label: 'Atributos', icon: <SlidersHorizontal className="w-4 h-4" />, description: 'Atributos do template', hidden: !hasAttributes },
], [hasAttributes]);
```

- [ ] **Step 10: Verify VariantFormModal renders and works**

Run `npm run dev`, navigate to a product, open "Adicionar Variante" modal. Verify:
- All 5 sections visible (or 4 if no template attributes)
- Navigation works via sidebar
- New fields (SKU, secondary colors, pattern) are editable
- Validation highlights name field when empty on Save click
- Create and Edit modes both work

- [ ] **Step 11: Commit**

```bash
git add src/app/\(dashboard\)/\(modules\)/stock/\(entities\)/products/src/modals/variant-form-modal.tsx
git commit -m "feat(stock/products): redesign VariantFormModal with NavigationWizardDialog

- Use new NavigationWizardDialog component
- Add Appearance section with secondary colors and pattern
- Add SKU field to Informacoes section
- Implement on-click validation with section error indicators
- Hide Attributes section when template has no variant attributes
- Fix pantone maxLength from 50 to 32"
```

---

## Task 3: Rewrite ItemEntryFormModal

**Files:**
- Rewrite: `src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/item-entry-form-modal.tsx`

**Changes from current implementation:**
1. Replace ad-hoc Dialog+sidebar with `NavigationWizardDialog`
2. Add uniqueCode field to Rastreabilidade section
3. Hide Atributos section when template has no item attributes
4. Implement validation UX (save always enabled, on-click validation)

- [ ] **Step 1: Update FormData and INITIAL_FORM**

Add `uniqueCode: string` to FormData interface and `''` default to INITIAL_FORM.

- [ ] **Step 2: Add validation logic and sectionErrors state**

```typescript
const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>({});
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

const validate = useCallback((): boolean => {
  const errors: Record<string, string> = {};
  const sections: Record<string, boolean> = {};

  if (!formData.binId) {
    errors.binId = 'Localização é obrigatória';
    sections.entry = true;
  }
  if (parsedQuantity <= 0) {
    errors.quantity = 'Quantidade inválida';
    sections.entry = true;
  }

  setFieldErrors(errors);
  setSectionErrors(sections);

  if (Object.keys(errors).length > 0) {
    toast.error('Preencha os campos obrigatórios');
    const firstErrorSection = Object.keys(sections)[0] as SectionId;
    if (firstErrorSection) setActiveSection(firstErrorSection);
    return false;
  }
  return true;
}, [formData, parsedQuantity]);
```

- [ ] **Step 3: Update handleSubmit to use validate() and include uniqueCode**

Replace the manual validation at the start of handleSubmit with `if (!validate()) return;`

Add to createData:
```typescript
uniqueCode: formData.uniqueCode.trim() || undefined,
```

- [ ] **Step 4: Replace Dialog wrapper with NavigationWizardDialog**

Same pattern as VariantFormModal. **Important:** The current submit button has `disabled={isPending || !formData.binId}` — change to just `disabled={isPending}` since validation is now handled by `validate()` on click.

Remove `required` attributes from all inputs. No `<form>` element.

```tsx
<NavigationWizardDialog
  open={open}
  onOpenChange={handleClose}
  title="Registrar Entrada"
  subtitle={`Adicionar item para ${variant.name}`}
  sections={sections}
  activeSection={activeSection}
  onSectionChange={id => setActiveSection(id as SectionId)}
  sectionErrors={sectionErrors}
  isPending={isPending}
  footer={
    <>
      <Button variant="outline" onClick={handleClose} disabled={isPending}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrando...</>
         : <><Plus className="w-4 h-4 mr-2" />Registrar Entrada</>}
      </Button>
    </>
  }
>
  {activeSection === 'entry' && <EntrySection ... />}
  {activeSection === 'costs' && <CostsSection ... />}
  {activeSection === 'batch' && <BatchSection ... />}
  {activeSection === 'attributes' && <AttributesSection ... />}
</NavigationWizardDialog>
```

- [ ] **Step 5: Add uniqueCode field to BatchSection**

Add at the top of BatchSection, before the Lote/NF grid:
```tsx
{/* Código Único */}
<div className="space-y-1.5">
  <Label htmlFor="ief-uniqueCode">Código Único</Label>
  <Input
    id="ief-uniqueCode"
    value={formData.uniqueCode}
    onChange={e => updateField('uniqueCode', e.target.value)}
    placeholder="Código de identificação próprio (opcional)"
    maxLength={128}
    disabled={isPending}
  />
  <p className="text-xs text-muted-foreground">
    Número de série, código de patrimônio ou identificador interno
  </p>
</div>
```

- [ ] **Step 6: Build sections array with dynamic hiding**

```typescript
const sections = useMemo(() => [
  { id: 'entry', label: 'Entrada', icon: <Package className="w-4 h-4" />, description: 'Tipo, local, quantidade' },
  { id: 'costs', label: 'Custos', icon: <DollarSign className="w-4 h-4" />, description: 'Preço de custo' },
  { id: 'batch', label: 'Rastreabilidade', icon: <CalendarDays className="w-4 h-4" />, description: 'Lote, validade, NF' },
  { id: 'attributes', label: 'Atributos', icon: <SlidersHorizontal className="w-4 h-4" />, description: 'Atributos do template', hidden: !hasAttributes },
], [hasAttributes]);
```

- [ ] **Step 7: Verify ItemEntryFormModal renders and works**

Run `npm run dev`, navigate to a product, open variant management, select a variant, click "Registrar Entrada". Verify:
- All sections visible (3 or 4 depending on template)
- uniqueCode field visible in Rastreabilidade
- Validation highlights binId/quantity when missing on Save click
- Entry submits correctly

- [ ] **Step 8: Commit**

```bash
git add src/app/\(dashboard\)/\(modules\)/stock/\(entities\)/products/src/modals/item-entry-form-modal.tsx
git commit -m "feat(stock/products): redesign ItemEntryFormModal with NavigationWizardDialog

- Use new NavigationWizardDialog component
- Add uniqueCode field to Rastreabilidade section
- Implement on-click validation with section error indicators
- Hide Attributes section when template has no item attributes"
```

---

## Task 4: Final Verification

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Fix any TypeScript/build errors.

- [ ] **Step 3: Manual smoke test**

Test these flows:
1. Create a new variant (all 5 sections, save validation)
2. Edit an existing variant (all fields populated, save)
3. Register item entry (all 4 sections, validation, uniqueCode)
4. Open variant modal from ProductVariantsItemsModal (ensure integration still works)
5. Test with a template that has no custom attributes (Attributes section should be hidden)

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "fix: lint and build fixes for NavigationWizardDialog redesign"
```
