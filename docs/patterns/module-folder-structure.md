# Pattern: Module Folder Structure

## Problem

Módulos de negócio (`stock`, `hr`, `finance`, `admin`) podem conter dezenas de páginas com propósitos distintos:
CRUDs de entidades, visões operacionais, relatórios, ações e código compartilhado. Sem convenção, as pastas
ficam "planas" no nível raiz do módulo, dificultando a navegação e a compreensão do domínio.

---

## Solution

Cada módulo organiza suas páginas em **categorias padronizadas** usando uma combinação de **route groups** (sem impacto na URL) e **pastas regulares** (que formam segmentos de URL).

### Estrutura padrão de um módulo

```
{module}/
├── page.tsx                    # Landing page / dashboard do módulo
├── error.tsx                   # Error boundary do módulo
├── loading.tsx                 # Loading skeleton do módulo
├── not-found.tsx               # 404 do módulo (opcional)
│
├── _shared/                    # Código compartilhado dentro do módulo
│   ├── index.ts                # Barrel export
│   ├── components/             # Componentes reutilizados entre páginas do módulo
│   │   └── index.ts
│   ├── constants/              # Constantes, permission codes, labels
│   │   └── index.ts
│   └── hooks/                  # Hooks específicos do módulo (opcional)
│       └── index.ts
│
├── (entities)/                 # Route group — CRUDs de entidades (URL NÃO muda)
│   ├── {entity}/               # Cada entidade tem sua própria pasta
│   │   ├── page.tsx            # Lista (/{module}/{entity})
│   │   ├── new/page.tsx        # Criação (/{module}/{entity}/new) — opcional
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Detalhe (/{module}/{entity}/:id)
│   │   │   └── edit/page.tsx   # Edição (/{module}/{entity}/:id/edit)
│   │   └── src/                # Código local da entidade
│   │       ├── index.ts
│   │       ├── components/     # Componentes exclusivos desta entidade
│   │       ├── modals/         # Modais (create, edit, delete, etc.)
│   │       ├── config/         # Configuração (colunas, filtros, etc.)
│   │       ├── api/            # Queries, mutations, keys — opcional
│   │       ├── schemas/        # Zod schemas do formulário — opcional
│   │       ├── types/          # Types locais — opcional
│   │       └── utils/          # Helpers — opcional
│   └── ...
│
├── overview/                   # Visões operacionais (URL: /{module}/overview/...)
│   ├── {view}/
│   │   ├── page.tsx
│   │   └── src/                # Código local (opcional)
│   └── ...
│
├── actions/                    # Ações e ferramentas (URL: /{module}/actions/...)
│   ├── {action}/
│   │   ├── page.tsx
│   │   └── src/
│   └── ...
│
├── reports/                    # Relatórios e analytics (URL: /{module}/reports/...)
│   ├── page.tsx                # Página principal de relatórios
│   ├── {report}/page.tsx       # Sub-relatório específico
│   └── ...
│
└── requests/                   # Workflows e solicitações (URL: /{module}/requests/...)
    ├── {request}/
    │   ├── page.tsx
    │   └── src/
    └── ...
```

### Categorias

| Pasta         | Tipo           | Impacto na URL                                   | Propósito                                            |
| ------------- | -------------- | ------------------------------------------------ | ---------------------------------------------------- |
| `(entities)/` | Route group    | **Nenhum** — parentheses são invisíveis          | CRUDs completos de entidades do domínio              |
| `overview/`   | Pasta regular  | `/{module}/overview/{view}`                      | Visões operacionais, dashboards, listas consolidadas |
| `actions/`    | Pasta regular  | `/{module}/actions/{action}`                     | Ações pontuais (scan, importação, ferramentas)       |
| `reports/`    | Pasta regular  | `/{module}/reports/{report}`                     | Relatórios, DRE, balanço, analytics, exportação      |
| `requests/`   | Pasta regular  | `/{module}/requests/{request}`                   | Workflows com aprovação (pedidos, inventários)       |
| `_shared/`    | Pasta especial | **Nenhum** — prefixo `_` é ignorado pelo Next.js | Código compartilhado entre páginas do módulo         |

---

## Examples

### Stock

```
stock/
├── page.tsx, error.tsx, loading.tsx
├── _shared/
│   ├── components/             # kpi-card, movement-feed, stock-badge, stock-filter-bar, pagination
│   └── constants/              # stock-permissions
├── (entities)/
│   ├── products/               # /stock/products — CRUD completo + workspace
│   ├── manufacturers/          # /stock/manufacturers
│   ├── product-categories/     # /stock/product-categories
│   ├── tags/                   # /stock/tags
│   ├── templates/              # /stock/templates
│   └── locations/              # /stock/locations — inclui labels/ e sub-rotas [warehouseId]
├── overview/
│   ├── list/                   # /stock/overview/list — visão geral do estoque
│   └── movements/              # /stock/overview/movements — histórico de movimentações
├── actions/
│   ├── quick-scan/             # /stock/actions/quick-scan — leitura de QR/barcode
│   └── volumes/                # /stock/actions/volumes — gestão de volumes
└── requests/
    ├── inventory/              # /stock/requests/inventory — contagens de inventário
    └── purchase-orders/        # /stock/requests/purchase-orders — pedidos de compra
```

### HR

```
hr/
├── page.tsx, loading.tsx
├── _shared/
│   ├── components/             # hr-selection-toolbar
│   ├── constants/              # hr-permissions
│   └── hooks/                  # use-hr-analytics
├── (entities)/
│   ├── employees/              # /hr/employees
│   ├── departments/            # /hr/departments
│   ├── positions/              # /hr/positions
│   ├── companies/              # /hr/companies (somente leitura — CRUD migrado para /admin/companies)
│   ├── absences/               # /hr/absences
│   ├── bonuses/                # /hr/bonuses
│   ├── deductions/             # /hr/deductions
│   ├── overtime/               # /hr/overtime
│   ├── payroll/                # /hr/payroll
│   ├── time-bank/              # /hr/time-bank
│   ├── time-control/           # /hr/time-control
│   ├── vacations/              # /hr/vacations
│   └── work-schedules/         # /hr/work-schedules
└── overview/                   # /hr/overview — dashboard analítico do HR
```

### Admin

```
admin/
├── page.tsx
├── _shared/
│   └── constants/              # admin-permissions
├── (entities)/
│   ├── users/                  # /admin/users
│   ├── teams/                  # /admin/teams
│   ├── permission-groups/      # /admin/permission-groups
│   └── companies/              # /admin/companies — CRUD completo de empresas (migrado de HR)
└── overview/
    └── audit-logs/             # /admin/overview/audit-logs
```

### Finance

```
finance/
├── page.tsx, error.tsx, loading.tsx, not-found.tsx
├── _shared/
│   └── constants/
├── (entities)/
│   ├── payable/                # /finance/payable — contas a pagar
│   ├── receivable/             # /finance/receivable — contas a receber
│   ├── bank-accounts/          # /finance/bank-accounts
│   ├── categories/             # /finance/categories — categorias financeiras
│   ├── cost-centers/           # /finance/cost-centers
│   ├── loans/                  # /finance/loans — empréstimos
│   ├── consortia/              # /finance/consortia — consórcios
│   ├── contracts/              # /finance/contracts
│   ├── recurring/              # /finance/recurring — recorrências
│   └── companies/              # /finance/companies (usa admin service, somente leitura)
├── overview/
│   ├── overdue/                # /finance/overview/overdue — títulos vencidos
│   └── cashflow/               # /finance/overview/cashflow — fluxo de caixa
└── reports/
    ├── page.tsx                # /finance/reports — DRE e balanço patrimonial
    ├── analytics/              # /finance/reports/analytics — KPIs e gráficos
    └── export/                 # /finance/reports/export — exportação contábil
```

---

## Rules

### Quando usar cada categoria

| A página é...                                                 | Use                    |
| ------------------------------------------------------------- | ---------------------- |
| CRUD de uma entidade (lista, detalhe, edição, criação)        | `(entities)/{entity}/` |
| Visão operacional, lista consolidada, dashboard de dados      | `overview/{view}/`     |
| Ação pontual, ferramenta, scanner, importação                 | `actions/{action}/`    |
| Relatório formal, analytics, exportação de dados              | `reports/{report}/`    |
| Workflow com aprovação, pedido, solicitação                   | `requests/{request}/`  |
| Componente/constante/hook reutilizado entre páginas do módulo | `_shared/`             |

### Convenções

1. **`(entities)/` é sempre route group** — as URLs das entidades ficam diretamente sob `/{module}/{entity}`, sem o segmento "entities" na URL.

2. **`_shared/` usa prefixo underscore** — o Next.js App Router ignora pastas com `_` no roteamento, tornando-as ideais para código compartilhado.

3. **Cada entidade tem `src/`** — código local (componentes, modais, config, api, schemas, types, utils) fica dentro de `src/` na pasta da entidade, com barrel `index.ts`.

4. **Nem todo módulo precisa de todas as categorias** — Admin não tem `actions/` nem `reports/`. HR não tem `requests/`. Use apenas o que o módulo precisa.

5. **Páginas raiz do módulo** — `page.tsx` (landing), `error.tsx`, `loading.tsx` e `not-found.tsx` ficam na raiz do módulo, nunca dentro de categorias.

6. **Sub-pastas `src/` dentro de overview/actions/reports** — se uma página de overview ou relatório precisar de componentes locais, use `src/` dentro dela (mesmo padrão de entities).

### Decisão: route group vs pasta regular

| Critério     | Route group `()`                                             | Pasta regular                                                             |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| URL muda?    | **Não**                                                      | **Sim**                                                                   |
| Quando usar? | Entidades cujas URLs devem ser curtas (`/{module}/{entity}`) | Categorias organizacionais (`overview`, `actions`, `reports`, `requests`) |
| Exemplo      | `(entities)/products/page.tsx` → `/stock/products`           | `overview/movements/page.tsx` → `/stock/overview/movements`               |

### Adicionando um novo módulo

1. Crie a pasta em `src/app/(dashboard)/(modules)/{module}/`
2. Adicione `page.tsx` (landing), `loading.tsx` e `error.tsx`
3. Crie `_shared/constants/` com as permission codes
4. Crie `(entities)/` e adicione as entidades do domínio
5. Adicione `overview/`, `actions/`, `reports/` ou `requests/` conforme necessidade

### Adicionando uma nova entidade a um módulo existente

1. Crie a pasta em `(entities)/{entity}/`
2. Adicione `page.tsx` (lista) e `[id]/page.tsx` (detalhe)
3. Se tiver criação: adicione `new/page.tsx`
4. Se tiver edição: adicione `[id]/edit/page.tsx`
5. Crie `src/` com `index.ts`, `config/`, `modals/`, e o que mais precisar
6. Adicione o card na landing page do módulo (`page.tsx`)

---

## Files

| Arquivo                              | Propósito                                        |
| ------------------------------------ | ------------------------------------------------ |
| `stock/(entities)/products/page.tsx` | Exemplo referência de lista de entidade          |
| `stock/(entities)/products/src/`     | Exemplo referência de código local de entidade   |
| `stock/_shared/components/`          | Exemplo referência de componentes compartilhados |
| `stock/overview/movements/src/`      | Exemplo de `src/` em página de overview          |
| `stock/actions/volumes/src/`         | Exemplo de `src/` em página de ação              |

---

## Audit History

| Date       | Dimension            | Score | Report                                                           |
| ---------- | -------------------- | ----- | ---------------------------------------------------------------- |
| 2026-03-11 | Documentação inicial | —     | Análise de stock, hr, admin e finance; padronização da estrutura |
