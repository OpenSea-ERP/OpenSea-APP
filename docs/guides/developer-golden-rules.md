# Sales Module — Developer's Guide

**Date:** 2026-03-21
**Status:** Mandatory reading before implementation
**Purpose:** Patterns to follow, anti-patterns to avoid, new patterns for Sales

---

## 1. Golden Rules (Non-Negotiable)

These rules MUST be followed in EVERY file. Violations block PR merge.

### Backend

| #   | Rule                                                                                                         | Source                                                               |
| --- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | **EVERY controller uses `preHandler`** (never `onRequest`)                                                   | Stock pattern. Finance used `onRequest` — WRONG                      |
| 2   | **EVERY endpoint has full middleware chain:** `[verifyJwt, verifyTenant, createPermissionMiddleware({...})]` | Stock pattern                                                        |
| 3   | **EVERY CREATE endpoint adds `createPlanLimitsMiddleware`**                                                  | Stock has it. Finance MISSING — caused unlimited creation            |
| 4   | **EVERY repository query filters by `tenantId` AND `deletedAt: null`**                                       | Stock pattern. Missing tenant = data leak between tenants            |
| 5   | **EVERY list repository uses pagination** (`skip/take` + count)                                              | Stock pattern. Finance Bank Accounts/Cost Centers MISSING pagination |
| 6   | **EVERY domain entity uses soft delete** (`deletedAt DateTime?`)                                             | Stock pattern                                                        |
| 7   | **EVERY write operation logs to audit** via `logAudit()` with humanized PT-BR text                           | Stock pattern                                                        |
| 8   | **EVERY error uses typed errors** (`BadRequestError`, `ResourceNotFoundError`, `ForbiddenError`)             | Stock pattern. Finance catches only `BadRequestError` — incomplete   |
| 9   | **Zod schemas on ALL inputs** with `.describe()` for Swagger                                                 | Stock has it. Finance list schemas MISSING descriptions              |
| 10  | **Module middleware at route group level** via `createModuleMiddleware('SALES')`                             | Consistent across Stock/HR/Finance                                   |

### Frontend

| #   | Rule                                                                                                                                                                                                                                                                                        | Source                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 11  | **NEVER use traditional pagination** — always `useInfiniteQuery` + IntersectionObserver sentinel                                                                                                                                                                                            | CLAUDE.md rule. Finance Receivable/Payable/Loans VIOLATE this          |
| 12  | **EVERY list hook uses `useInfiniteQuery`** (never `useQuery` for lists)                                                                                                                                                                                                                    | Stock pattern. Finance hooks use basic `useQuery` — WRONG              |
| 13  | **EVERY destructive action uses `VerifyActionPinModal`** (never `confirm()`)                                                                                                                                                                                                                | CLAUDE.md rule. Finance detail pages use `confirm()` — WRONG           |
| 14  | **Permission gating: HIDE elements** (never disable)                                                                                                                                                                                                                                        | CLAUDE.md rule. Finance detail pages MISSING permission checks         |
| 15  | **Filters go inside EntityGrid via `toolbarStart`**                                                                                                                                                                                                                                         | CLAUDE.md rule. Finance puts filters in separate Card above — WRONG    |
| 16  | **Edit pages follow: PageLayout > PageActionBar (Delete+Save) > Identity Card > Form Card**                                                                                                                                                                                                 | Stock pattern. Finance edit pages redirect to detail — incomplete      |
| 17  | **All user-facing text in formal Portuguese with accents**                                                                                                                                                                                                                                  | CLAUDE.md rule                                                         |
| 18  | **Context menu order: View → Edit → [Custom] → Delete (destructive last)**                                                                                                                                                                                                                  | CLAUDE.md rule                                                         |
| 19  | **Loading states use `GridLoading`**, error states use `GridError`                                                                                                                                                                                                                          | Stock pattern. Finance uses basic skeletons — inconsistent             |
| 20  | **URL-synced filters** using `useSearchParams` + `router.push`                                                                                                                                                                                                                              | Stock products page pattern                                            |
| 21  | **Storybook coverage:** todo componente novo (ou modificado) em `components/ui/`, `components/shared/` ou `components/layout/` precisa de `.stories.tsx` co-localizado no mesmo PR. Componentes de módulo (`components/<modulo>/...`) só viram story quando padrão se repete em 3+ módulos. | Storybook adoção 2026-04-30 — ver `docs/patterns/storybook-pattern.md` |

> **Por quê regra 21:** Storybook expõe catálogo via MCP pra agentes (Claude Code) consultarem antes de criar páginas. Sem story, agente não enxerga o padrão e replica errado em outras páginas. Hook pre-commit `npm run storybook:coverage` avisa quando faltar (warn-only, não bloqueia).

---

## 2. Backend Pattern Reference

### 2.1 Controller Template

```typescript
import { verifyJwt } from '@/http/middlewares/auth/verify-jwt';
import { verifyTenant } from '@/http/middlewares/auth/verify-tenant';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { createPlanLimitsMiddleware } from '@/http/middlewares/plans/verify-plan-limits';
import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { logAudit } from '@/http/helpers/audit.helper';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import type { FastifyInstance } from 'fastify';

export async function v1CreateCustomerController(app: FastifyInstance) {
  app.post(
    '/v1/customers',
    {
      schema: {
        tags: ['Sales - Customers'],
        summary: 'Criar novo cliente',
        body: createCustomerSchema,
        response: {
          201: z.object({ customer: customerResponseSchema }),
          400: z.object({ message: z.string() }),
        },
        security: [{ bearerAuth: [] }],
      },
      preHandler: [
        // ← ALWAYS preHandler, NEVER onRequest
        verifyJwt,
        verifyTenant,
        createPlanLimitsMiddleware('contacts'), // ← ONLY on CREATE endpoints
        createPermissionMiddleware({
          permissionCode: PermissionCodes.SALES.CUSTOMERS.REGISTER,
          resource: 'customers',
        }),
      ],
    },
    async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!; // ← ALWAYS from JWT, never from body

      try {
        const useCase = makeCreateCustomerUseCase();
        const { customer } = await useCase.execute({
          tenantId,
          ...request.body,
        });

        // Audit logging
        const userName = await getUserName(userId);
        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CUSTOMER_CREATE,
          entityId: customer.id.toString(),
          placeholders: { userName, customerName: customer.name },
          newData: request.body,
        });

        return reply.status(201).send({ customer: customerToDTO(customer) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error; // ← Let Fastify handle unexpected errors
      }
    }
  );
}
```

### 2.2 Middleware Chain by Endpoint Type

```
LIST:    [verifyJwt, verifyTenant, createPermissionMiddleware({code: .ACCESS})]
GET:     [verifyJwt, verifyTenant, createPermissionMiddleware({code: .ACCESS})]
CREATE:  [verifyJwt, verifyTenant, createPlanLimitsMiddleware('resource'), createPermissionMiddleware({code: .REGISTER})]
UPDATE:  [verifyJwt, verifyTenant, createPermissionMiddleware({code: .MODIFY})]
DELETE:  [verifyJwt, verifyTenant, createPermissionMiddleware({code: .REMOVE})]

Skill-gated (e.g., inbox):
  [verifyJwt, verifyTenant, verifyFeatureFlag('sales.inbox'), createPermissionMiddleware({...})]

Public (e.g., form submission, signing page):
  [rateLimiter({max: 5, window: 60})]  // NO verifyJwt, NO verifyTenant
```

### 2.3 Route Group Registration

```typescript
// src/http/controllers/sales/customers/routes.ts
import { createModuleMiddleware } from '@/http/middlewares/plans/verify-module';

export async function customerRoutes(app: FastifyInstance) {
  // Module check at group level (all routes in this group require SALES module)
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Register individual controllers
  await app.register(v1CreateCustomerController);
  await app.register(v1ListCustomersController);
  await app.register(v1GetCustomerByIdController);
  await app.register(v1UpdateCustomerController);
  await app.register(v1DeleteCustomerController);
}
```

### 2.4 Repository Query Pattern

```typescript
// ALWAYS include tenantId AND deletedAt in EVERY query
async findManyPaginated(
  tenantId: string,
  params: PaginationParams & FilterParams,
): Promise<PaginatedResult<Customer>> {
  const where: Prisma.CustomerWhereInput = {
    tenantId,                    // ← NEVER forget this
    deletedAt: null,             // ← NEVER forget this
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { document: { contains: params.search } },
      ],
    }),
    ...(params.type && { type: params.type }),
  };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: customerInclude,
      orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: data.map(customerPrismaToDomain),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}

// Soft delete — NEVER hard delete main entities
async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
  await prisma.customer.update({
    where: { id: id.toString(), tenantId },
    data: { deletedAt: new Date() },
  });
}
```

---

## 3. Frontend Pattern Reference

### 3.1 Infinite Scroll Hook (MANDATORY for all lists)

```typescript
// CORRECT — Stock pattern
export function useCustomersInfinite(filters?: CustomersFilters) {
  const result = useInfiniteQuery({
    queryKey: ['customers', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      return await customersService.list({
        page: pageParam,
        limit: 20,
        ...filters,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
  });

  const customers = result.data?.pages.flatMap(p => p.customers) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return { ...result, customers, total };
}

// WRONG — Finance anti-pattern (NEVER do this for lists)
export function useCustomers(query: CustomersQuery) {
  return useQuery({
    queryKey: ['customers', query],
    queryFn: () => customersService.list(query),
  });
}
```

### 3.2 Listing Page Structure

```typescript
export default function CustomersPage() {
  return (
    <Suspense fallback={<GridLoading count={9} layout="grid" />}>
      <CustomersPageContent />
    </Suspense>
  );
}

function CustomersPageContent() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PermissionCodes.SALES.CUSTOMERS.REGISTER);
  const canDelete = hasPermission(PermissionCodes.SALES.CUSTOMERS.REMOVE);

  // Infinite scroll
  const { customers, total, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCustomersInfinite(filters);

  // Sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[...]}
          buttons={actionButtons.filter(b => !b.permission || hasPermission(b.permission))}
        />
      </PageHeader>
      <PageBody>
        <EntityGrid
          items={customers}
          toolbarStart={<FilterDropdowns />}  {/* ← INSIDE EntityGrid, not outside */}
          renderGridItem={renderCard}
        />
        <div ref={sentinelRef} className="h-1" />
        {isFetchingNextPage && <LoadingSpinner />}

        <VerifyActionPinModal   {/* ← ALWAYS for delete, NEVER confirm() */}
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
        />
      </PageBody>
    </PageLayout>
  );
}
```

### 3.3 Edit Page Structure

```typescript
// PageLayout > PageActionBar (Delete + Save buttons) > Identity Card > Form Sections

return (
  <PageLayout>
    <PageHeader>
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Clientes', href: '/sales/customers' },
          { label: customer.name, href: `/sales/customers/${id}` },
          { label: 'Editar' },
        ]}
        buttons={[
          // Delete button (rose on hover) — only if has permission
          ...(canDelete ? [{
            id: 'delete', title: 'Excluir', icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            className: 'bg-slate-200 hover:bg-rose-600 dark:bg-[#334155] dark:hover:bg-rose-600',
          }] : []),
          // Save button
          {
            id: 'save', title: isSaving ? 'Salvando...' : 'Salvar',
            icon: isSaving ? Loader2 : Save,
            onClick: handleSubmit, disabled: isSaving,
          },
        ]}
      />
    </PageHeader>
    <PageBody>
      {/* Identity Card */}
      <Card className="bg-white/5 p-5">
        <div className="flex items-center gap-4">
          <IconBox icon={Building2} />
          <div>
            <p className="text-sm text-muted-foreground">Editando cliente</p>
            <h1 className="text-xl font-bold">{customer.name}</h1>
          </div>
          <StatusSwitch checked={isActive} onChange={setIsActive} />
        </div>
      </Card>

      {/* Form Sections with CollapsibleSection */}
      <Card className="bg-white/5 py-2">
        <CollapsibleSection icon={NotebookText} title="Dados Gerais" subtitle="Informações básicas">
          <FormFields ... />
        </CollapsibleSection>

        <CollapsibleSection icon={MapPin} title="Endereço" subtitle="Localização">
          <AddressFields ... />
        </CollapsibleSection>
      </Card>

      <VerifyActionPinModal ... />
    </PageBody>
  </PageLayout>
);
```

---

## 4. Finance Anti-Patterns (WHAT NOT TO DO)

| Anti-Pattern                                 | Where in Finance                   | Correct Pattern                                             |
| -------------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `onRequest` for middleware                   | ALL controllers                    | Use `preHandler`                                            |
| No `createPlanLimitsMiddleware` on CREATE    | ALL create controllers             | Add it                                                      |
| `confirm()` for delete                       | Bank Accounts, Cost Centers detail | `VerifyActionPinModal`                                      |
| `useQuery` for lists                         | All list hooks                     | `useInfiniteQuery`                                          |
| Traditional pagination buttons               | Receivable, Payable, Loans pages   | IntersectionObserver sentinel                               |
| Filters in Card above table                  | Receivable page                    | Inside `EntityGrid` via `toolbarStart`                      |
| No permission checks on buttons              | Detail page delete buttons         | `hasPermission()` → hide                                    |
| Edit page redirects to detail                | Bank Accounts, Cost Centers        | Full edit form                                              |
| Basic skeleton loading                       | Detail pages                       | `GridLoading` component                                     |
| Catch only `BadRequestError`                 | All controllers                    | Catch `BadRequestError` + `ResourceNotFoundError` + rethrow |
| No `.describe()` on query schemas            | List schemas                       | Add descriptions for Swagger                                |
| Repository returns all items (no pagination) | Bank Accounts, Cost Centers        | Always paginate                                             |

---

## 5. New Patterns for Sales (Beyond Stock)

Stock doesn't have these — Sales introduces them:

### 5.1 Kanban Pipeline View

```
New page type: Pipeline Kanban with drag-and-drop
- Used by: CRM Deals, Order pipelines
- DnD library: existing pattern from Tasks module
- Optimistic updates: see optimistic-update-dnd-pattern.md
- Stages as columns, deals/orders as cards
```

### 5.2 Inbox / Chat View

```
New page type: Split-pane inbox
- Left: conversation list (filterable)
- Right: message thread + contact context
- Real-time: WebSocket for incoming messages
- No existing pattern — new for Sales
```

### 5.3 AI Context Panel

```
New component: Side panel with AI insights
- Appears on: deal detail, customer detail, order detail
- Shows: suggestions, sentiment, predictions
- Interactive: buttons to act on suggestions
- No existing pattern — new for Sales
```

### 5.4 Command Bar (Cmd+K)

```
New global component: Universal search + AI commands
- Always available in layout
- Combines: navigation, search, AI
- No existing pattern — new for Tools
```

### 5.5 PDV Interface

```
New page type: Full-screen POS
- Mode-adaptive: switches UI based on PosTerminal.mode
- Touch-optimized: large buttons, swipe gestures
- Offline: Service Worker + IndexedDB
- No existing pattern — entirely new
```

### 5.6 Public Pages (no auth)

```
New page type: Token-based access
- Used by: form submissions, signing page, customer portal, catalog links
- Pattern: /sign/{token}, /portal/{token}, /forms/{slug}
- No verifyJwt — rate-limited, OTP-verified
- No existing pattern in dashboard context
```

### 5.7 Feature-Flag Gated UI

```
New pattern: hide entire sections/pages based on skills
- Check: useFeatureFlag('sales.inbox') before rendering inbox pages
- Navigation menu hides items when skill is disabled
- Graceful: shows "upgrade" prompt, not error
```

---

## 6. File Naming Conventions

### Backend

```
Controller:     v1-{action}-{resource}.controller.ts     (e.g., v1-create-customer.controller.ts)
Schema:         {resource}.schema.ts                      (e.g., customer.schema.ts)
Use Case:       {action}-{resource}.ts                    (e.g., create-customer.ts)
Factory:        make-{action}-{resource}-use-case.ts      (e.g., make-create-customer-use-case.ts)
Repository:     {resource}-repository.ts (interface)       (e.g., customers-repository.ts)
                prisma-{resource}-repository.ts (impl)     (e.g., prisma-customers-repository.ts)
                in-memory-{resource}-repository.ts (test)  (e.g., in-memory-customers-repository.ts)
Entity:         {resource}.ts                             (e.g., customer.ts)
Mapper:         {resource}-to-dto.ts                      (e.g., customer-to-dto.ts)
                {resource}-prisma-to-domain.ts             (e.g., customer-prisma-to-domain.ts)
Unit Test:      {action}-{resource}.spec.ts               (co-located with use case)
E2E Test:       v1-{action}-{resource}.e2e.spec.ts        (co-located with controller)
Routes:         routes.ts                                  (in each resource directory)
Audit:          sales.messages.ts                          (in constants/audit-messages/)
```

### Frontend

```
Page:           page.tsx                                   (Next.js convention)
Hook:           use-{resource}.ts                          (e.g., use-customers.ts)
Service:        {resource}.service.ts                      (e.g., customers.service.ts)
Types:          {resource}.types.ts                        (e.g., customer.types.ts)
Component:      {component-name}.tsx                       (kebab-case)
```

---

## 7. Checklist Before Submitting PR

Every PR for Sales module must verify:

- [ ] All controllers use `preHandler` (not `onRequest`)
- [ ] Full middleware chain: `verifyJwt + verifyTenant + permission`
- [ ] CREATE endpoints have `createPlanLimitsMiddleware`
- [ ] Skill-gated endpoints have `verifyFeatureFlag`
- [ ] All repository queries filter by `tenantId` AND `deletedAt: null`
- [ ] Audit logging with humanized PT-BR text
- [ ] Zod schemas with `.describe()` on all fields
- [ ] Error handling catches `BadRequestError` + `ResourceNotFoundError`
- [ ] Unit tests cover success + all error paths
- [ ] E2E test covers success path
- [ ] Frontend uses `useInfiniteQuery` for lists (never `useQuery`)
- [ ] Delete uses `VerifyActionPinModal` (never `confirm()`)
- [ ] Permission gating hides elements (never disables)
- [ ] Filters inside `EntityGrid.toolbarStart`
- [ ] Edit page follows Identity Card + Form Sections pattern
- [ ] All text in formal Portuguese with accents
- [ ] StorageFile FKs use `{purpose}FileId` naming
- [ ] No circular module imports
