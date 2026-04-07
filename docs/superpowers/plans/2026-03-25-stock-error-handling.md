# Stock Module Error Handling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add error handling (FormErrorIcon + useFormErrorHandler + fieldMap) to all Stock module forms without migrating form libraries or breaking existing functionality.

**Architecture:** Additive-only approach — we wrap existing `try/catch` blocks with `useFormErrorHandler`, add `FormErrorIcon` next to fields that can error, and add `aria-invalid` for visual feedback. No useState→react-hook-form migration. No structural changes to wizards/modals.

**Tech Stack:** FormErrorIcon, useFormErrorHandler, translateError, t() i18n, aria-invalid CSS, existing useState forms

**Study reference:** `docs/studies/stock-module-error-handling-migration.md`

---

## File Structure

All changes are modifications to existing files. No new files created.

**Fase 1 — Low Risk (simple forms, 1-3 fields):**

- `stock/(entities)/tags/src/modals/create-modal.tsx`
- `stock/(entities)/product-categories/src/modals/create-modal.tsx`
- `stock/(entities)/locations/src/modals/create-zone-modal.tsx`
- `stock/(entities)/templates/src/components/quick-create-form.tsx`

**Fase 2 — Medium Risk (multi-field forms):**

- `stock/(entities)/products/src/components/edit-product-form.tsx`
- `stock/(entities)/manufacturers/src/modals/create-manufacturer-wizard.tsx`

**Fase 3 — High Risk (complex wizards, touch minimally):**

- `stock/(entities)/products/src/modals/variant-form-modal.tsx`
- `stock/(entities)/products/src/modals/item-entry-form-modal.tsx`

Base path: `src/app/(dashboard)/(modules)/`

---

## FASE 1: Low Risk Forms

### Task 1: Tag CreateModal — add error handling

**Files:**

- Modify: `stock/(entities)/tags/src/modals/create-modal.tsx`

The pattern for all Fase 1 forms is identical:

1. Add a `fieldErrors` state object
2. Wrap `onSubmit` catch to parse error and set field errors
3. Add `FormErrorIcon` next to fields that can have errors
4. Add `aria-invalid` on inputs with errors
5. Replace `text-red-500` with `text-[rgb(var(--color-destructive))]`

- [ ] **Step 1: Add imports and error state**

Add to imports:

```tsx
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { translateError } from '@/lib/error-messages';
```

Add state after `isSubmitting`:

```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

- [ ] **Step 2: Update catch block to map API errors**

Replace the catch block:

```tsx
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  // Map API errors to fields
  if (msg.includes('name already exists') || msg.includes('tag with this name')) {
    setFieldErrors({ name: translateError(msg) });
  } else if (msg.includes('Color must be')) {
    setFieldErrors({ color: translateError(msg) });
  } else {
    toast.error(translateError(msg));
  }
}
```

Add `import { toast } from 'sonner';` if not present.

- [ ] **Step 3: Add FormErrorIcon to name field**

Wrap the name Input in a `relative` div and add FormErrorIcon:

```tsx
<div className="relative">
  <Input
    id="name"
    value={formData.name}
    onChange={e => {
      setFormData({ ...formData, name: e.target.value });
      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
    }}
    placeholder="Ex: Novo, Em Promoção, Destaque"
    required
    aria-invalid={!!fieldErrors.name}
  />
  {fieldErrors.name && <FormErrorIcon message={fieldErrors.name} />}
</div>
```

- [ ] **Step 4: Add FormErrorIcon to color field**

Wrap the hex text Input (not the color picker) and add error:

```tsx
<Input
  type="text"
  value={formData.color}
  onChange={e => {
    setFormData({ ...formData, color: e.target.value });
    if (fieldErrors.color) setFieldErrors(prev => ({ ...prev, color: '' }));
  }}
  placeholder="#3b82f6"
  className="flex-1 font-mono"
  aria-invalid={!!fieldErrors.color}
/>;
{
  fieldErrors.color && (
    <FormErrorIcon
      message={fieldErrors.color}
      className="right-3 top-1/2 -translate-y-1/2"
    />
  );
}
```

Note: The color Input uses `type="color"` which renders a native picker — FormErrorIcon only on the text hex input.

- [ ] **Step 5: Replace `text-red-500` with rose**

Replace the required asterisk color:

```tsx
<span className="text-[rgb(var(--color-destructive))]">*</span>
```

- [ ] **Step 6: Clear errors on modal close**

In the reset logic (after successful submit), add:

```tsx
setFieldErrors({});
```

- [ ] **Step 7: TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | grep "tags" | head -5`
Expected: No errors from this file.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(dashboard)/(modules)/stock/(entities)/tags/src/modals/create-modal.tsx"
git commit -m "feat(stock): add error handling to tag create modal"
```

---

### Task 2: Category CreateModal — add error handling

**Files:**

- Modify: `stock/(entities)/product-categories/src/modals/create-modal.tsx`

- [ ] **Step 1: Add imports and error state**

```tsx
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { translateError } from '@/lib/error-messages';
import { toast } from 'sonner';
```

Add state:

```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

- [ ] **Step 2: Update catch block**

```tsx
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('name already exists') || msg.includes('category with this name')) {
    setFieldErrors({ name: translateError(msg) });
  } else if (msg.includes('cannot be its own parent') || msg.includes('circular')) {
    setFieldErrors({ parentId: translateError(msg) });
  } else {
    toast.error(translateError(msg));
  }
}
```

- [ ] **Step 3: Add FormErrorIcon to name field**

Wrap name Input in relative div:

```tsx
<div className="relative">
  <Input
    id="wizard-name"
    placeholder="Ex: Eletrônicos, Roupas, Alimentos..."
    value={name}
    onChange={e => {
      setName(e.target.value);
      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
    }}
    onKeyDown={e => {
      /* existing handler */
    }}
    autoFocus
    className="h-11"
    aria-invalid={!!fieldErrors.name}
  />
  {fieldErrors.name && <FormErrorIcon message={fieldErrors.name} />}
</div>
```

- [ ] **Step 4: Replace `text-red-500` with rose, clear errors on close**

```tsx
<span className="text-[rgb(var(--color-destructive))]">*</span>
```

In the `useEffect` that resets on `!isOpen`, add:

```tsx
setFieldErrors({});
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/(modules)/stock/(entities)/product-categories/src/modals/create-modal.tsx"
git commit -m "feat(stock): add error handling to category create modal"
```

---

### Task 3: Zone CreateModal — add error handling

**Files:**

- Modify: `stock/(entities)/locations/src/modals/create-zone-modal.tsx`

- [ ] **Step 1: Add imports and error state**

```tsx
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { translateError } from '@/lib/error-messages';
```

Add state:

```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

- [ ] **Step 2: Update catch block in handleCreate**

Replace:

```tsx
} catch {
  toast.error('Erro ao criar zona. Tente novamente.');
}
```

With:

```tsx
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('code already exists') || msg.includes('zone with this code')) {
    setFieldErrors({ code: translateError(msg) });
  } else {
    toast.error(translateError(msg));
  }
}
```

- [ ] **Step 3: Add FormErrorIcon to code field**

Wrap code Input:

```tsx
<div className="relative">
  <Input
    id="zone-code"
    value={code}
    onChange={e => {
      handleCodeChange(e.target.value);
      if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
    }}
    placeholder="Ex: EST"
    maxLength={5}
    className="uppercase font-mono"
    aria-invalid={!!fieldErrors.code}
  />
  {fieldErrors.code && <FormErrorIcon message={fieldErrors.code} />}
</div>
```

- [ ] **Step 4: Clear errors on handleClose**

Add to handleClose:

```tsx
setFieldErrors({});
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/(modules)/stock/(entities)/locations/src/modals/create-zone-modal.tsx"
git commit -m "feat(stock): add error handling to zone create modal"
```

---

### Task 4: Template QuickCreateForm — add error handling

**Files:**

- Modify: `stock/(entities)/templates/src/components/quick-create-form.tsx`

- [ ] **Step 1: Add imports and error state**

```tsx
import { FormErrorIcon } from '@/components/ui/form-error-icon';
```

Add state:

```tsx
const [nameError, setNameError] = useState('');
```

- [ ] **Step 2: Add error prop to component interface**

The QuickCreateForm calls `onSubmit` which is handled by parent. The parent catches errors. So we need to expose an `error` prop or handle inside.

Since `onSubmit` is sync (parent handles async), we add an `error` optional prop:

```tsx
interface QuickCreateFormProps {
  onBack: () => void;
  onSubmit: (data: { name: string; unitOfMeasure: UnitOfMeasure }) => void;
  error?: string; // API error from parent
}
```

- [ ] **Step 3: Display error on name field when parent passes error**

```tsx
const displayError =
  error?.includes('name already exists') ||
  error?.includes('Template with this name')
    ? error
    : '';

<div className="relative">
  <Input
    id="template-name"
    ref={inputRef}
    placeholder="Ex: Eletrônicos, Roupas, Alimentos..."
    value={name}
    onChange={e => setName(e.target.value)}
    required
    className="h-11"
    aria-invalid={!!displayError}
  />
  {displayError && <FormErrorIcon message={displayError} />}
</div>;
```

- [ ] **Step 4: Replace `text-red-500` with rose**

```tsx
<span className="text-[rgb(var(--color-destructive))]">*</span>
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/(modules)/stock/(entities)/templates/src/components/quick-create-form.tsx"
git commit -m "feat(stock): add error handling to template quick create form"
```

---

### Task 5: TypeScript check + integration test Fase 1

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -v "sales\|ai/" | head -20`
Expected: No new errors from stock files.

- [ ] **Step 2: Commit all Fase 1 together (if not already committed individually)**

```bash
# Already committed per task — this is just verification
git log --oneline -4
```

---

## FASE 2: Medium Risk Forms

### Task 6: EditProductForm — add error handling

**Files:**

- Modify: `stock/(entities)/products/src/components/edit-product-form.tsx`

- [ ] **Step 1: Add imports and error state**

```tsx
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { translateError } from '@/lib/error-messages';
import { toast } from 'sonner';
```

Add state:

```tsx
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

- [ ] **Step 2: Wrap handleSubmit with error handling**

The current handleSubmit calls `onSubmit` but has NO try/catch. The parent handles errors. We need to add try/catch here:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setFieldErrors({});
  try {
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      manufacturerId: manufacturerId || undefined,
      categoryIds: categoryId ? [categoryId] : [],
      outOfLine,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('name already exists') ||
      msg.includes('Product with this name')
    ) {
      setFieldErrors({ name: translateError(msg) });
    } else if (msg.includes('Name must be at most')) {
      setFieldErrors({ name: translateError(msg) });
    } else {
      toast.error(translateError(msg));
    }
  }
};
```

- [ ] **Step 3: Add FormErrorIcon to name field**

```tsx
<div className="relative">
  <Input
    id="name"
    value={name}
    onChange={e => {
      setName(e.target.value);
      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
    }}
    placeholder="Ex: Tecido Denim Santista"
    required
    disabled={isSubmitting}
    autoFocus
    aria-invalid={!!fieldErrors.name}
  />
  {fieldErrors.name && <FormErrorIcon message={fieldErrors.name} />}
</div>
```

- [ ] **Step 4: Replace `text-red-500` with rose**

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/(modules)/stock/(entities)/products/src/components/edit-product-form.tsx"
git commit -m "feat(stock): add error handling to edit product form"
```

---

### Task 7: CreateManufacturerWizard — enhance existing error handling

**Files:**

- Modify: `stock/(entities)/manufacturers/src/modals/create-manufacturer-wizard.tsx`

This form already has good error handling for CNPJ (duplicate check, format validation, rose alerts). We only need to:

- [ ] **Step 1: Add FormErrorIcon to name field in manual flow**

The manual flow Step 2 has a `name` input. Add error handling for duplicate name:

Add state:

```tsx
const [nameError, setNameError] = useState('');
```

In the manual flow submit handler catch, map name errors:

```tsx
if (
  msg.includes('name already exists') ||
  msg.includes('Manufacturer with this name')
) {
  setNameError(translateError(msg));
  return;
}
```

Wrap name input:

```tsx
<div className="relative">
  <Input
    id="manual-name"
    value={manualName}
    onChange={e => {
      setManualName(e.target.value);
      if (nameError) setNameError('');
    }}
    placeholder="Nome Fantasia"
    aria-invalid={!!nameError}
  />
  {nameError && <FormErrorIcon message={nameError} />}
</div>
```

- [ ] **Step 2: Add FormErrorIcon import**

```tsx
import { FormErrorIcon } from '@/components/ui/form-error-icon';
```

- [ ] **Step 3: Clear nameError on flow change/close**

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/(modules)/stock/(entities)/manufacturers/src/modals/create-manufacturer-wizard.tsx"
git commit -m "feat(stock): add error handling to manufacturer create wizard"
```

---

## FASE 3: High Risk Forms (Minimal Touch)

### Task 8: VariantFormModal — add FormErrorIcon to existing fieldErrors

**Files:**

- Modify: `stock/(entities)/products/src/modals/variant-form-modal.tsx`

This form ALREADY has `fieldErrors` state and displays errors below fields in rose. We change the display method from inline text to FormErrorIcon tooltip.

- [ ] **Step 1: Add FormErrorIcon import**

```tsx
import { FormErrorIcon } from '@/components/ui/form-error-icon';
```

- [ ] **Step 2: Replace inline error text with FormErrorIcon for name field**

Find the name field error display (something like):

```tsx
{
  fieldErrors.name && (
    <p className="text-xs text-rose-500">{fieldErrors.name}</p>
  );
}
```

Replace with FormErrorIcon inside the name input's relative wrapper:

```tsx
{
  fieldErrors.name && <FormErrorIcon message={fieldErrors.name} />;
}
```

Add `aria-invalid={!!fieldErrors.name}` to the Input.

- [ ] **Step 3: Update onError of mutation to use fieldMap pattern**

In the mutation `onError`, map API errors to field names:

```tsx
onError: error => {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('SKU already exists')) {
    setFieldErrors(prev => ({ ...prev, sku: translateError(msg) }));
  } else if (msg.includes('Price cannot be negative')) {
    setFieldErrors(prev => ({
      ...prev,
      definedSalePrice: translateError(msg),
    }));
  } else if (msg.includes('Min stock cannot be greater')) {
    setFieldErrors(prev => ({ ...prev, minStock: translateError(msg) }));
  } else if (msg.includes('Color hex must be')) {
    setFieldErrors(prev => ({ ...prev, colorHex: translateError(msg) }));
  } else {
    toast.error(translateError(msg));
  }
};
```

- [ ] **Step 4: Add aria-invalid to SKU field**

```tsx
aria-invalid={!!fieldErrors.sku}
```

- [ ] **Step 5: Verify no structural changes**

Ensure: same useState, same sections, same navigation, same submit flow. ONLY error display changed.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/variant-form-modal.tsx"
git commit -m "feat(stock): enhance error handling in variant form modal"
```

---

### Task 9: ItemEntryFormModal — add error mapping to existing catch

**Files:**

- Modify: `stock/(entities)/products/src/modals/item-entry-form-modal.tsx`

This form already has `sectionErrors` and field validation. We only enhance the API error catch.

- [ ] **Step 1: Add imports**

```tsx
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { translateError } from '@/lib/error-messages';
```

- [ ] **Step 2: Enhance onError to translate messages**

In the mutation onError, replace generic message with translated:

```tsx
onError: error => {
  toast.error(
    translateError(
      error instanceof Error ? error.message : 'Erro ao registrar entrada'
    )
  );
};
```

- [ ] **Step 3: Add aria-invalid to quantity and binId fields (if applicable)**

Add `aria-invalid` to fields that have error states already.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/item-entry-form-modal.tsx"
git commit -m "feat(stock): enhance error handling in item entry form modal"
```

---

### Task 10: Final verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -v "sales\|ai/" | head -20`
Expected: No new errors.

- [ ] **Step 2: Review all changes**

```bash
git log --oneline -8
git diff HEAD~8 --stat
```

Verify: only stock module files changed, no unrelated files.

- [ ] **Step 3: Final commit (if any cleanup needed)**

---

## Safety Checklist (verify after each task)

For each modified form:

- [ ] No useState→react-hook-form migration
- [ ] No structural changes to wizard steps/sections
- [ ] No changes to submit data shape
- [ ] No changes to success flow (toast, invalidation, close)
- [ ] `FormErrorIcon` only added where `fieldErrors` state exists
- [ ] `aria-invalid` only added to inputs that can have errors
- [ ] Error state clears when user types in the field
- [ ] Error state clears when modal closes/resets
- [ ] All user-facing text in Portuguese
- [ ] Color asterisks use `--color-destructive` (rose), not `red-500`
