# Pattern: Component & UI Architecture

## Problem

Aplicações React tendem a acumular componentes dispersos, inconsistentes e difíceis de reutilizar. Sem uma arquitetura clara, cada módulo (stock, hr, finance, etc.) cria seus próprios formulários, modais, listas e feedbacks de forma isolada, gerando duplicação de código e experiência inconsistente para o usuário.

O OpenSea-APP resolve isso com uma camada de componentes genéricos e reutilizáveis que todos os módulos consomem, garantindo consistência visual e comportamental em toda a aplicação.

---

## Solution

A arquitetura de componentes do OpenSea-APP é organizada em três camadas:

```
src/components/
  ui/            → Componentes primitivos (shadcn/ui customizados)
  shared/        → Componentes genéricos de domínio (EntityForm, EntityGrid, etc.)
  layout/        → Estrutura de página (Navbar, PageLayout, PageActionBar)
  {modulo}/      → Componentes específicos de cada módulo de negócio
```

O design system é baseado em **TailwindCSS 4** com tokens CSS customizados definidos em `src/app/globals.css`, garantindo coerência entre temas claro e escuro.

---

## Implementation

### 1. Design System — Tokens CSS

O design system usa variáveis CSS organizadas em três camadas:

**Primitive Tokens** (paleta base, ex: `--os-blue-500: 59 130 246`)
**Semantic Tokens** (significado, ex: `--color-primary`, `--color-destructive`)
**Component Tokens** (uso específico, ex: `--input-bg`, `--glass-blur`)

```css
/* src/app/globals.css — exemplo de tokens semânticos */
:root {
  --color-primary: var(--os-blue-500); /* azul #3b82f6 */
  --color-destructive: var(--os-red-500); /* vermelho #ef4444 */
  --color-success: var(--os-green-500); /* verde #22c55e */
  --glass-bg: var(--os-white);
  --glass-blur: 20px;
}

.dark {
  --color-primary: var(--os-blue-500); /* mesmo tom no dark */
  --color-background: var(--os-slate-900); /* fundo escuro */
  --glass-bg: var(--os-slate-800);
}
```

Os tokens são consumidos diretamente nos componentes via classes Tailwind e `rgb(var(--token))`.

**Acessibilidade:** O arquivo inclui a diretiva `@media (prefers-reduced-motion: reduce)` que desativa animações para usuários que preferem menor movimento.

---

### 2. Biblioteca Base — shadcn/ui

Todos os componentes primitivos ficam em `src/components/ui/` e são instalados via shadcn/ui, depois customizados com os tokens do projeto.

**Componentes disponíveis:**

| Categoria    | Componentes                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Formulário   | `Input`, `Textarea`, `Select`, `Switch`, `Checkbox`, `Label`, `Form`, `InputGroup`, `Combobox` |
| Feedback     | `Alert`, `AlertDialog`, `Progress`, `Sonner` (toast)                                           |
| Navegação    | `Breadcrumb`, `NavigationMenu`, `Tabs`, `Sidebar`                                              |
| Sobreposição | `Dialog`, `Drawer`, `Sheet`, `Popover`, `Tooltip`, `HoverCard`                                 |
| Dados        | `Table`, `Badge`, `Avatar`, `Card`                                                             |
| Especiais    | `InputOTP`, `Calendar`, `Carousel`, `Resizable`, `StepWizardDialog`, `FilterDropdown`          |

**Customizações relevantes adicionadas ao shadcn padrão:**

- `combobox.tsx` — Select com busca integrada via `Command`
- `filter-dropdown.tsx` — Dropdown com seleção múltipla, contador de selecionados e busca interna
- `input-group.tsx` — Agrupa Input com prefixo/sufixo e inclui `MoneyInput` para valores monetários
- `step-wizard-dialog.tsx` — Dialog de múltiplos passos com coluna de ícone à esquerda
- `sonner.tsx` — Toaster configurado com ícones customizados e variáveis CSS do design system

#### Exemplo — FilterDropdown (seleção múltipla com cores temáticas)

```tsx
// src/components/ui/filter-dropdown.tsx
<FilterDropdown
  label="Categoria"
  icon={Tag}
  options={categories.map(c => ({ id: c.id, label: c.name }))}
  selected={selectedCategories}
  onSelectionChange={setSelectedCategories}
  activeColor="violet"
  searchPlaceholder="Buscar categoria..."
/>
```

O componente exibe os itens selecionados primeiro na lista, mostra contador na badge do botão e suporta "Selecionar tudo" / "Limpar".

#### Exemplo — MoneyInput

```tsx
// src/components/ui/input-group.tsx
<InputGroup>
  <InputGroupAddon>
    <InputGroupText>R$</InputGroupText>
  </InputGroupAddon>
  <MoneyInput value={price} onChange={setPrice} />
</InputGroup>
```

O `MoneyInput` usa `type="number"` com `step="0.01"` e suprime os controles visuais do Chrome via CSS.

#### Exemplo — StepWizardDialog

```tsx
// src/components/ui/step-wizard-dialog.tsx
<StepWizardDialog
  open={open}
  onOpenChange={setOpen}
  steps={[
    {
      title: 'Informações',
      icon: <MailIcon />,
      content: <Step1 />,
      isValid: isStep1Valid,
    },
    { title: 'Configuração', icon: <SettingsIcon />, content: <Step2 /> },
  ]}
  currentStep={step}
  onStepChange={setStep}
  onClose={handleClose}
/>
```

Layout fixo de 800×480px com coluna lateral de 200px para o ícone e área de conteúdo scrollável à direita.

---

### 3. Convenção de Ícones

**Regra:** A biblioteca padrão de ícones é **react-icons**, não lucide-react.

```tsx
// CORRETO — react-icons
import { FiPackage, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { MdInventory } from 'react-icons/md';

// ATENÇÃO — lucide-react existe mas é usado apenas em componentes
// genéricos do shared/ (EntityForm, modals) e no sonner.tsx.
// Módulos de negócio devem usar react-icons.
```

O tipo de ícone para props genéricas é `React.ComponentType<{ className?: string }>`:

```tsx
// src/types/entity-config.ts
export interface FormTab {
  icon?: React.ComponentType<{ className?: string }>;
  // ...
}
```

---

### 4. EntityForm — Formulário Genérico

**Localização:** `src/components/shared/forms/entity-form.tsx`

O `EntityForm` é um formulário declarativo e reutilizável que suporta seções, abas, campos dinâmicos e gerenciamento de atributos. Toda a configuração é passada via prop `config: EntityFormConfig<T>`.

**Interface de configuração:**

```typescript
// src/types/entity-config.ts

interface FormFieldConfig {
  name: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'textarea'
    | 'date'
    | 'select'
    | 'switch'
    | 'checkbox'
    | 'file'
    | 'color';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => boolean | string;
  };
}

interface EntityFormConfig<T> {
  entity: string; // "Produto", "Fornecedor", etc.
  sections?: FormSection[]; // Sem tabs
  tabs?: FormTab[]; // Com tabs
  onSubmit: (data: T) => Promise<void>;
  defaultValues?: T;
  submitLabel?: string; // padrão: "Salvar"
  cancelLabel?: string; // padrão: "Cancelar"
  onCancel?: () => void;
  loading?: boolean;
}
```

**Métodos expostos via ref (`EntityFormRef`):**

```typescript
interface EntityFormRef {
  submit: () => Promise<void>; // Dispara validação e submissão
  getData: () => Record<string, unknown>; // Lê dados atuais
  reset: () => void; // Reseta para defaultValues
  setFieldValue: (name: string, value: unknown) => void;
}
```

**Exemplo de uso — sem tabs:**

```tsx
const formRef = useRef<EntityFormRef>(null);

const config: EntityFormConfig = {
  entity: 'Fornecedor',
  sections: [
    {
      title: 'Dados Básicos',
      fields: [
        { name: 'name', label: 'Nome', type: 'text', required: true },
        {
          name: 'email',
          label: 'E-mail',
          type: 'text',
          placeholder: 'contato@empresa.com',
        },
        {
          name: 'active',
          label: 'Ativo',
          type: 'switch',
          description: 'Habilitar fornecedor',
        },
      ],
    },
  ],
  defaultValues: { name: supplier.name, email: supplier.email, active: true },
  onSubmit: async data => {
    await updateSupplier(supplier.id, data);
    toast.success('Fornecedor atualizado!');
  },
  onCancel: () => router.back(),
};

return <EntityForm ref={formRef} config={config} />;
```

**Exemplo de uso — com tabs e atributos:**

```tsx
const config: EntityFormConfig = {
  entity: 'Template',
  tabs: [
    {
      id: 'general',
      label: 'Geral',
      icon: FiInfo,
      sections: [
        {
          fields: [
            { name: 'name', label: 'Nome', type: 'text', required: true },
          ],
        },
      ],
      attributes: {
        singular: 'Atributo',
        plural: 'Atributos',
        keyLabel: 'Chave',
        valueLabel: 'Valor',
        maxAttributes: 20,
      },
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: FiLayout,
      sections: [
        {
          fields: [
            { name: 'width', label: 'Largura (mm)', type: 'number' },
            { name: 'height', label: 'Altura (mm)', type: 'number' },
          ],
        },
      ],
    },
  ],
  onSubmit: handleSubmit,
};
```

**Quando NÃO usar EntityForm:** Para entidades com lógica de formulário complexa (coerção de tipos, dependência entre campos, formatações específicas), use formulários manuais com `useState`, como foi feito para a edição de `Manufacturer`. O EntityForm usa `Record<string, unknown>` internamente, o que pode causar problemas de coerção de tipo com campos numéricos e booleanos.

---

### 5. DynamicFormField — Campo Dinâmico

**Localização:** `src/components/shared/forms/dynamic-form-field.tsx`

Renderiza campos individuais com base no tipo. Usado internamente pelo `EntityForm`.

| Tipo              | Componente renderizado                              |
| ----------------- | --------------------------------------------------- |
| `text` / `number` | `<Input>`                                           |
| `textarea`        | `<Textarea>`                                        |
| `date`            | `<Input type="date">`                               |
| `select`          | `<Select>` shadcn/ui                                |
| `switch`          | `<Switch>` + label inline                           |
| `checkbox`        | `<Checkbox>` + label inline                         |
| `color`           | `<Input type="color">` + campo de texto hexadecimal |
| `file`            | `<Input type="file">`                               |

**Validação:** O campo exibe `<span className="text-destructive">*</span>` para campos obrigatórios e mensagem de erro abaixo do campo quando inválido.

---

### 6. EntityGrid — Grade com Seleção Múltipla

**Localização:** `src/components/shared/grid/entity-grid.tsx`

Componente genérico para exibir itens em modo grid ou lista com suporte a:

- Alternância Grid / Lista com botões de toggle
- Seleção múltipla (click simples) e seleção por range (shift+click)
- **Drag to select** — arrastar o mouse para selecionar múltiplos itens com retângulo visual
- Menu de contexto integrado via `EntityContextMenu`
- Double-click para ações rápidas

```tsx
<EntityGrid
  items={products}
  defaultView="grid"
  selectedIds={selectedIds}
  onItemClick={handleClick}
  onItemDoubleClick={handleOpen}
  onItemsView={ids => openMultiView(ids)}
  onItemsEdit={ids => navigateEdit(ids[0])}
  onItemsDelete={handleBatchDelete}
  onClearSelection={() => setSelectedIds(new Set())}
  onSelectRange={(startId, endId) => selectRange(startId, endId)}
  renderGridItem={(item, isSelected) => (
    <ProductGridCard product={item} isSelected={isSelected} />
  )}
  renderListItem={(item, isSelected) => (
    <ProductListCard product={item} isSelected={isSelected} />
  )}
  emptyMessage="Nenhum produto encontrado"
/>
```

**Grid responsivo:** No modo grid, usa `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.

---

### 7. EntityContextMenu — Menu de Contexto

**Localização:** `src/components/shared/context-menu/entity-context-menu.tsx`

Envolve qualquer elemento filho com um menu de contexto (botão direito) padronizado. Ações disponíveis:

| Prop              | Label                 | Ícone   |
| ----------------- | --------------------- | ------- |
| `onView`          | Visualizar            | Eye     |
| `onEdit`          | Editar                | Pencil  |
| `onDuplicate`     | Duplicar              | Copy    |
| `onStockMovement` | Movimentar Estoque    | Package |
| `onCopyCode`      | Copiar Código         | Copy    |
| `onDelete`        | Excluir (destructive) | Trash2  |

Quando múltiplos itens estão selecionados, os labels incluem o contador: `Excluir (3)`.

```tsx
<EntityContextMenu
  onView={() => openModal(item.id)}
  onDelete={() => confirmDelete(item.id)}
  isMultipleSelection={selectedIds.size > 1}
  selectedCount={selectedIds.size}
>
  <ProductCard product={item} />
</EntityContextMenu>
```

---

### 8. Padrões de Modal e Dialog

#### 8.1 VerifyActionPinModal — Verificação de Segurança

**Localização:** `src/components/modals/verify-action-pin-modal.tsx`

Usado antes de ações destrutivas ou sensíveis (exclusão, remoção de participante, etc.). Exibe 4 slots de PIN mascarados com auto-submit quando o 4.º dígito é digitado.

```tsx
const [showPinModal, setShowPinModal] = useState(false);

<VerifyActionPinModal
  isOpen={showPinModal}
  onClose={() => setShowPinModal(false)}
  onSuccess={() => {
    deleteEvent(eventId);
  }}
  title="Confirmar Exclusão"
  description="Digite seu PIN de Ação para excluir este evento."
/>;
```

#### 8.2 ConfirmDialog — Confirmação Simples

**Localização:** `src/components/shared/confirm-dialog.tsx`

Dialog de confirmação com 4 variantes visuais: `default` (azul), `destructive` (vermelho), `warning` (amarelo), `success` (verde).

```tsx
<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Excluir fornecedor"
  description="Esta ação não pode ser desfeita. O fornecedor será removido permanentemente."
  confirmLabel="Excluir"
  variant="destructive"
  icon={<Trash2 className="w-6 h-6" />}
  onConfirm={handleDelete}
/>
```

#### 8.3 QuickCreateModal — Criação Rápida

**Localização:** `src/components/shared/modals/quick-create-modal.tsx`

Modal de criação com apenas um campo de nome. Suporta:

- Auto-foco no input ao abrir
- Submit via Enter
- Reseta o campo após criar (para cadastro contínuo)
- Ícone customizável no header

```tsx
<QuickCreateModal
  isOpen={showCreate}
  onClose={() => setShowCreate(false)}
  onSubmit={async name => {
    await createCategory({ name });
    toast.success(`Categoria "${name}" criada!`);
  }}
  title="Nova Categoria"
  description="Crie uma categoria rapidamente. Você poderá adicionar mais detalhes depois."
  inputLabel="Nome da categoria"
  inputPlaceholder="Ex: Roupas Masculinas"
  icon={<FiTag className="w-5 h-5 text-blue-500" />}
/>
```

#### 8.4 ImportModal — Importação em Massa

**Localização:** `src/components/shared/modals/import-modal.tsx`

Modal para upload de arquivo CSV/Excel com suporte a drag-and-drop. Exibe nome e tamanho do arquivo selecionado. Inclui botão opcional para baixar template.

```tsx
<ImportModal
  isOpen={showImport}
  onClose={() => setShowImport(false)}
  onImport={async file => {
    await importProducts(file);
    toast.success('Importação concluída!');
  }}
  title="Importar Produtos"
  acceptedFormats=".csv,.xlsx"
  onDownloadTemplate={downloadProductTemplate}
/>
```

#### 8.5 MultiViewModal — Visualização de Múltiplas Entidades

**Localização:** `src/components/shared/modals/multi-view-modal.tsx`

Modal avançado para visualizar e comparar múltiplas entidades simultaneamente:

- **Modo Único:** Uma entidade por vez com tabs no cabeçalho para navegar
- **Modo Comparação:** Dois painéis lado a lado (ativado via botão `SquareSplitHorizontal`)
- **Busca integrada:** Campo de pesquisa para adicionar entidades ao modal
- Navegação por teclado: `←` / `→` para trocar entidade ativa, `Escape` para fechar

#### 8.6 BatchProgressDialog — Progresso de Operações em Lote

**Localização:** `src/components/shared/progress/batch-progress-dialog.tsx`

Dialog com barra de progresso para operações assíncronas em lote (delete, duplicate, create, update). Suporta pause/resume/cancel e exibe contador de sucessos e falhas.

```tsx
<BatchProgressDialog
  open={batchOpen}
  status={batchStatus}
  total={selectedIds.size}
  processed={processed}
  succeeded={succeeded}
  failed={failed}
  progress={(processed / total) * 100}
  operationType="delete"
  itemName="produtos"
  onClose={() => setBatchOpen(false)}
  onPause={pauseBatch}
  onCancel={cancelBatch}
/>
```

#### 8.7 StepWizardDialog — Wizard Multi-Etapas

**Localização:** `src/components/ui/step-wizard-dialog.tsx`

Dialog com navegação por etapas. Layout com coluna lateral (200px) para ícone ilustrativo e área de conteúdo com título, descrição e corpo scrollável.

```tsx
const [step, setStep] = useState(1);

<StepWizardDialog
  open={open}
  onOpenChange={setOpen}
  steps={[
    {
      title: 'Configuração IMAP',
      description: 'Configure o servidor de entrada de e-mail.',
      icon: <InboxIcon className="w-20 h-20 text-blue-500" />,
      content: <ImapConfigStep form={form} />,
      isValid: form.formState.isValid,
    },
    {
      title: 'Configuração SMTP',
      icon: <SendIcon className="w-20 h-20 text-green-500" />,
      content: <SmtpConfigStep form={form} />,
      footer: <CustomFooter onSave={handleSave} />,
    },
  ]}
  currentStep={step}
  onStepChange={setStep}
  onClose={handleClose}
/>;
```

---

### 9. Componentes de Feedback e Estado

#### 9.1 Toast Notifications (Sonner)

**Padrão:** `import { toast } from 'sonner'`

```tsx
// Sucesso
toast.success('Produto criado com sucesso!');

// Erro com descrição
toast.error('Erro ao salvar', {
  description: 'Verifique os dados e tente novamente.',
});

// Informação
toast.info('Sincronização iniciada...');

// Loading (promise)
toast.promise(updateProduct(id, data), {
  loading: 'Salvando produto...',
  success: 'Produto atualizado!',
  error: 'Erro ao atualizar produto.',
});
```

O `Toaster` é configurado em `src/components/ui/sonner.tsx` com ícones customizados (lucide), resposta ao tema do sistema e variáveis CSS do design system.

#### 9.2 EmptyState — Estado Vazio

**Localização:** `src/components/shared/empty-state.tsx`

Exibido quando uma listagem não retorna resultados. Inclui animação de entrada via framer-motion.

```tsx
<EmptyState
  icon={<FiPackage />}
  title="Nenhum produto encontrado"
  description="Adicione produtos ao catálogo ou ajuste os filtros de busca."
  actionLabel="Adicionar Produto"
  onAction={() => router.push('/stock/products/new')}
/>
```

#### 9.3 Loading Skeletons

**Localização:** `src/components/shared/loading-skeletons.tsx`

Componentes de esqueleto para estados de carregamento:

| Componente       | Uso                                              |
| ---------------- | ------------------------------------------------ |
| `GridLoading`    | Grid de cards com parâmetros `count` e `columns` |
| `ListLoading`    | Lista de itens                                   |
| `TableLoading`   | Tabela com linhas e colunas configuráveis        |
| `PageSkeleton`   | Página completa (título + filtros + grid)        |
| `CardSkeleton`   | Card individual com imagem opcional              |
| `FormSkeleton`   | Formulário com número de campos configurável     |
| `DetailSkeleton` | Página de detalhe (cabeçalho + abas + conteúdo)  |

```tsx
// Em loading.tsx (Next.js route segment)
import { PageSkeleton } from '@/components/shared';

export default function Loading() {
  return <PageSkeleton />;
}

// Em componente com React Query
if (isLoading) return <GridLoading count={12} columns={3} />;
```

#### 9.4 UserAvatar — Avatar do Usuário

**Localização:** `src/components/shared/user-avatar.tsx`

Gera iniciais e cor de fundo determinística baseada no hash do nome. Resolve URLs de storage com token de autenticação automaticamente.

```tsx
<UserAvatar
  name="João"
  surname="Silva"
  email="joao@empresa.com"
  avatarUrl="/v1/storage/files/abc123/serve"
  size="md" // 'sm' | 'md' | 'lg' | 'xl'
/>
```

---

### 10. Componentes de Layout de Página

#### 10.1 PageLayout / PageHeader / PageBody

**Localização:** `src/components/layout/page-layout.tsx`

Estrutura semântica de página com espaçamentos padronizados:

```tsx
<PageLayout spacing="gap-6">
  <PageHeader>
    <PageActionBar breadcrumbItems={breadcrumbs} buttons={actionButtons} />
    <Header title="Produtos" description="Gerencie o catálogo de produtos" />
  </PageHeader>
  <PageBody>
    <SearchSection onSearch={setQuery} filters={<ProductFilters />} />
    <EntityGrid items={products} ... />
  </PageBody>
</PageLayout>
```

#### 10.2 PageActionBar e PageBreadcrumb

**Localização:** `src/components/layout/page-action-bar.tsx`

Barra superior da página com breadcrumb à esquerda e botões de ação à direita. Os botões respeitam permissões via `hasPermission`:

```tsx
<PageActionBar
  breadcrumbItems={[
    { label: 'Estoque', href: '/stock' },
    { label: 'Produtos' },
  ]}
  actionButtons={[
    {
      id: 'create',
      label: 'Novo Produto',
      icon: FiPlus,
      href: '/stock/products/new',
      permission: 'stock.products.create',
    },
  ]}
  hasPermission={hasPermission}
/>
```

O breadcrumb sempre inclui "Início" como primeiro item automaticamente.

#### 10.3 PageHeader (shared) — Cabeçalho com Gradiente

**Localização:** `src/components/shared/page-header.tsx`

Cabeçalho sticky com ícone em container gradiente, título, descrição e slot de ações. Usado em páginas de detalhe:

```tsx
<PageHeader
  title="Empresa XYZ Ltda."
  description="CNPJ: 12.345.678/0001-90"
  icon={<MdBusiness />}
  gradient="from-blue-500 to-indigo-600"
  showBackButton
  actions={
    <Button onClick={handleEdit}>
      <FiEdit className="mr-2" />
      Editar
    </Button>
  }
/>
```

---

### 11. Componentes de Dados e Exibição

#### 11.1 InfoField — Campo de Informação

**Localização:** `src/components/shared/info-field.tsx`

Exibe um par label/valor com suporte a ícone, badge, botão de cópia e ação customizada.

```tsx
<InfoField
  label="E-mail"
  value={employee.email}
  icon={<FiMail className="h-4 w-4" />}
  showCopyButton
  copyTooltip="Copiar e-mail"
/>

<InfoField
  label="Status"
  value={null}
  badge={<StatusBadge status="active" />}
  emptyText="Não definido"
/>
```

#### 11.2 MetadataSection — Timestamps

**Localização:** `src/components/shared/metadata-section.tsx`

Exibe as datas de criação e última atualização de uma entidade. Não renderiza se ambas forem nulas.

```tsx
<MetadataSection
  createdAt={product.createdAt}
  updatedAt={product.updatedAt}
  title="Metadados"
/>
```

#### 11.3 StatsCard e StatsSection

**Localização:** `src/components/shared/stats-card.tsx` e `src/components/shared/stats/stats-section.tsx`

`StatsCard` exibe uma métrica individual com ícone em container gradiente, valor e tendência percentual. `StatsSection` agrupa cards em grid expansível animado.

```tsx
// Card individual
<StatsCard
  label="Total de Produtos"
  value={1248}
  icon={<FiPackage />}
  gradient="from-blue-500 to-cyan-600"
  trend={{ value: 12.5, isPositive: true }}
/>

// Seção expansível
<StatsSection
  title="Resumo do Estoque"
  defaultExpanded={false}
  stats={[
    { label: 'Produtos', value: 1248, trend: 12, icon: <FiPackage /> },
    { label: 'Itens em estoque', value: 4521, trend: -3, icon: <FiBox /> },
  ]}
/>
```

#### 11.4 Timeline — Linha do Tempo

**Localização:** `src/components/shared/timeline/timeline.tsx`

Exibe eventos em ordem cronológica com suporte a agrupamento por data, tipos de evento com cores distintas e exibição de mudanças antes/depois.

```tsx
<Timeline
  grouped
  variant="default"
  items={auditLogs.map(log => ({
    id: log.id,
    type: log.action === 'CREATE' ? 'create' : 'update',
    title: `${log.action} — ${log.entity}`,
    description: log.description,
    timestamp: log.createdAt,
    user: { id: log.userId, name: log.userName },
    changes: log.changes,
  }))}
/>
```

**Tipos de evento e cores:**

| Tipo      | Cor      |
| --------- | -------- |
| `create`  | Verde    |
| `update`  | Azul     |
| `delete`  | Vermelho |
| `restore` | Roxo     |
| `warning` | Amarelo  |
| `success` | Verde    |
| `error`   | Vermelho |
| `info`    | Azul     |

---

### 12. Componentes de Busca e Filtros

#### 12.1 SearchSection — Busca com Filtros Colapsáveis

**Localização:** `src/components/shared/search/search-section.tsx`

Combina campo de busca com botão de filtros que expande/recolhe via animação framer-motion.

```tsx
<SearchSection
  searchPlaceholder="Buscar produtos por nome ou SKU..."
  onSearch={setSearchQuery}
  activeFiltersCount={activeFilters}
  filters={
    <div className="flex gap-3">
      <FilterDropdown
        label="Categoria"
        icon={Tag}
        options={categories}
        selected={selectedCategories}
        onSelectionChange={setSelectedCategories}
        activeColor="violet"
      />
      <FilterDropdown
        label="Fornecedor"
        icon={Building}
        options={suppliers}
        selected={selectedSuppliers}
        onSelectionChange={setSelectedSuppliers}
        activeColor="blue"
      />
    </div>
  }
/>
```

---

### 13. EntityViewer — Visualizador de Entidade

**Localização:** `src/components/shared/viewers/entity-viewer.tsx`

Exibe dados de uma entidade em modo leitura com suporte a modo de edição inline. Integra com `EntityForm` quando `formConfig` é fornecido.

```tsx
<EntityViewer
  config={{
    entity: 'Template',
    allowEdit: hasPermission('stock.templates.update'),
    editLabel: 'Editar Template',
    tabs: [
      {
        id: 'general',
        label: 'Geral',
        sections: [
          {
            fields: [
              { label: 'Nome', value: template.name },
              { label: 'Criado em', value: template.createdAt, type: 'date' },
            ],
          },
        ],
      },
    ],
  }}
  formConfig={editFormConfig}
  onSave={handleSave}
/>
```

Tipos de campo para visualização: `text` (padrão), `date` (formata com `pt-BR`), `badge` (renderiza `<Badge>`), `list` (renderiza lista com bullets), `custom` (via prop `render`).

---

### 14. Design Responsivo

O projeto segue abordagem **mobile-first** com breakpoints padrão do Tailwind:

| Breakpoint | Largura | Uso comum                                     |
| ---------- | ------- | --------------------------------------------- |
| `sm`       | 640px   | Mostrar labels em botões (`hidden sm:inline`) |
| `md`       | 768px   | Grid de 2 colunas (`md:grid-cols-2`)          |
| `lg`       | 1024px  | Grid de 3 colunas, sidebar expandida          |
| `xl`       | 1280px  | Grid de 4 colunas (`xl:grid-cols-4`)          |

**Padrões responsivos aplicados:**

1. **Botões na toolbar** — Mobile usa somente ícone (`sm:hidden`), desktop usa ícone + texto (`hidden sm:flex`):

```tsx
// src/components/shared/layout/page-header.tsx
<div className="flex sm:hidden items-center gap-2">
  <Button size="icon" onClick={onAdd} title={addLabel} aria-label={addLabel}>
    <Plus className="w-5 h-5" />
  </Button>
</div>
<div className="hidden sm:flex items-center gap-2">
  <Button onClick={onAdd}>
    <Plus className="w-4 h-4 mr-2" />
    {addLabel}
  </Button>
</div>
```

2. **Grids adaptativos** — EntityGrid usa `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

3. **Descrição oculta no mobile** — `hidden sm:flex` em textos secundários do cabeçalho

4. **Filtros com label oculto** — `<span className="hidden sm:inline">Filtros</span>` no SearchSection

---

### 15. Tema Escuro e Glassmorphism

O tema é gerenciado por `next-themes` via `ThemeProvider` em `src/components/theme-provider.tsx`. O toggle fica em `src/components/ui/theme-toggle.tsx`.

**Convenção de classes dark mode:**

```tsx
// Padrão de classes duais usado em todos os componentes
className = 'bg-white/90 dark:bg-white/5';
className = 'border-gray-200 dark:border-white/10';
className = 'text-gray-900 dark:text-white';
className = 'text-gray-600 dark:text-white/60';
```

**Efeito glassmorphism** — usado em cards e painéis flutuantes:

```tsx
// Fundo translúcido com blur
className =
  'bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/20';

// Sombra com gradiente linear
className =
  'bg-linear-to-r from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900';
```

**Gradientes de ícone** — padronizados como `from-{cor1} to-{cor2}`:

```tsx
// Gradiente no container de ícone do PageHeader
gradient = 'from-blue-500 to-indigo-600';

// Gradiente no StatsCard
gradient = 'from-emerald-500 to-teal-600';
```

**Central area** — O painel `/central` (super admin) tem tema separado gerenciado por `CentralThemeContext` (`src/contexts/central-theme-context.tsx`), com paleta dark blue (`#0d1426`) independente do tema global.

---

### 16. Animações com framer-motion

O projeto usa framer-motion para animações de:

- **EmptyState** — entrada com `opacity: 0 → 1` e `y: 20 → 0`
- **StatsSection** — expansão de height com `AnimatePresence`
- **SearchSection** — filtros colapsáveis com `height: 0 → auto`
- **Cards de stat** — entrada sequencial com `delay: index * 0.05`

```tsx
// Padrão de entrada suave usado no EmptyState
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>

// Padrão de expansão usado no StatsSection e SearchSection
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      {content}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Files

Arquivos de referência para cada padrão documentado:

| Padrão                  | Arquivo                                                      |
| ----------------------- | ------------------------------------------------------------ |
| Design tokens           | `src/app/globals.css`                                        |
| EntityForm              | `src/components/shared/forms/entity-form.tsx`                |
| EntityFormConfig types  | `src/types/entity-config.ts`                                 |
| DynamicFormField        | `src/components/shared/forms/dynamic-form-field.tsx`         |
| AttributeManager        | `src/components/shared/forms/attribute-manager.tsx`          |
| EntityGrid              | `src/components/shared/grid/entity-grid.tsx`                 |
| EntityContextMenu       | `src/components/shared/context-menu/entity-context-menu.tsx` |
| EntityViewer            | `src/components/shared/viewers/entity-viewer.tsx`            |
| VerifyActionPinModal    | `src/components/modals/verify-action-pin-modal.tsx`          |
| ConfirmDialog           | `src/components/shared/confirm-dialog.tsx`                   |
| QuickCreateModal        | `src/components/shared/modals/quick-create-modal.tsx`        |
| ImportModal             | `src/components/shared/modals/import-modal.tsx`              |
| MultiViewModal          | `src/components/shared/modals/multi-view-modal.tsx`          |
| BatchProgressDialog     | `src/components/shared/progress/batch-progress-dialog.tsx`   |
| StepWizardDialog        | `src/components/ui/step-wizard-dialog.tsx`                   |
| FilterDropdown          | `src/components/ui/filter-dropdown.tsx`                      |
| Combobox                | `src/components/ui/combobox.tsx`                             |
| InputGroup / MoneyInput | `src/components/ui/input-group.tsx`                          |
| PageLayout              | `src/components/layout/page-layout.tsx`                      |
| PageActionBar           | `src/components/layout/page-action-bar.tsx`                  |
| PageBreadcrumb          | `src/components/layout/page-breadcrumb.tsx`                  |
| PageHeader (shared)     | `src/components/shared/page-header.tsx`                      |
| SearchSection           | `src/components/shared/search/search-section.tsx`            |
| EmptyState              | `src/components/shared/empty-state.tsx`                      |
| LoadingSkeletons        | `src/components/shared/loading-skeletons.tsx`                |
| UserAvatar              | `src/components/shared/user-avatar.tsx`                      |
| InfoField               | `src/components/shared/info-field.tsx`                       |
| MetadataSection         | `src/components/shared/metadata-section.tsx`                 |
| StatsCard               | `src/components/shared/stats-card.tsx`                       |
| StatsSection            | `src/components/shared/stats/stats-section.tsx`              |
| Timeline                | `src/components/shared/timeline/timeline.tsx`                |
| ThemeToggle             | `src/components/ui/theme-toggle.tsx`                         |
| Sonner/Toaster          | `src/components/ui/sonner.tsx`                               |
| Barrel de exports       | `src/components/shared/index.ts`                             |

---

## Rules

### Quando usar cada componente

| Situação                                  | Componente recomendado                        |
| ----------------------------------------- | --------------------------------------------- |
| Formulário simples com poucos campos      | `EntityForm` com `sections`                   |
| Formulário com abas e atributos dinâmicos | `EntityForm` com `tabs`                       |
| Formulário com lógica complexa de coerção | Formulário manual com `useState`              |
| Ação destrutiva (delete, remoção)         | `VerifyActionPinModal` + `ConfirmDialog`      |
| Criar entidade com só o nome              | `QuickCreateModal`                            |
| Upload em massa                           | `ImportModal`                                 |
| Listagem com seleção múltipla             | `EntityGrid`                                  |
| Visualizar dados em leitura               | `EntityViewer`                                |
| Progresso de operação em lote             | `BatchProgressDialog`                         |
| Onboarding ou wizard                      | `StepWizardDialog`                            |
| Filtros com múltipla seleção              | `FilterDropdown`                              |
| Select com busca                          | `Combobox`                                    |
| Campo monetário                           | `InputGroup` + `MoneyInput`                   |
| Listagem vazia                            | `EmptyState`                                  |
| Carregamento                              | `GridLoading`, `TableLoading`, `PageSkeleton` |
| Avatar do usuário                         | `UserAvatar`                                  |
| Timestamps de entidade                    | `MetadataSection`                             |
| Métricas/KPIs                             | `StatsCard` / `StatsSection`                  |
| Log de auditoria                          | `Timeline`                                    |
| Feedback de operação                      | `toast.success/error/promise`                 |

### Armadilhas comuns

1. **EntityForm com tipos numéricos:** O form armazena tudo como `Record<string, unknown>`. Ao submeter, campos `type="number"` retornam `string` do DOM — o `DynamicFormField` converte via `Number(e.target.value)`, mas certifique-se de que o `onSubmit` trata corretamente.

2. **VerifyActionPinModal e auto-submit:** O auto-submit ao completar 4 dígitos usa `setTimeout(100ms)` para evitar closure stale. Não remova o delay.

3. **EntityGrid e drag-select:** O threshold de 5px de delta evita drag acidental em clicks. Se o usuário clicar em um card, o `data-item-card` attribute impede que o drag-select seja ativado.

4. **FilterDropdown vs Combobox:** Use `FilterDropdown` para múltipla seleção com contador e agrupamento visual. Use `Combobox` para seleção única com busca (Select aprimorado).

5. **Ícones:** Nunca use `lucide-react` em componentes de domínio novos. Use `react-icons`. A exceção são os componentes do `shared/` e `ui/` que já usam lucide e foram criados antes da padronização.

6. **`'use client'`:** Todos os componentes interativos neste documento requerem a diretiva. Componentes de exibição pura podem ser Server Components se não usarem hooks.

7. **EntityListPage (deprecated):** O componente `src/components/shared/layout/entity-list-page.tsx` está marcado como `@deprecated`. Use `PageLayout` + `PageHeader` + `PageActionBar` de `@/components/layout` como modelo em `stock/templates/page.tsx`.

## Audit History

| Data       | Dimensão             | Score | Relatório               |
| ---------- | -------------------- | ----- | ----------------------- |
| 2026-03-10 | Documentação inicial | —     | Criação deste documento |
