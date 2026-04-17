# OpenSea-APP — Frontend Instructions

## Commands

```bash
npm run dev                    # Start Next.js dev server (http://localhost:3000)
npm run build                  # Build for production
npm run lint                   # Check with ESLint
npm run test:e2e               # Run Playwright E2E tests
```

## Path Aliases

- `@/*` → `./src/*`
- `@core/*`, `@components/*`, `@hooks/*`

## Route Groups

| Route Group             | Layout                                           | Purpose                          |
| ----------------------- | ------------------------------------------------ | -------------------------------- |
| `(auth)`                | None (root)                                      | Login, register, select-tenant   |
| `(dashboard)`           | Navbar + NavigationMenu                          | Main app (tenant-scoped)         |
| `(dashboard)/(modules)` | Module pages                                     | stock, hr, finance, sales, admin |
| `(dashboard)/(tools)`   | Tool pages                                       | email, tasks, calendar, storage  |
| `(central)`             | CentralNavbar + CentralSidebar + SuperAdminGuard | Admin management                 |

## Types Architecture

Types are **modular** — organized by domain module in `src/types/{module}/` with barrel `index.ts` files. **Never create monolithic type files.** Each entity gets its own `*.types.ts` file.

### Rules

1. **Imports**: Always import from the module barrel: `import type { Product } from '@/types/stock'`
2. **Adding a type**: Add to the correct `*.types.ts` file; the barrel re-exports automatically
3. **New entity**: Create `new-entity.types.ts` + add `export * from './new-entity.types'` to barrel
4. **New module**: Create `src/types/{module}/` with files + barrel, add to root `src/types/index.ts`
5. **Type ↔ Backend sync**: Frontend types MUST match backend Zod schemas
6. **Dates**: Use `string` (JSON returns ISO strings)
7. **`any` policy**: ESLint `no-explicit-any` is `error`. Use `unknown` or `Record<string, unknown>`

## Key Files

| File                              | Purpose                               |
| --------------------------------- | ------------------------------------- |
| `src/app/`                        | Next.js app router pages              |
| `src/app/(central)/`              | Central management area (super admin) |
| `src/contexts/tenant-context.tsx` | Tenant selection context              |
| `src/contexts/auth-context.tsx`   | Auth context (includes isSuperAdmin)  |
| `src/components/ui/`              | shadcn/ui components                  |
| `src/lib/api-client.ts`           | Axios API client with token refresh   |
| `src/lib/api-client-auth.ts`      | TokenManager with proactive refresh   |

---

## Frontend Patterns (CRITICAL — follow on every page)

### 1. Pagination: ALWAYS Infinite Scroll

**NEVER use traditional pagination** (page numbers, buttons). Always use `useInfiniteQuery` with `getNextPageParam` based on `meta.page < meta.pages`.

### 2. React Query — NEVER Use Silent Fallbacks

```ts
// ✅ CORRECT — error propagates to React Query
listFn: async () => {
  const response = await productsService.listProducts();
  return response.products;
},

// ❌ NEVER — silently swallows errors
return response.manufacturers || [];
return Array.isArray(response) ? response : response.items || [];
```

**Why**: `|| []` turns API errors into "success with empty array", breaking retry/error handling. This caused a real production bug.

### 3. EntityGrid — Filters Inside

Filters go **inside** EntityGrid via `toolbarStart` prop, NOT as a separate `<div>` above it.

```tsx
<EntityGrid
  toolbarStart={<><FilterDropdown label="Status" ... /></>}
  ...
/>
```

### 4. Entity Page Structure

```tsx
<PageBody>
  <SearchBar ... />
  {isLoading ? <GridLoading /> : error ? <GridError /> : (
    <EntityGrid toolbarStart={/* filters */} ... />
  )}
  {hasSelection && <SelectionToolbar ... />}
  {/* Modals: Rename, Create, Delete, Duplicate — NO View/Edit modals */}
</PageBody>
```

**Important**: We no longer use View or Edit modals on listing pages. View navigates to `/entity/[id]`, Edit navigates to `/entity/[id]/edit`.

### 5. EntityContextMenu — Action Group Order

Three groups separated by `separator: 'before'`:

1. **Base** (built-in): Visualizar, Editar, Renomear, Duplicar
2. **Custom** (via `actions`): Exportar, Imprimir, etc.
3. **Destructive** (via `actions`, last): Excluir

Delete goes in `actions` array (NOT `onDelete` prop) to keep it at the bottom. First custom action and delete both need `separator: 'before'`.

### 6. Permission-Gating (CRITICAL)

All actions conditioned on RBAC permissions. If user lacks permission, element **does not render** (not disabled).

```tsx
const { hasPermission } = usePermissions();
const canView = hasPermission(PERMISSIONS.ENTITY.VIEW);
const canEdit = hasPermission(PERMISSIONS.ENTITY.UPDATE);
const canCreate = hasPermission(PERMISSIONS.ENTITY.CREATE);
const canDelete = hasPermission(PERMISSIONS.ENTITY.DELETE);

// Context menu
<EntityContextMenu
  onView={canView ? handleView : undefined}
  onEdit={canEdit ? handleEdit : undefined}
  onDuplicate={canCreate ? handleDuplicate : undefined}
  actions={getActions(item)} // built dynamically with canEdit/canDelete
/>;

// Page: create button only if canCreate
// SelectionToolbar: { view: canView, edit: canEdit, delete: canDelete }
```

### 7. Destructive Actions — PIN Confirmation (CRITICAL)

**ALL** destructive actions (delete, revoke, bulk) use `VerifyActionPinModal`. Never use a simple "Are you sure?" dialog.

```tsx
<VerifyActionPinModal
  isOpen={page.modals.isOpen('delete')}
  onClose={() => page.modals.close('delete')}
  onSuccess={() => page.handlers.handleDeleteConfirm()}
  title="Confirmar Exclusão"
  description={`Digite seu PIN de ação para excluir ${count} item(ns).`}
/>
```

### 8. Service Layer — No Extra Wrappers

Call services directly from page hooks. Do NOT create page-level API wrapper objects.

```ts
// ✅ Direct service call
listFn: async () => {
  const response = await templatesService.listTemplates();
  return response.templates;
};

// ❌ Unnecessary wrapper layer
const api = {
  list() {
    return templatesService.list();
  },
};
```

### 9. Detail/Edit Pages — Visual Patterns

- **Layout**: Always `PageLayout > PageHeader (PageActionBar) > PageBody`
- **Identity Card**: `<Card className="bg-white/5 p-5">` — icon + name + creation date (no chips/badges)
- **Form Card**: `<Card className="bg-white/5 py-2 overflow-hidden">` — reduced vertical padding
- **Action Bar**: Delete (destructive) + Save (default) buttons, `size="sm"`
- **Loading/Error**: Full layout with `PageActionBar` breadcrumbs + `GridLoading`/`GridError`
- **TabsList**: `className="grid w-full grid-cols-N h-12 mb-4"`
- **ModuleCard bg**: `bg-white dark:bg-slate-800/60 border border-border`
- **Attribute wrapper bg**: Same as ModuleCard (`bg-white dark:bg-slate-800/60 border border-border`)
- **Form sections**: Use `CollapsibleSection` with icon + title + subtitle + collapse toggle
- **Toggle chips**: Dual-theme (light: `bg-{color}-50 text-{color}-700`, dark: `bg-{color}-500/8 text-{color}-300`)

### 9.1 Color System

- **Destructive = Rose** (NOT Red) — warmer tone, better UI integration
- **Button default**: `shadow-sm` (not `shadow-lg`)
- **Button destructive**: flat (no shadow)
- **Button sm**: `h-9 px-2.5 rounded-lg text-sm` — compact for action bars
- **Tabs light**: `slate-100/0.6` bg (not heavy gray)

### 10. Labels & Text — Portuguese

All user-facing text (labels, placeholders, toasts, titles, errors, dialogs) in **formal Portuguese** with correct accents. Code and logs stay in English.

---

## UI Quality Bar (MANDATORY — applies to every new page or refactor)

**Rule:** before implementing UI, cite a reference product + specific behavior you're reproducing. Generic "make it better" is forbidden.

### Required pattern pairings

| Data / interaction            | ❌ Never ship                | ✅ Ship instead (reference)                                          |
| ----------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| Date input                    | `<input type="text">`        | Calendar picker (Google Calendar, Airbnb)                            |
| Timeframe / cronograma        | Plain date pair              | Timeline / Gantt / calendar grid (Linear Cycles, Asana)              |
| File upload                   | Raw `<input type="file">`    | Dropzone + preview + per-file progress (Dropbox, Vercel, Notion)     |
| Long form                     | Single scroll with 20 fields | `StepWizardDialog` OR `CollapsibleSection` groups (Stripe, Typeform) |
| Data table                    | Plain `<table>`              | `EntityGrid` + filters + empty state + skeleton (Linear, Airtable)   |
| Global search                 | Scattered search inputs      | Command palette `⌘K` (Raycast, Linear, Notion)                       |
| Numeric entry (money, %, qty) | Plain text input             | Masked input with currency/locale formatting                         |
| Status / category             | Dropdown with text           | Colored chip/badge with dual-theme (see §9)                          |
| Chart                         | Raw numbers                  | Visual chart with tooltip + legend (Stripe, Vercel Analytics)        |

### Every listing page MUST have

- **Skeleton loading** — not just a spinner (`GridLoading`)
- **Empty state** — illustration or icon + explanatory text + primary CTA + link to docs/help
- **Error state** — useful message + retry button (`GridError`), never "Something went wrong"
- **Filter drawer/dropdowns** — inside toolbar (`toolbarStart`), not above the grid
- **Data-testid anchors** — on page root, search, filters, count, each row

### Every form MUST

- Use **correct input types**: `type="email"`, `type="tel"`, `type="number"`, `inputMode="decimal"` when applicable
- Have **inline validation** (on blur + on submit), never alert()
- Show **masked inputs** for CPF, CNPJ, phone, currency (use existing masked input primitives)
- Support **keyboard submit** (Enter in last field = submit)
- Have **labels tied to inputs** (`htmlFor` + `id`)
- Show **visible focus states** (keyboard navigation must work)
- Have **mobile-optimized layout** (stack at `sm`, reasonable input heights)

### Before implementing, ask yourself

1. Is there a world-class product that solves this same interaction? If yes, **cite it** — which flow, which screen, which micro-interaction.
2. What 3 specific behaviors from that reference are we reproducing? What 1 behavior are we deliberately NOT copying (and why)?
3. Does the current page already have skeleton/empty/error states? If not, add them.
4. Am I about to ship a plain `<input type="date">` or `<input type="file">`? Stop. Use a proper widget.

### When unsure

Ask the user before coding. A 30-second question saves a half-day rework. Never guess on UX that will be user-visible.

### Escalation

If a PR ships UI that violates these rules without justification, it's a **blocker** — fix before merge, don't patch after.

---

## UI Quality Bar — HR Module (mandatory on top of global rules)

HR has domain-specific interactions that need dedicated widgets — generic form fields are never enough. Before building any HR page, cite the reference product.

### Reference products for HR

- **BambooHR** — HRIS profile, PTO requests, org directory
- **Rippling** — admissions/onboarding, document collection, signature flows
- **Gusto** — payroll, benefits, holerite download UX
- **Lattice / 15Five** — performance reviews, 1:1s, OKR tracking, kudos feed
- **Deel** — contract management, multi-country payroll
- **Humaans** — employee directory, time-off calendar
- **Gupy** — recruitment pipeline (BR benchmark)
- **Solides** — performance + engagement (BR)
- **Convenia / Sólides Ponto** — eSocial, point clock (BR)
- **Slack / Notion** — kudos, internal feed, announcement boards

### HR-specific widget pairings

| Interaction                                    | ❌ Never ship              | ✅ Ship instead (reference)                                                                   |
| ---------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| Employee list                                  | Plain table with name only | Directory cards: avatar + role + dept + manager + status (BambooHR, Humaans)                  |
| Employee profile                               | Single-page form           | Tabbed profile: Overview / Documents / History / Performance / Time-off (BambooHR)            |
| Avatar / photo                                 | Initials only              | Photo upload with crop + fallback initials colored by name hash (Gusto)                       |
| Org chart                                      | Flat employee list         | Interactive tree with zoom/pan + team filter (Rippling, Deel)                                 |
| Vacation request                               | Date range inputs          | Calendar picker with team overlay (see conflicts) + balance sidebar (BambooHR PTO)            |
| Vacation approval                              | Plain list                 | Timeline view: who's out each month + color per type (sick/vacation/parental)                 |
| Time tracking / ponto                          | Plain buttons              | Big "Bater ponto" CTA + current session timer + location/geo badge + streak (Sólides Ponto)   |
| Work schedule / escala                         | Text description           | Weekly grid with colored shifts (Humaans, When I Work)                                        |
| Admission flow                                 | Single giant form          | Multi-step wizard with progress bar + saved progress + document uploads per step (Rippling)   |
| Document collection                            | Raw file inputs            | Checklist with state per doc: pending / uploaded / approved / rejected (Rippling)             |
| Signature                                      | Type-your-name field       | Canvas signature or DocuSign-style embedded sign (Rippling, Deel)                             |
| Holerite / contracheque                        | Table of numbers           | Downloadable PDF card + preview modal + history list by month (Gusto)                         |
| Payroll run                                    | Plain form                 | Step-by-step "run" with pre-flight checks, diffs vs last run, approval (Gusto)                |
| Performance review                             | Plain text inputs          | Scale inputs (1–5) + radar chart + self/manager split view (Lattice)                          |
| OKR / goals                                    | Flat task list             | Nested hierarchy: company → team → individual, with progress bars (15Five)                    |
| Kudos / recognition                            | Comment box                | Social feed: sender + receiver avatars + reaction emojis + replies (Slack, Lattice)           |
| Employee request (férias, reembolso, atestado) | Generic form               | Typed request form per kind + state machine visible (pending → approved → processed)          |
| Absence calendar                               | Date list                  | Month grid view with colored bands per absence type + filters (BambooHR)                      |
| Announcement / mural                           | Text block                 | Card feed with pinned items + read receipts + target audience badges (Notion, Slack)          |
| Onboarding progress                            | Checklist                  | Journey-style progress with milestone unlocks + mentor assigned + day counter (Rippling)      |
| Birthday / anniversary                         | List                       | Social feed card with CTA "parabenizar" + auto-notification (BambooHR)                        |
| Salary history                                 | Number column              | Timeline with promotion markers + % increase per change + currency badges                     |
| eSocial event status                           | Plain badge                | Colored chip + tooltip with event code + SEFAZ-style status icon + retry button on failure    |
| Workforce analytics                            | Single KPI                 | Dashboard with headcount trend, turnover, time-to-hire, gender/race split (BambooHR Insights) |
| Recruitment pipeline                           | Table of candidates        | Kanban: Triagem → Entrevista → Oferta → Contratado, drag-and-drop (Gupy)                      |
| Interview scheduling                           | Date text                  | Calendar picker with interviewer availability + timezone + integrations (Gupy, Calendly)      |
| 1:1 meeting                                    | Generic note               | Talking-points template + shared agenda + action items (Lattice, 15Five)                      |

### Every HR employee card MUST have

- **Avatar** with photo or name-initialed colored circle (hash name → hue)
- **Status chip**: Active / On leave / Terminated / Onboarding (color-coded)
- **Role + department** visible without click
- **Manager** (with small avatar + link to their profile)
- **Quick actions** via context menu: Ver / Editar / Férias / Ponto / Mensagem

### Every HR form MUST

- Ask only what's legally needed at that step (LGPD) — do not request SSN/CPF on first form if unnecessary
- Group by legal/fiscal/personal/contractual sections via `CollapsibleSection`
- Support **saved drafts** on long admission forms (resume where you left off)
- Show **required docs checklist** upfront, not surprise at step 4
- Validate CPF/CNPJ/PIS/CTPS with proper check digits (not just regex)
- Show **labor-law hints** inline when relevant (ex: "Férias: 30 dias ao completar 1 ano")

### HR-specific states

- **On leave** — profile must show a banner "Em férias até DD/MM/AAAA" with link to approval
- **Onboarding in progress** — progress bar + next step visible from anywhere in profile
- **Terminated** — profile is read-only, with termination date + reason, no edit actions
- **Pending eSocial event** — amber badge on affected records until event is accepted by government

### Sensitive operations (PIN required)

Beyond the global PIN rule, these HR actions REQUIRE `VerifyActionPinModal`:

- Terminate employee
- Edit salary / benefit value
- Delete employee record (soft delete)
- Send eSocial event
- Bulk payroll run
- Approve/reject vacation request
- Change manager or department

### HR pre-flight checklist

Before building any HR page, confirm:

1. Is there a **recognized HR SaaS** solving this? Cite which product + which screen.
2. Does the data have **legal/compliance implications** (LGPD, CLT, eSocial)? If yes, audit log + PIN + masked display of sensitive fields.
3. Is there a **mobile use case** (punch clock, vacation request, holerite)? Then design mobile-first.
4. Does the user **experience a workflow** (admission, termination, performance cycle)? Then multi-step wizard, not giant form.
5. Is there **data about people** being shown? Use avatars, not text-only.
6. Does an action **affect paycheck, labor record, or compliance**? Require PIN + audit + confirm modal.

### HR interactions that must feel delightful

- Punching the clock → haptic feedback feel (animation + toast + streak shown)
- Requesting vacation → see who's already out that week before submitting
- Reading a kudos → slight confetti or emoji burst
- Completing onboarding step → milestone unlocked, progress grows
- Receiving a review → calm, not transactional (soft background, real names, no scores upfront)

### When unsure

Pergunte ao usuário antes de codar qualquer UI HR que toque **dados sensíveis** (salário, documentos, dependentes, avaliações). Um erro de UX em HR não é só feio — pode ser **violação de LGPD ou CLT**.
