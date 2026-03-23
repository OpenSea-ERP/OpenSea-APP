# Padrão de Página de Importação

## Visão Geral

O sistema de importação permite importar dados em massa para qualquer entidade do sistema via planilhas interativas. Cada entidade tem sua própria página de importação seguindo um padrão visual e funcional consistente.

## Arquitetura

```
src/app/(dashboard)/(actions)/import/
├── page.tsx                          # Dashboard central (hub)
├── layout.tsx                        # Metadata
├── _shared/                          # Infraestrutura compartilhada
│   ├── components/
│   │   ├── import-spreadsheet.tsx     # Editor de planilha interativo
│   │   ├── import-progress-dialog.tsx # Dialog de progresso da importação
│   │   ├── csv-upload.tsx             # Upload de CSV
│   │   ├── field-config-list.tsx      # Lista de configuração de campos
│   │   └── index.ts                   # Barrel
│   ├── hooks/
│   │   ├── use-import-spreadsheet.ts  # Estado da planilha
│   │   ├── use-import-process.ts      # Processo de importação (batch)
│   │   ├── use-import-ai.ts           # Bridge para IA (futuro)
│   │   ├── use-reference-data.ts      # Dados de referência (templates, categorias, etc.)
│   │   ├── use-cnpj-import-process.ts # Processo especial para CNPJ
│   │   ├── use-code-generator.ts      # Geração de códigos (SKU, referência)
│   │   └── index.ts                   # Barrel
│   ├── config/
│   │   ├── entity-definitions.ts      # Definições de todas as entidades importáveis
│   │   └── code-patterns.ts           # Padrões de geração de código
│   ├── utils/
│   │   ├── excel-parser.ts            # Parser de Excel
│   │   ├── excel-parser.worker.ts     # Web Worker para parsing
│   │   ├── excel-utils.ts             # Template download, file parsing
│   │   └── code-generator.ts          # Lógica de geração de código
│   └── types/
│       └── index.ts                   # Todos os tipos (inclui AI bridge)
├── stock/
│   ├── products/page.tsx              # Importação de produtos (referência)
│   ├── variants/page.tsx              # Importação de variantes (referência)
│   ├── items/page.tsx                 # Importação de itens
│   ├── suppliers/page.tsx             # Importação de fornecedores
│   ├── product-categories/page.tsx    # Importação de categorias
│   ├── manufacturers/page.tsx         # Importação de fabricantes
│   └── templates/page.tsx             # Importação de templates
├── hr/
│   ├── employees/page.tsx             # Importação de funcionários
│   ├── departments/page.tsx           # Importação de departamentos
│   └── positions/page.tsx             # Importação de cargos
└── admin/
    ├── companies/page.tsx             # Importação de empresas
    └── users/page.tsx                 # Importação de usuários
```

## Rotas

| Rota                               | Entidade          | Permissão                    |
| ---------------------------------- | ----------------- | ---------------------------- |
| `/import`                          | Dashboard central | —                            |
| `/import/stock/products`           | Produtos          | `stock.products.import`      |
| `/import/stock/variants`           | Variantes         | `stock.variants.import`      |
| `/import/stock/items`              | Itens             | `stock.items.import`         |
| `/import/stock/suppliers`          | Fornecedores      | `finance.suppliers.import`   |
| `/import/stock/product-categories` | Categorias        | `stock.categories.import`    |
| `/import/stock/manufacturers`      | Fabricantes       | `stock.manufacturers.import` |
| `/import/stock/templates`          | Templates         | `stock.templates.import`     |
| `/import/hr/employees`             | Funcionários      | `hr.employees.import`        |
| `/import/hr/departments`           | Departamentos     | `hr.departments.import`      |
| `/import/hr/positions`             | Cargos            | `hr.positions.import`        |
| `/import/admin/companies`          | Empresas          | `admin.companies.import`     |
| `/import/admin/users`              | Usuários          | `admin.users.import`         |

## Dashboard Central (`/import/page.tsx`)

Segue o padrão de dashboard do projeto com:

- `PageActionBar` — breadcrumb: "Importação"
- `PageHeroBanner` — ícone Upload, título, descrição
- `PageDashboardSections` — cards agrupados por módulo (Estoque, RH, Administração)
- Cards filtrados por permissão via `hasPermission()`
- Seções inteiras ocultas se nenhum card visível

## Estrutura Visual da Página de Importação

```
┌─────────────────────────────────────────────────────────┐
│  PageActionBar                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Importação > {Entidade}          [Validar] [Importar]││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Hero Banner Card                                    ││
│  │  ┌────┐                                              ││
│  │  │icon│ Importar {Entidade}  [badge: Dados válidos]  ││
│  │  └────┘ Preencha a planilha...                       ││
│  │                                                      ││
│  │  ┌──────────────────────────────────────────────────┐││
│  │  │ Secondary Bar                                     │││
│  │  │ [N linhas]  Enter=ver valores    [Arquivo][+][-] │││
│  │  └──────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  ImportSpreadsheet (flex-1, preenche a tela)         ││
│  │  ┌───┬───┬───┬───┬───┬───┐                          ││
│  │  │   │   │   │   │   │   │  (planilha interativa)   ││
│  │  ├───┼───┼───┼───┼───┼───┤                          ││
│  │  │   │   │   │   │   │   │                          ││
│  │  └───┴───┴───┴───┴───┴───┘                          ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ImportProgressDialog (modal durante importação)         │
└─────────────────────────────────────────────────────────┘
```

## Componentes Obrigatórios

### 1. PageActionBar

```tsx
<PageActionBar
  breadcrumbItems={[
    { label: 'Importação', href: '/import' },
    { label: entityDef.labelPlural },
  ]}
  buttons={[
    { id: 'validate', title: 'Validar', icon: CheckCircle2, variant: 'outline', onClick: handleValidate },
    { id: 'import', title: `Importar (${count})`, icon: Play, variant: 'default', onClick: handleImport, disabled: ... },
  ]}
/>
```

### 2. Hero Banner Card

Card com overflow hidden, decorative blobs, gradient icon, título, badge de validação, e secondary bar.

```tsx
<Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
  {/* Decorative blobs */}
  <div className="absolute top-0 right-0 w-44 h-44 bg-{color}-500/15 dark:bg-{color}-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-32 h-32 bg-{color2}-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

  <div className="relative z-10">
    {/* Title row */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-linear-to-br from-{color}-500 to-{color2}-600">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Importar {Entidade}</h1>
          <p className="text-sm text-slate-500 dark:text-white/60">
            Preencha a planilha, faça o upload de um arquivo ou cole dados
          </p>
        </div>
      </div>
      {/* Template selector (apenas para Products/Variants) */}
    </div>

    {/* Secondary bar */}
    <div className="bg-muted/30 dark:bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
      {/* Left: row count badge + keyboard hint */}
      {/* Right: File popover + Add Row + Clear */}
    </div>
  </div>
</Card>
```

### 3. Secondary Bar — Controles

| Controle        | Descrição                                                               |
| --------------- | ----------------------------------------------------------------------- |
| Badge row count | `{N} linhas preenchidas`                                                |
| Keyboard hint   | `Pressione Enter em uma célula para ver os valores possíveis.`          |
| File Popover    | `Arquivo` — abre popover com "Baixar Template Excel" e "Enviar Arquivo" |
| Add Row         | `+ Linha` — adiciona uma linha vazia                                    |
| Clear           | `Limpar` — limpa toda a planilha                                        |
| Decimal toggle  | Apenas em entities com campos numéricos (items)                         |
| Columns popover | Apenas em entities com template (products, variants)                    |

### 4. ImportSpreadsheet

```tsx
<Card className="bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 flex-1 min-h-0 flex flex-col overflow-hidden">
  <ImportSpreadsheet
    data={spreadsheet.data}
    headers={enabledFields}
    onDataChange={spreadsheet.setData}
    onAddRow={spreadsheet.addRow}
    onClearAll={spreadsheet.clearAll}
    validationResult={validationResult}
    entityName={entityDef.labelPlural}
    showFileUpload={false} // File ops estão no popover
    showDownloadTemplate={false} // Template download está no popover
  />
</Card>
```

### 5. ImportProgressDialog

```tsx
<ImportProgressDialog
  open={showProgressDialog}
  onOpenChange={setShowProgressDialog}
  progress={importProcess.progress}
  onPause={importProcess.pauseImport}
  onResume={importProcess.resumeImport}
  onCancel={importProcess.cancelImport}
  onClose={handleProgressClose}
  entityLabel={entityDef.labelPlural}
/>
```

## Layout Principal

```tsx
<div className="flex flex-col gap-3 h-[calc(100vh-10rem)]">
  <PageActionBar ... />
  <Card> {/* Hero Banner */} </Card>
  <Card className="flex-1 min-h-0"> {/* Spreadsheet */} </Card>
  <ImportProgressDialog ... />
</div>
```

**Importante:** NÃO usar `PageLayout` nem `Header`. O layout é um `div` com flex column direto.

## Tipos de Entidade

### Entidades Simples

Categorias, departamentos, cargos, templates, usuários, fornecedores — seguem o template padrão sem lógica extra.

### Entidades com Template (Products, Variants)

Produtos e variantes precisam de seleção de template porque os atributos variam por template. Incluem:

- Template selector no hero banner
- Column configuration com DnD (localStorage)
- Attribute fields dinâmicos do template
- Empty state quando template não selecionado

### Entidades com CNPJ (Manufacturers, Companies)

Fabricantes e empresas usam `useCNPJImportProcess` ao invés de `useImportProcess`. O CNPJ é validado (14 dígitos) e consultado via BrasilAPI.

### Entidade Items

Itens de estoque tem lógica especial:

- Seleção de variante (single vs all)
- Decimal separator toggle
- Reference data: variants com detalhes, bins (localizações)
- Config carregada de sessionStorage

## Acesso Dual

Cada página de importação pode ser acessada de duas formas:

1. **Central de Importação** — `/import` → clicar no card da entidade
2. **Dentro do módulo** — botão "Importar" na listing page da entidade (ex: `/stock/products` → botão navega para `/import/stock/products`)

## Permissões RBAC

Cada entidade tem uma permissão `.import` dedicada:

- Dashboard: cards filtrados por `hasPermission(entity.permission)`
- Listing pages: botão "Importar" só aparece se tem permissão
- Backend: bulk controllers usam `verifyPermission(ENTITY.IMPORT)`

## Adicionando uma Nova Entidade Importável

1. **Backend:** Adicionar `IMPORT` ao PermissionCodes da entidade
2. **Backend:** Criar controller de bulk create com permissão `.import`
3. **Backend:** Adicionar permissão ao seed
4. **Frontend:** Adicionar `'import'` ao `perm()` da entidade em `permission-codes.ts`
5. **Frontend:** Adicionar entrada em `_shared/config/entity-definitions.ts` com campos, endpoints, e `permission`
6. **Frontend:** Criar `src/app/(dashboard)/(actions)/import/{module}/{entity}/page.tsx` seguindo o padrão
7. **Frontend:** Adicionar card no dashboard (`/import/page.tsx`)
8. **Frontend:** Adicionar botão "Importar" na listing page da entidade

## AI Integration (Futuro)

O hook `useImportAI` expõe a interface `ImportAIBridge`:

- `fillFromAI(rows)` — preencher planilha com dados processados pela IA
- `exportForAI()` — exportar estado atual para processamento
- `applySuggestedMapping(mapping)` — aplicar mapeamento de colunas sugerido
- `getEntityDefinition()` — obter definição da entidade

Tipos em `_shared/types/index.ts`: `ImportAIBridge`, `ImportRow`, `ColumnMapping`.

## Cores por Entidade

| Entidade      | Gradient                        | Blob Primary  |
| ------------- | ------------------------------- | ------------- |
| Produtos      | `from-blue-500 to-indigo-600`   | `blue-500`    |
| Variantes     | `from-purple-500 to-violet-600` | `purple-500`  |
| Itens         | `from-green-500 to-emerald-600` | `green-500`   |
| Fornecedores  | `from-orange-500 to-amber-600`  | `orange-500`  |
| Categorias    | `from-yellow-500 to-amber-600`  | `yellow-500`  |
| Fabricantes   | `from-indigo-500 to-violet-600` | `indigo-500`  |
| Templates     | `from-violet-500 to-purple-600` | `violet-500`  |
| Funcionários  | `from-teal-500 to-emerald-600`  | `teal-500`    |
| Departamentos | `from-cyan-500 to-blue-600`     | `cyan-500`    |
| Cargos        | `from-amber-500 to-orange-600`  | `amber-500`   |
| Empresas      | `from-emerald-500 to-teal-600`  | `emerald-500` |
| Usuários      | `from-pink-500 to-rose-600`     | `pink-500`    |
