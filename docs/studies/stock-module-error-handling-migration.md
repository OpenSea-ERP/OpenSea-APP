# Estudo: Migracaoado Error Handling — Modulo Stock

**Data:** 2026-03-25
**Objetivo:** Mapear todos os campos que precisam de validacao, identificar riscos, e definir o plano de migracao sem quebrar nada.

---

## 1. Inventario de Formularios (16 formularios)

| #   | Entidade     | Arquivo                          | Tipo                         | Lib Atual             | Risco           |
| --- | ------------ | -------------------------------- | ---------------------------- | --------------------- | --------------- |
| 1   | Product      | `create-product-wizard.tsx`      | StepWizardDialog (3 steps)   | useState              | Medio           |
| 2   | Product      | `create-product-form.tsx`        | 2-step carousel              | useState              | Medio           |
| 3   | Product      | `edit-product-form.tsx`          | Modal form                   | useState              | Baixo           |
| 4   | Variant      | `variant-form-modal.tsx`         | NavigationWizard (5 secoes)  | useState              | **Alto**        |
| 5   | Item Entry   | `item-entry-form-modal.tsx`      | NavigationWizard (4 secoes)  | useState              | **Alto**        |
| 6   | Quick Add    | `quick-add-modal.tsx`            | Dialog                       | react-hook-form + zod | **Ja adequado** |
| 7   | Item Exit    | `exit-items-modal.tsx`           | Dialog                       | useState              | Baixo           |
| 8   | Manufacturer | `create-manufacturer-wizard.tsx` | StepWizardDialog (dual flow) | useState              | Medio           |
| 9   | Manufacturer | `create-modal.tsx`               | EntityForm Dialog            | EntityForm            | Baixo           |
| 10  | Category     | `create-modal.tsx`               | StepWizardDialog             | useState              | Baixo           |
| 11  | Tag          | `create-modal.tsx`               | Dialog                       | useState              | Baixo           |
| 12  | Template     | `template-form.tsx`              | Complex form + ref           | useRef/useState       | **Alto**        |
| 13  | Template     | `quick-create-form.tsx`          | Simple form                  | useState              | Baixo           |
| 14  | Location     | `location-setup-wizard.tsx`      | StepWizardDialog (3 steps)   | useState              | Medio           |
| 15  | Zone         | `create-zone-modal.tsx`          | StepWizardDialog             | useState              | Baixo           |
| 16  | Bin Move     | `bin-relocation-wizard.tsx`      | StepWizardDialog             | useState              | Baixo           |

**Legenda de risco:**

- **Ja adequado** = Ja usa react-hook-form + zod, so precisa adicionar FormErrorIcon
- **Baixo** = Formulario simples, poucos campos, migracao trivial
- **Medio** = Multiplos steps/campos, requer cuidado mas sem logica complexa
- **Alto** = Muitos campos, logica de negocio complexa, multiplas secoes, imperative API

---

## 2. Mapeamento Completo de Campos por Formulario

### 2.1 CreateProductWizard

| Campo            | Tipo    | Obrigatorio | Unico                | Validacao Atual          | Validacao Necessaria           |
| ---------------- | ------- | ----------- | -------------------- | ------------------------ | ------------------------------ |
| `templateId`     | select  | Sim         | Nao                  | Selecao obrigatoria      | Manter                         |
| `manufacturerId` | select  | Sim         | Nao                  | Selecao obrigatoria      | Manter                         |
| `name`           | text    | Sim         | **Sim (por tenant)** | `name.trim().length > 0` | + `useUniquenessCheck` on blur |
| `categoryId`     | select  | Nao         | Nao                  | Nenhuma                  | Manter                         |
| `attributes`     | dynamic | Parcial     | Nao                  | Template required check  | Manter                         |

**Erros da API:**

- `"Product with this name already exists"` → campo `name`
- `"Template not found"` → campo `templateId`
- `"Manufacturer not found"` → campo `manufacturerId`

---

### 2.2 CreateProductForm (carousel)

Mesmos campos que o Wizard. Mesma migracao.

---

### 2.3 EditProductForm

| Campo            | Tipo     | Obrigatorio | Unico   | Validacao Atual | Validacao Necessaria                  |
| ---------------- | -------- | ----------- | ------- | --------------- | ------------------------------------- |
| `name`           | text     | Sim         | **Sim** | `name.trim()`   | + `useUniquenessCheck` (excluir self) |
| `manufacturerId` | combobox | Nao         | Nao     | Nenhuma         | Manter                                |
| `categoryId`     | combobox | Nao         | Nao     | Nenhuma         | Manter                                |
| `description`    | textarea | Nao         | Nao     | Nenhuma         | Max 1000 chars                        |
| `outOfLine`      | switch   | Nao         | Nao     | Nenhuma         | Manter                                |

**Erros da API:**

- `"Product with this name already exists"` → campo `name`
- `"Name must be at most 200 characters long"` → campo `name`

---

### 2.4 VariantFormModal (COMPLEXO — 5 secoes, 20+ campos)

#### Secao: Informacoes

| Campo       | Tipo   | Obrigatorio | Unico   | Validacao Atual | Validacao Necessaria           |
| ----------- | ------ | ----------- | ------- | --------------- | ------------------------------ |
| `name`      | text   | Sim         | Nao     | `name.trim()`   | + i18n message                 |
| `sku`       | text   | Nao         | **Sim** | Max 64 chars    | + `useUniquenessCheck` on blur |
| `reference` | text   | Nao         | Nao     | Max 128 chars   | Manter                         |
| `outOfLine` | switch | Nao         | Nao     | Nenhuma         | Manter                         |
| `isActive`  | switch | Nao         | Nao     | Nenhuma         | Manter                         |

#### Secao: Aparencia

| Campo                   | Tipo   | Obrigatorio | Unico | Validacao Atual | Validacao Necessaria      |
| ----------------------- | ------ | ----------- | ----- | --------------- | ------------------------- |
| `pattern`               | select | Nao         | Nao   | Nenhuma         | Manter                    |
| `colorHex`              | color  | Nao         | Nao   | Nenhuma         | Regex `^#[0-9A-Fa-f]{6}$` |
| `colorPantone`          | text   | Nao         | Nao   | Nenhuma         | Max 32 chars              |
| `secondaryColorHex`     | color  | Nao         | Nao   | Nenhuma         | Regex                     |
| `secondaryColorPantone` | text   | Nao         | Nao   | Nenhuma         | Max 32 chars              |

#### Secao: Precos

| Campo                 | Tipo   | Obrigatorio | Unico | Validacao Atual | Validacao Necessaria |
| --------------------- | ------ | ----------- | ----- | --------------- | -------------------- |
| `informedCostPrice`   | money  | Nao         | Nao   | Nenhuma         | >= 0                 |
| `profitMarginPercent` | number | Nao         | Nao   | Nenhuma         | 0-100                |
| `definedSalePrice`    | money  | Nao         | Nao   | Nenhuma         | >= 0                 |

#### Secao: Estoque

| Campo             | Tipo   | Obrigatorio | Unico | Validacao Atual | Validacao Necessaria |
| ----------------- | ------ | ----------- | ----- | --------------- | -------------------- |
| `minStock`        | number | Nao         | Nao   | Nenhuma         | >= 0, <= maxStock    |
| `maxStock`        | number | Nao         | Nao   | Nenhuma         | >= 0, >= minStock    |
| `reorderPoint`    | number | Nao         | Nao   | Nenhuma         | >= 0                 |
| `reorderQuantity` | number | Nao         | Nao   | Nenhuma         | >= 0                 |

#### Secao: Atributos

| Campo           | Tipo    | Obrigatorio | Unico | Validacao Atual   | Validacao Necessaria |
| --------------- | ------- | ----------- | ----- | ----------------- | -------------------- |
| `attributes[*]` | dynamic | Condicional | Nao   | Template required | Manter               |

**Erros da API:**

- `"SKU already exists"` → campo `sku`
- `"Price cannot be negative"` → campo price-related
- `"Min stock cannot be greater than max stock"` → campos `minStock`/`maxStock`
- `"Color hex must be in format #RRGGBB"` → campo `colorHex`
- `"Name is required"` → campo `name`

**SectionErrorBadge:** Usar nos 5 headers de secao para mostrar contagem de erros por secao.

---

### 2.5 ItemEntryFormModal (4 secoes)

#### Secao: Variante (condicional)

| Campo       | Tipo          | Obrigatorio                  | Unico | Validacao Atual     | Validacao Necessaria |
| ----------- | ------------- | ---------------------------- | ----- | ------------------- | -------------------- |
| `variantId` | search+select | Sim (se nao pre-selecionado) | Nao   | Selecao obrigatoria | Manter               |

#### Secao: Entrada

| Campo           | Tipo            | Obrigatorio | Unico | Validacao Atual   | Validacao Necessaria |
| --------------- | --------------- | ----------- | ----- | ----------------- | -------------------- |
| `entryType`     | radio           | Sim         | Nao   | Default PURCHASE  | Manter               |
| `binId`         | bin selector    | Sim         | Nao   | Obrigatorio       | + i18n message       |
| `quantity`      | number (string) | Sim         | Nao   | `> 0`             | + number format      |
| `attributes[*]` | dynamic         | Condicional | Nao   | Template required | Manter               |

#### Secao: Custos

| Campo      | Tipo  | Obrigatorio | Unico | Validacao Atual | Validacao Necessaria |
| ---------- | ----- | ----------- | ----- | --------------- | -------------------- |
| `unitCost` | money | Nao         | Nao   | Nenhuma         | >= 0                 |

#### Secao: Rastreabilidade

| Campo               | Tipo     | Obrigatorio | Unico | Validacao Atual | Validacao Necessaria |
| ------------------- | -------- | ----------- | ----- | --------------- | -------------------- |
| `batchNumber`       | text     | Nao         | Nao   | Nenhuma         | Manter               |
| `manufacturingDate` | date     | Nao         | Nao   | Nenhuma         | <= hoje              |
| `expiryDate`        | date     | Nao         | Nao   | Nenhuma         | > manufacturingDate  |
| `invoiceNumber`     | text     | Nao         | Nao   | Nenhuma         | Manter               |
| `uniqueCode`        | text     | Nao         | Nao   | Nenhuma         | Manter               |
| `notes`             | textarea | Nao         | Nao   | Nenhuma         | Manter               |

---

### 2.6 QuickAddModal (JA USA react-hook-form + zod)

**Status:** Ja adequado. So precisa:

- Trocar `FormMessage` por `FormErrorIcon` (tooltip em vez de inline)
- Adicionar `useFormErrorHandler` no onError da mutation

---

### 2.7 CreateManufacturerWizard (dual flow)

| Campo         | Tipo          | Obrigatorio | Unico   | Validacao Atual     | Validacao Necessaria   |
| ------------- | ------------- | ----------- | ------- | ------------------- | ---------------------- |
| `cnpj`        | text (masked) | Nao         | **Sim** | Formato + API check | Manter (ja bom)        |
| `name`        | text          | Sim         | **Sim** | `name.trim()`       | + `useUniquenessCheck` |
| `legalName`   | text          | Nao         | Nao     | Nenhuma             | Max 256 chars          |
| `countryCode` | select        | Sim         | Nao     | Required            | Manter                 |
| `email`       | text          | Nao         | Nao     | Nenhuma             | Formato email          |
| `phone`       | text          | Nao         | Nao     | Nenhuma             | Formato telefone       |

**Erros da API:**

- `"Manufacturer with this name already exists"` → campo `name`
- `"Invalid email format"` → campo `email`
- `"Name is required"` → campo `name`

---

### 2.8 CategoryCreateModal

| Campo      | Tipo     | Obrigatorio | Unico             | Validacao Atual | Validacao Necessaria   |
| ---------- | -------- | ----------- | ----------------- | --------------- | ---------------------- |
| `name`     | text     | Sim         | **Sim (por pai)** | `name.trim()`   | + `useUniquenessCheck` |
| `parentId` | combobox | Nao         | Nao               | Nenhuma         | Manter                 |

**Erros da API:**

- `"A category with this name already exists"` → campo `name`
- `"A category cannot be its own parent"` → campo `parentId`
- `"Parent would create circular dependency"` → campo `parentId`

---

### 2.9 TagCreateModal

| Campo         | Tipo         | Obrigatorio | Unico   | Validacao Atual | Validacao Necessaria   |
| ------------- | ------------ | ----------- | ------- | --------------- | ---------------------- |
| `name`        | text         | Sim         | **Sim** | Required attr   | + `useUniquenessCheck` |
| `description` | textarea     | Nao         | Nao     | Nenhuma         | Max 500 chars          |
| `color`       | color picker | Nao         | Nao     | Default hex     | Regex hex valido       |

**Erros da API:**

- `"A tag with this name already exists"` → campo `name`
- `"Color must be a valid hex color code"` → campo `color`

---

### 2.10 TemplateForm (COMPLEXO)

| Campo                        | Tipo     | Obrigatorio | Unico              | Validacao Atual | Validacao Necessaria              |
| ---------------------------- | -------- | ----------- | ------------------ | --------------- | --------------------------------- |
| `name`                       | text     | Sim         | **Sim**            | Ref-based       | + `useUniquenessCheck`            |
| `unitOfMeasure`              | select   | Sim         | Nao                | Required        | Manter                            |
| `iconUrl`                    | text     | Nao         | Nao                | Nenhuma         | Max 512, URL format               |
| `productAttributes[*].label` | text     | Sim         | **Sim (no grupo)** | Nenhuma         | Duplicata check                   |
| `variantAttributes[*].label` | text     | Sim         | **Sim (no grupo)** | Nenhuma         | Duplicata check                   |
| `itemAttributes[*].label`    | text     | Sim         | **Sim (no grupo)** | Nenhuma         | Duplicata check                   |
| `attributes[*].options`      | textarea | Condicional | Nao                | Nenhuma         | Pelo menos 1 opcao se type=select |

**Erros da API:**

- `"Template with this name already exists"` (P2002) → campo `name`
- `"Invalid unit of measure"` → campo `unitOfMeasure`

---

### 2.11 LocationSetupWizard

#### Step 1 — Warehouse

| Campo                  | Tipo             | Obrigatorio | Unico   | Validacao Atual | Validacao Necessaria             |
| ---------------------- | ---------------- | ----------- | ------- | --------------- | -------------------------------- |
| `warehouseCode`        | text (uppercase) | Sim         | **Sim** | 5 chars         | 2-5 chars + `useUniquenessCheck` |
| `warehouseName`        | text             | Sim         | Nao     | Required        | Manter                           |
| `warehouseDescription` | textarea         | Nao         | Nao     | Nenhuma         | Max 500 chars                    |

#### Step 2 — Zones (array)

| Campo           | Tipo             | Obrigatorio | Unico                  | Validacao Atual | Validacao Necessaria       |
| --------------- | ---------------- | ----------- | ---------------------- | --------------- | -------------------------- |
| `zones[n].code` | text (uppercase) | Sim         | **Sim (no warehouse)** | 2-5 chars       | Duplicata check intra-form |
| `zones[n].name` | text             | Sim         | Nao                    | Required        | Manter                     |

#### Step 3 — Structure (por zona)

| Campo          | Tipo   | Obrigatorio | Unico | Validacao Atual | Validacao Necessaria |
| -------------- | ------ | ----------- | ----- | --------------- | -------------------- |
| `aisles`       | number | Sim         | Nao   | Nenhuma         | >= 1, <= 99          |
| `shelves`      | number | Sim         | Nao   | Nenhuma         | >= 1, <= 999         |
| `binsPerShelf` | number | Sim         | Nao   | Nenhuma         | >= 1, <= 26          |

**Erros da API:**

- `"A warehouse with this code already exists"` → campo `warehouseCode`
- `"A zone with this code already exists in this warehouse"` → campo `zones[n].code`
- `"Configuration would create N bins. Maximum is 10,000 bins per zone"` → secao structure

---

### 2.12 CreateZoneModal

| Campo  | Tipo             | Obrigatorio | Unico                  | Validacao Atual | Validacao Necessaria   |
| ------ | ---------------- | ----------- | ---------------------- | --------------- | ---------------------- |
| `code` | text (uppercase) | Sim         | **Sim (no warehouse)** | 2-5 chars       | + `useUniquenessCheck` |
| `name` | text             | Sim         | Nao                    | Required        | Manter                 |

---

## 3. Campos Unicos — Mapa de fieldMap para useFormErrorHandler

Cada formulario precisa de um `fieldMap` para mapear erros da API para campos:

```typescript
// Products
fieldMap: {
  'Product with this name already exists': 'name',
  'Name is required': 'name',
  'Name must be at most 200 characters': 'name',
  'Template not found': 'templateId',
  'Manufacturer not found': 'manufacturerId',
}

// Variants
fieldMap: {
  'SKU already exists': 'sku',
  'Name is required': 'name',
  'Price cannot be negative': 'definedSalePrice',
  'Cost price cannot be negative': 'informedCostPrice',
  'Min stock cannot be greater than max stock': 'minStock',
  'Color hex must be in format': 'colorHex',
  'Profit margin must be between 0 and 100': 'profitMarginPercent',
}

// Manufacturers
fieldMap: {
  'Manufacturer with this name already exists': 'name',
  'Name is required': 'name',
  'Invalid email format': 'email',
  'Rating must be between 0 and 5': 'rating',
}

// Categories
fieldMap: {
  'A category with this name already exists': 'name',
  'A category cannot be its own parent': 'parentId',
  'Parent would create circular dependency': 'parentId',
}

// Tags
fieldMap: {
  'A tag with this name already exists': 'name',
  'Color must be a valid hex color code': 'color',
}

// Templates
fieldMap: {
  'Template with this name already exists': 'name',
  'Invalid unit of measure': 'unitOfMeasure',
}

// Warehouses
fieldMap: {
  'A warehouse with this code already exists': 'warehouseCode',
}

// Zones
fieldMap: {
  'A zone with this code already exists': 'code',
}
```

---

## 4. Validacoes Ausentes que Devem Ser Adicionadas

### 4.1 Validacoes Client-side (Zod schemas)

| Entidade     | Campo                 | Validacao                 | Prioridade |
| ------------ | --------------------- | ------------------------- | ---------- |
| Product      | `name`                | min 1, max 200            | Alta       |
| Product      | `description`         | max 1000                  | Baixa      |
| Variant      | `name`                | min 1, max 256            | Alta       |
| Variant      | `sku`                 | max 64                    | Media      |
| Variant      | `colorHex`            | regex `^#[0-9A-Fa-f]{6}$` | Media      |
| Variant      | `profitMarginPercent` | 0-100                     | Media      |
| Variant      | `minStock`/`maxStock` | >= 0, min <= max          | Media      |
| Variant      | `informedCostPrice`   | >= 0                      | Media      |
| Variant      | `definedSalePrice`    | >= 0                      | Media      |
| Manufacturer | `email`               | formato email             | Media      |
| Manufacturer | `name`                | min 1, max 255            | Alta       |
| Manufacturer | `legalName`           | max 256                   | Baixa      |
| Category     | `name`                | min 1, max 128            | Alta       |
| Tag          | `name`                | min 1, max 100            | Alta       |
| Tag          | `color`               | regex hex                 | Media      |
| Tag          | `description`         | max 500                   | Baixa      |
| Template     | `name`                | min 1, max 200            | Alta       |
| Template     | `iconUrl`             | max 512                   | Baixa      |
| Warehouse    | `code`                | 2-5 chars, alphanumeric   | Alta       |
| Warehouse    | `name`                | min 1, max 128            | Alta       |
| Zone         | `code`                | 2-5 chars, alphanumeric   | Alta       |
| Zone         | `name`                | min 1, max 128            | Alta       |

### 4.2 Validacoes de Unicidade (useUniquenessCheck)

| Entidade     | Campo  | Endpoint Necessario                            | Existe?         |
| ------------ | ------ | ---------------------------------------------- | --------------- |
| Product      | `name` | `GET /products/check-name?name=X`              | **Nao — criar** |
| Variant      | `sku`  | `GET /variants/check-sku?sku=X`                | **Nao — criar** |
| Manufacturer | `name` | `GET /manufacturers/check-name?name=X`         | **Nao — criar** |
| Manufacturer | `cnpj` | Ja existe via BrasilAPI check                  | Sim             |
| Category     | `name` | `GET /categories/check-name?name=X&parentId=Y` | **Nao — criar** |
| Tag          | `name` | `GET /tags/check-name?name=X`                  | **Nao — criar** |
| Template     | `name` | `GET /templates/check-name?name=X`             | **Nao — criar** |
| Warehouse    | `code` | `GET /warehouses/check-code?code=X`            | **Nao — criar** |
| Zone         | `code` | `GET /zones/check-code?code=X&warehouseId=Y`   | **Nao — criar** |

**IMPORTANTE:** Os endpoints de check devem ser criados no backend ANTES da migracao do frontend. Sem eles, o `useUniquenessCheck` nao funciona. Alternativa: usar apenas `useFormErrorHandler` com `fieldMap` (valida apos submit, nao on blur).

---

## 5. Estrategia de Migracao (Sem Quebrar Nada)

### 5.1 Abordagem por Risco

**Fase 1 — Formularios simples (Baixo risco):**

- Tag create-modal
- Category create-modal
- Zone create-modal
- QuickCreateForm (template)

**Fase 2 — Formularios medios (Medio risco):**

- CreateProductWizard
- CreateProductForm
- EditProductForm
- CreateManufacturerWizard
- LocationSetupWizard

**Fase 3 — Formularios complexos (Alto risco):**

- VariantFormModal (20+ campos, 5 secoes, SectionErrorBadge)
- ItemEntryFormModal (4 secoes, logica condicional)
- TemplateForm (imperative API, ref-based, attribute editor)

### 5.2 Para cada formulario, a migracao consiste em:

1. **Adicionar `useFormErrorHandler`** no catch do submit
2. **Adicionar `fieldMap`** com os erros da API mapeados
3. **Trocar `toast.error` por `handleError`** no onError
4. **Adicionar `FormErrorIcon`** em cada campo que pode ter erro
5. **Adicionar `aria-invalid`** nos inputs com erro
6. **Adicionar `SectionErrorBadge`** nos headers de secao (wizards/navigation)
7. **Opcionalmente migrar para react-hook-form + zod** (se o formulario justifica)

### 5.3 O que NAO mudar (para nao quebrar)

- **NAO migrar forcadamente de useState para react-hook-form** em formularios complexos (VariantFormModal, ItemEntryFormModal) — o risco e muito alto. Adicionar error handling sobre a estrutura existente.
- **NAO alterar a logica de submit** — apenas envolver com try/catch + handleError
- **NAO alterar a estrutura de steps/secoes** dos wizards — apenas adicionar badges
- **NAO criar endpoints de check-name se o backend nao estiver pronto** — usar fieldMap como fallback
- **NAO mudar os componentes customizados** (MoneyInput, BinSelector, CategoryCombobox) — adicionar error state via props opcionais

### 5.4 Prerequisitos no Backend (antes da Fase 2+)

1. Adicionar `field` na resposta de `BadRequestError` nos use cases de stock
2. (Opcional) Criar endpoints `check-name`, `check-sku`, `check-code` para validacao on blur
3. Padronizar mensagens de erro para facilitar o `fieldMap`

---

## 6. Estimativa de Impacto

| Metrica                                  | Valor             |
| ---------------------------------------- | ----------------- |
| Total de formularios                     | 16                |
| Ja adequados (react-hook-form + zod)     | 1 (QuickAddModal) |
| Formularios simples (1-3 campos)         | 6                 |
| Formularios medios (4-8 campos)          | 5                 |
| Formularios complexos (8+ campos)        | 4                 |
| Campos unicos que precisam de check      | 9                 |
| Endpoints de check a criar no backend    | 8                 |
| Campos que faltam validacao client-side  | 22                |
| Secoes que precisam de SectionErrorBadge | 9 (em 3 wizards)  |

---

## 7. Checklist de Migracao (por formulario)

Para cada formulario migrado, verificar:

- [ ] `useFormErrorHandler` configurado com `fieldMap` correto
- [ ] `FormErrorIcon` em todos os campos que podem ter erro
- [ ] `aria-invalid` nos inputs com erro
- [ ] `SectionErrorBadge` nos headers de secao (se aplicavel)
- [ ] Mensagens de erro usando `t()` do i18n
- [ ] Toast removido para erros de campo (manter para rede/servidor)
- [ ] `useUniquenessCheck` em campos unicos (se endpoint disponivel)
- [ ] Teste manual: criar com dados validos funciona
- [ ] Teste manual: criar com campo obrigatorio vazio mostra erro no campo
- [ ] Teste manual: criar com nome duplicado mostra erro no campo nome
- [ ] Teste manual: corrigir campo com erro limpa o erro em tempo real
- [ ] Nenhum fluxo existente quebrado
