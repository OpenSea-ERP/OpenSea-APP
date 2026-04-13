# Sales Audit Fixes — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todas as issues de segurança, frontend broken e invoicing encontradas na auditoria profunda do módulo Sales.

**Architecture:** Fixes distribuídos em 3 frentes: (A) Segurança na API — batch limits, permission gaps, data exposure; (B) Frontend broken — 404 handlers, `|| []` anti-patterns; (C) Invoicing — substituir hardcoded values por dados reais via CompaniesRepository e FocusNfeConfigRepository.

**Tech Stack:** TypeScript, Fastify, Zod, Prisma (API); Next.js, React, React Query (APP)

---

## Task 1: Limitar batch sync de pedidos offline (DoS prevention)

**Files:**

- Modify: `OpenSea-API/src/http/controllers/sales/orders/v1-sync-offline-orders.controller.ts:44`

- [ ] **Step 1: Adicionar `.max(100)` no schema Zod**

Na linha 44, o array `orders` tem `.min(1)` mas sem `.max()`. Adicionar:

```typescript
// Antes (linha 44):
          .min(1),

// Depois:
          .min(1)
          .max(100),
```

- [ ] **Step 2: Verificar TypeScript**

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | grep sync-offline`
Expected: Nenhum erro

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/sales/orders/v1-sync-offline-orders.controller.ts
git commit -m "fix(sales): limitar batch sync a 100 pedidos por request (DoS prevention)"
```

---

## Task 2: Remover internalNotes da resposta pública da API

**Files:**

- Modify: `OpenSea-API/src/mappers/sales/order/order-to-dto.ts:28,65`

- [ ] **Step 1: Ler o mapper atual**

Ler `OpenSea-API/src/mappers/sales/order/order-to-dto.ts` por completo.

- [ ] **Step 2: Remover `internalNotes` da interface e do mapper**

Remover a linha 28 (`internalNotes: string | null;`) da interface `OrderDTO`.
Remover a linha 65 (`internalNotes: order.internalNotes ?? null,`) da função mapper.

- [ ] **Step 3: Verificar se algum controller/test depende de internalNotes**

Run: `cd OpenSea-API && grep -rn "internalNotes" src/http/ src/use-cases/ --include="*.ts" | grep -v ".spec." | grep -v "order-to-dto"`
Se algum endpoint retorna/usa `internalNotes` do DTO, avaliar se precisa de um DTO separado para admin.

- [ ] **Step 4: Verificar TypeScript**

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | grep "internalNotes\|order-to-dto"`
Expected: Nenhum erro (ou erros que indicam onde remover referências)

- [ ] **Step 5: Commit**

```bash
cd OpenSea-API && git add src/mappers/sales/order/order-to-dto.ts
git commit -m "fix(sales): remover internalNotes da resposta pública (data exposure)"
```

---

## Task 3: Adicionar permission middleware nos endpoints legacy sales-orders

**Files:**

- Modify: `OpenSea-API/src/http/controllers/sales/sales-orders/v1-list-sales-orders.controller.ts:1,17`
- Modify: `OpenSea-API/src/http/controllers/sales/sales-orders/v1-get-sales-order-by-id.controller.ts:1,15`

- [ ] **Step 1: Adicionar imports e middleware no LIST**

No `v1-list-sales-orders.controller.ts`, adicionar imports e permission middleware:

```typescript
// Adicionar imports (linha 1):
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';

// Alterar preHandler (linha 17):
// Antes:
preHandler: [verifyJwt, verifyTenant],
// Depois:
preHandler: [
  verifyJwt,
  verifyTenant,
  createPermissionMiddleware({
    permissionCode: PermissionCodes.SALES.ORDERS.ACCESS,
    resource: 'sales-orders',
  }),
],
```

- [ ] **Step 2: Adicionar imports e middleware no GET**

No `v1-get-sales-order-by-id.controller.ts`, mesmo padrão:

```typescript
// Adicionar imports:
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';

// Alterar preHandler (linha 15):
preHandler: [
  verifyJwt,
  verifyTenant,
  createPermissionMiddleware({
    permissionCode: PermissionCodes.SALES.ORDERS.ACCESS,
    resource: 'sales-orders',
  }),
],
```

- [ ] **Step 3: Verificar TypeScript**

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | grep sales-orders`
Expected: Nenhum erro

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/sales/sales-orders/
git commit -m "fix(sales): adicionar permission middleware nos endpoints legacy sales-orders"
```

---

## Task 4: Corrigir 404 handling em Campaigns detail page

**Files:**

- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/campaigns/[id]/page.tsx:73-75`

- [ ] **Step 1: Ler o arquivo atual**

Ler `campaigns/[id]/page.tsx` por completo para entender a estrutura.

- [ ] **Step 2: Separar loading de error/not-found**

Substituir o bloco combinado (linhas 73-75):

```tsx
// ANTES:
if (isLoading || !campaign) {
  return <GridLoading count={1} layout="grid" size="lg" />;
}

// DEPOIS:
if (isLoading) {
  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar breadcrumbItems={breadcrumbItems} />
      </PageHeader>
      <PageBody>
        <GridLoading count={3} layout="list" size="md" />
      </PageBody>
    </PageLayout>
  );
}

if (error || !campaign) {
  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar breadcrumbItems={breadcrumbItems} />
      </PageHeader>
      <PageBody>
        <GridError
          type="not-found"
          title="Campanha não encontrada"
          message="A campanha que você está procurando não existe ou foi removida."
          action={{
            label: 'Voltar para Campanhas',
            onClick: () => router.push('/sales/campaigns'),
          }}
        />
      </PageBody>
    </PageLayout>
  );
}
```

Garantir que `PageLayout`, `PageHeader`, `PageBody`, `PageActionBar`, `GridError` estejam importados. Adicionar `error` ao destructuring do hook se necessário.

- [ ] **Step 3: Verificar TypeScript**

Run: `cd OpenSea-APP && npx tsc --noEmit 2>&1 | grep campaigns`
Expected: Nenhum erro

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add "src/app/(dashboard)/(modules)/sales/(entities)/campaigns/[id]/page.tsx"
git commit -m "fix(sales): corrigir 404 handler na página de detalhe da campanha"
```

---

## Task 5: Corrigir 404 handling em Pricing detail page

**Files:**

- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/pricing/[id]/page.tsx:61-63`

- [ ] **Step 1: Ler o arquivo atual**

Ler `pricing/[id]/page.tsx` por completo.

- [ ] **Step 2: Separar loading de error/not-found**

Mesmo padrão da Task 4, adaptado para Pricing:

```tsx
// ANTES:
if (isLoading || !priceTable) {
  return <GridLoading count={1} layout="grid" size="lg" />;
}

// DEPOIS:
if (isLoading) {
  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar breadcrumbItems={breadcrumbItems} />
      </PageHeader>
      <PageBody>
        <GridLoading count={3} layout="list" size="md" />
      </PageBody>
    </PageLayout>
  );
}

if (error || !priceTable) {
  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar breadcrumbItems={breadcrumbItems} />
      </PageHeader>
      <PageBody>
        <GridError
          type="not-found"
          title="Tabela de preço não encontrada"
          message="A tabela de preço que você está procurando não existe ou foi removida."
          action={{
            label: 'Voltar para Tabelas de Preço',
            onClick: () => router.push('/sales/pricing'),
          }}
        />
      </PageBody>
    </PageLayout>
  );
}
```

- [ ] **Step 3: Verificar TypeScript e Commit**

```bash
cd OpenSea-APP && npx tsc --noEmit 2>&1 | grep pricing
git add "src/app/(dashboard)/(modules)/sales/(entities)/pricing/[id]/page.tsx"
git commit -m "fix(sales): corrigir 404 handler na página de detalhe da tabela de preço"
```

---

## Task 6: Remover anti-padrão `|| []` em 7 arquivos

**Files:**

- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/cadences/[id]/edit/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/cashier/[id]/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/conversations/[id]/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/forms/[id]/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/forms/[id]/edit/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/workflows/[id]/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/sales/(entities)/workflows/[id]/edit/page.tsx`

- [ ] **Step 1: Ler cada arquivo e identificar a linha exata com `|| []`**

Em cada arquivo, buscar o padrão `|| []` e substituir por `?? []`. A diferença: `?? []` só aplica fallback para `null`/`undefined` (correto), enquanto `|| []` também aplica para `0`, `''`, `false` (incorreto para arrays).

Na verdade, para arrays vindos de API, `?? []` é o fix correto — protege contra `null`/`undefined` sem mascarar outros falsy values.

- [ ] **Step 2: Substituir `|| []` por `?? []` em cada arquivo**

Para cada arquivo listado:

- `cadences/[id]/edit/page.tsx`: `data.cadence.steps || []` → `data.cadence.steps ?? []`
- `cashier/[id]/page.tsx`: `session.transactions || []` → `session.transactions ?? []`
- `conversations/[id]/page.tsx`: `conversation.messages || []` → `conversation.messages ?? []`
- `forms/[id]/page.tsx`: `form.fields || []` → `form.fields ?? []`
- `forms/[id]/edit/page.tsx`: `(form.fields || []).map` → `(form.fields ?? []).map`
- `workflows/[id]/page.tsx`: `workflow.steps || []` → `workflow.steps ?? []`
- `workflows/[id]/edit/page.tsx`: `(workflow.steps || []).map` → `(workflow.steps ?? []).map`

- [ ] **Step 3: Verificar TypeScript**

Run: `cd OpenSea-APP && npx tsc --noEmit 2>&1 | grep "cadences\|cashier\|conversations\|forms\|workflows"`
Expected: Nenhum erro

- [ ] **Step 4: Commit**

```bash
cd OpenSea-APP && git add "src/app/(dashboard)/(modules)/sales/(entities)/cadences/" \
  "src/app/(dashboard)/(modules)/sales/(entities)/cashier/" \
  "src/app/(dashboard)/(modules)/sales/(entities)/conversations/" \
  "src/app/(dashboard)/(modules)/sales/(entities)/forms/" \
  "src/app/(dashboard)/(modules)/sales/(entities)/workflows/"
git commit -m "fix(sales): substituir || [] por ?? [] em 7 detail/edit pages (anti-pattern fix)"
```

---

## Task 7: Injetar FocusNfeConfigRepository no cancel-invoice e check-invoice-status

**Files:**

- Modify: `OpenSea-API/src/use-cases/sales/invoicing/cancel-invoice.use-case.ts`
- Modify: `OpenSea-API/src/use-cases/sales/invoicing/check-invoice-status.use-case.ts`
- Modify: `OpenSea-API/src/use-cases/sales/invoicing/factories/make-invoicing-use-cases.ts`

- [ ] **Step 1: Modificar cancel-invoice.use-case.ts**

Adicionar `FocusNfeConfigRepository` ao constructor e buscar config antes de chamar o provider:

```typescript
import type { FocusNfeConfigRepository } from '@/repositories/sales/focus-nfe-config-repository';

export class CancelInvoiceUseCase {
  constructor(
    private invoicesRepository: InvoicesRepository,
    private focusNfeProvider: IFocusNfeProvider,
    private focusNfeConfigRepository: FocusNfeConfigRepository // NOVO
  ) {}

  async execute(request: CancelInvoiceUseCaseRequest) {
    // ... (busca invoice, valida status — manter como está)

    // Buscar config do Focus NFe
    const config = await this.focusNfeConfigRepository.findByTenant(
      request.tenantId
    );
    if (!config || !config.isEnabled) {
      throw new BadRequestError(
        'Focus NFe is not configured or disabled for this tenant.'
      );
    }

    // Chamar provider COM dados reais
    await this.focusNfeProvider.cancelInvoice({
      type: invoice.type.toLowerCase() as 'nfe' | 'nfce',
      apiKey: config.apiKey, // ERA: ''
      ref: invoice.id.toString(),
      numero_nf: Number(invoice.number),
      serie_nf: Number(invoice.series),
      chave_nfe: invoice.accessKey,
      cnpj_emitente: '', // Será resolvido na Task 8
      data_emissao:
        invoice.issuedAt?.toISOString().split('T')[0] ||
        new Date().toISOString().split('T')[0],
      justificativa: request.reason,
    });
    // ... resto mantém igual
  }
}
```

- [ ] **Step 2: Modificar check-invoice-status.use-case.ts**

Mesmo padrão — adicionar `FocusNfeConfigRepository` ao constructor:

```typescript
import type { FocusNfeConfigRepository } from '@/repositories/sales/focus-nfe-config-repository';

export class CheckInvoiceStatusUseCase {
  constructor(
    private invoicesRepository: InvoicesRepository,
    private focusNfeProvider: IFocusNfeProvider,
    private focusNfeConfigRepository: FocusNfeConfigRepository, // NOVO
  ) {}

  async execute(request: CheckInvoiceStatusUseCaseRequest) {
    // ... (busca invoice — manter)

    if (invoice.status === 'PENDING' || invoice.status === 'ERROR') {
      // Buscar config
      const config = await this.focusNfeConfigRepository.findByTenant(request.tenantId);
      if (!config || !config.isEnabled) {
        // Se não tem config, retorna status atual sem tentar query
        return { /* response atual */ };
      }

      try {
        const statusResponse = await this.focusNfeProvider.checkStatus({
          type: invoice.type.toLowerCase() as 'nfe' | 'nfce',
          apiKey: config.apiKey,    // ERA: ''
          ref: invoice.id.toString(),
        });
        // ... resto do processamento mantém igual
      }
    }
  }
}
```

- [ ] **Step 3: Atualizar factory**

No `make-invoicing-use-cases.ts`, passar `PrismaFocusNfeConfigRepository` para os novos constructors:

```typescript
export function makeCheckInvoiceStatusUseCase(): CheckInvoiceStatusUseCase {
  return new CheckInvoiceStatusUseCase(
    new PrismaInvoicesRepository(),
    new FocusNfeProviderImpl(true),
    new PrismaFocusNfeConfigRepository() // NOVO
  );
}

export function makeCancelInvoiceUseCase(): CancelInvoiceUseCase {
  return new CancelInvoiceUseCase(
    new PrismaInvoicesRepository(),
    new FocusNfeProviderImpl(true),
    new PrismaFocusNfeConfigRepository() // NOVO
  );
}
```

- [ ] **Step 4: Verificar TypeScript**

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | grep invoic`

- [ ] **Step 5: Commit**

```bash
cd OpenSea-API && git add src/use-cases/sales/invoicing/
git commit -m "fix(sales/invoicing): injetar FocusNfeConfigRepository em cancel e check-status"
```

---

## Task 8: Injetar CompaniesRepository no issue-invoice e cancel-invoice (company data)

**Files:**

- Modify: `OpenSea-API/src/use-cases/sales/invoicing/issue-invoice.use-case.ts`
- Modify: `OpenSea-API/src/use-cases/sales/invoicing/cancel-invoice.use-case.ts`
- Modify: `OpenSea-API/src/use-cases/sales/invoicing/factories/make-invoicing-use-cases.ts`

- [ ] **Step 1: Modificar issue-invoice.use-case.ts**

Adicionar `CompaniesRepository` e `CompanyAddressesRepository` ao constructor. Substituir hardcoded companyData:

```typescript
import type { CompaniesRepository } from '@/repositories/core/companies-repository';
import type { CompanyAddressesRepository } from '@/repositories/core/company-addresses-repository';

// No constructor, adicionar:
private companiesRepository: CompaniesRepository,
private companyAddressesRepository: CompanyAddressesRepository,

// Substituir o bloco hardcoded (linhas 106-116):
// ANTES:
// const companyData = { cnpj: '12345678000190', ... };

// DEPOIS:
const companies = await this.companiesRepository.findManyActive(request.tenantId);
const company = companies[0]; // Empresa principal do tenant
if (!company) {
  throw new BadRequestError('Nenhuma empresa cadastrada para este tenant. Configure os dados da empresa antes de emitir notas fiscais.');
}

const addresses = await this.companyAddressesRepository.findMany({
  companyId: company.id,
  type: 'FISCAL',
  isPrimary: true,
});
const address = addresses.addresses[0];

const companyData = {
  cnpj: company.cnpj,
  razaoSocial: company.legalName,
  endereco: address?.street ?? '',
  numero: address?.number ?? 'S/N',
  bairro: address?.district ?? '',
  cidade: address?.city ?? '',
  uf: address?.state ?? '',
  cep: address?.zip ?? '',
};
```

- [ ] **Step 2: Modificar cancel-invoice para usar CNPJ real**

No `cancel-invoice.use-case.ts`, adicionar `CompaniesRepository` e buscar CNPJ:

```typescript
import type { CompaniesRepository } from '@/repositories/core/companies-repository';

// Constructor:
private companiesRepository: CompaniesRepository,

// No execute, antes de chamar provider:
const companies = await this.companiesRepository.findManyActive(request.tenantId);
const company = companies[0];
if (!company) {
  throw new BadRequestError('Nenhuma empresa cadastrada para este tenant.');
}

// Substituir cnpj_emitente: '' por:
cnpj_emitente: company.cnpj,
```

- [ ] **Step 3: Atualizar factory**

```typescript
import { PrismaCompaniesRepository } from '@/repositories/core/prisma/prisma-companies-repository';
import { PrismaCompanyAddressesRepository } from '@/repositories/core/prisma/prisma-company-addresses-repository';

export function makeIssueInvoiceUseCase(): IssueInvoiceUseCase {
  return new IssueInvoiceUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
    new PrismaCustomersRepository(),
    new PrismaInvoicesRepository(),
    new PrismaFocusNfeConfigRepository(),
    new FocusNfeProviderImpl(true),
    new PrismaCompaniesRepository(), // NOVO
    new PrismaCompanyAddressesRepository() // NOVO
  );
}

export function makeCancelInvoiceUseCase(): CancelInvoiceUseCase {
  return new CancelInvoiceUseCase(
    new PrismaInvoicesRepository(),
    new FocusNfeProviderImpl(true),
    new PrismaFocusNfeConfigRepository(),
    new PrismaCompaniesRepository() // NOVO
  );
}
```

- [ ] **Step 4: Verificar TypeScript**

Run: `cd OpenSea-API && npx tsc --noEmit 2>&1 | grep invoic`

- [ ] **Step 5: Commit**

```bash
cd OpenSea-API && git add src/use-cases/sales/invoicing/ src/use-cases/sales/invoicing/factories/
git commit -m "fix(sales/invoicing): substituir company data hardcoded por CompaniesRepository real"
```

---

## Resumo de Commits Esperados

| #   | Commit                                       | Repo | Categoria                 |
| --- | -------------------------------------------- | ---- | ------------------------- | --- | -------- |
| 1   | Limitar batch sync a 100                     | API  | Segurança                 |
| 2   | Remover internalNotes do DTO                 | API  | Segurança                 |
| 3   | Permission middleware em legacy sales-orders | API  | Segurança                 |
| 4   | 404 handler em campaigns detail              | APP  | Frontend                  |
| 5   | 404 handler em pricing detail                | APP  | Frontend                  |
| 6   | `                                            |      | []`→`?? []` em 7 arquivos | APP | Frontend |
| 7   | FocusNfeConfigRepository em cancel/check     | API  | Invoicing                 |
| 8   | CompaniesRepository em issue/cancel          | API  | Invoicing                 |
