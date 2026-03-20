# 📊 ESTRUTURA DA PÁGINA DE DASHBOARD DE ESTOQUE

## 1. CAMADAS DA ARQUITETURA

A página segue uma estrutura em camadas bem definida:

```
┌─────────────────────────────────────────────────────────┐
│  Página Principal (stock/page.tsx) - Orquestrador       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 1. PageActionBar                                 │   │
│  │    - Breadcrumb + Botões de Ação Globais        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 2. PageHeroBanner                                │   │
│  │    - Título + Descrição + Botões de Consulta    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 3. PageDashboardSections                         │   │
│  │    - Seções Organizadas em Cards                │   │
│  │    - Grid Responsivo                            │   │
│  │    - Contadores Dinâmicos                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘

Estado Global:
- Permissões (hasPermission)
- Dados do Tenant (currentTenant)
- Contadores (counts, countsLoading)
```

---

## 2. COMPONENTES REUTILIZÁVEIS

### 2.1 PageActionBar (`layout/page-action-bar.tsx`)

**Responsabilidade:** Header superior com navegação e ações rápidas

**Props:**

```typescript
{
  breadcrumbItems?: BreadcrumbItemData[]     // Navegação
  actionButtons?: ActionButtonConfig[]        // Botões com permissão
  buttons?: HeaderButton[]                    // Botões genéricos
  hasPermission: (permission: string) => bool // Função de permissão
}
```

**Características:**

- Renderiza breadcrumb dinâmico
- Filtra botões por permissão automaticamente
- Botões styled (default, outline)
- Navegação via Link do Next.js
- Responsivo e acessível

---

### 2.2 PageHeroBanner (`layout/page-hero-banner.tsx`)

**Responsabilidade:** Seção de destaque principal com CTA

**Props:**

```typescript
{
  title: string                               // Título principal
  description: string                         // Descrição
  icon?: React.ElementType                    // Ícone (padrão: Package)
  iconGradient?: string                       // Gradiente do ícone
  buttons: HeroBannerButton[]                 // Botões de ação
  hasPermission: (permission: string) => bool // Verificação
}
```

**Características:**

- Ícone customizável com gradient
- Background decorativo (blob shapes)
- Botões com gradientes
- Filtragem de permissões
- Responsivo (mobile/tablet/desktop)

---

### 2.3 PageDashboardSections (`layout/page-dashboard-sections.tsx`)

**Responsabilidade:** Grid de cards organizados por seções

**Props:**

```typescript
{
  sections: DashboardSection[]                 // Seções com cards
  counts: Record<string, number | null>       // Contadores
  countsLoading: boolean                      // Estado de carregamento
  hasPermission: (permission: string) => bool // Verificação
}
```

**Características:**

- Grid responsivo (1, 2, 3 colunas)
- Cards com hover effects
- Contadores com skeleton loading
- Badges com contadores
- Ícones com gradientes
- Setas animadas no hover
- Filtragem por permissão

---

## 3. ESTRUTURAS DE DADOS

### 3.1 CardItem Interface

```typescript
interface CardItem {
  id: string; // Identificador único
  title: string; // Título do card
  description: string; // Descrição breve
  icon: React.ElementType; // Ícone (lucide-react ou react-icons)
  href: string; // URL de navegação
  gradient: string; // Classes Tailwind do gradiente
  hoverBg: string; // Classes de hover
  permission?: string; // Código de permissão RBAC
  countKey?: string; // Chave para buscar contagem
}
```

### 3.2 Seções de Dados

```typescript
const sections = [
  {
    title: "Cadastros",        // Nome da seção
    cards: [...]               // Array de cards
  },
  // Mais seções...
]
```

### 3.3 Botões Especializados

**ActionButtons** (Operações globais):

- Importação
- Ordens de Compra
- Têm labels e variants (default/outline)

**HeroBannerButtons** (Consultas principais):

- Consultar Estoque
- Consultar Movimentações

---

## 4. FLUXO DE DADOS

```
1. INICIALIZAÇÃO
   └─ usePermissions() → hasPermission function
   └─ useTenant() → currentTenant (nome da empresa)
   └─ useState → counts, countsLoading

2. CARREGAMENTO DE DADOS
   └─ useEffect montagem
      ├─ Promise.allSettled([serviços])
      ├─ Busca: produtos, itens, ordens, templates, etc.
      └─ Popula estado counts

3. RENDERIZAÇÃO CONDICIONAL
   └─ Cada componente filtra por permissão
   └─ Cards visíveis apenas se hasPermission retorna true
   └─ Contadores aparecem se countKey existir

4. INTERAÇÃO DO USUÁRIO
   └─ Cliques → Link para hrefs
   └─ Navegação via Next.js router
```

---

## 5. SEGURANÇA - CONTROLE DE PERMISSÕES (RBAC)

**Aplicado em 3 níveis:**

```typescript
// Nível 1: Action Buttons (Operações globais)
actionButtons.filter(btn => !btn.permission || hasPermission(btn.permission));

// Nível 2: Hero Banner Buttons (Consultas)
heroBannerButtons.filter(
  btn => !btn.permission || hasPermission(btn.permission)
);

// Nível 3: Dashboard Sections (Cards)
section.cards.filter(
  card => !card.permission || hasPermission(card.permission)
);
```

**Codes de Permissão Utilizados:**

- `STOCK_PERMISSIONS.TEMPLATES.LIST`
- `STOCK_PERMISSIONS.PRODUCTS.LIST`
- `STOCK_PERMISSIONS.MANUFACTURERS.LIST`
- `STOCK_PERMISSIONS.PURCHASE_ORDERS.LIST`
- `DATA_PERMISSIONS.IMPORT.PRODUCTS`
- `STOCK_PERMISSIONS.ITEMS.LIST`
- `STOCK_PERMISSIONS.MOVEMENTS.LIST`

---

## 6. PADRÕES DE DESIGN IMPLEMENTADOS

### 6.1 Composição de Componentes

- Componentes pequenos e reutilizáveis
- Props claras e tipadas
- Responsabilidade única por componente

### 6.2 Estados Assíncronos

- `countsLoading` skeleton durante fetch
- `Promise.allSettled` para requisições seguras
- Fallback para null se falhar

### 6.3 Responsividade

```
Mobile:   grid-cols-1
Tablet:   md:grid-cols-2
Desktop:  lg:grid-cols-3
```

### 6.4 Acessibilidade

- Links semânticos com Next.js Link
- ARIA labels em icons
- Contraste de cores adequado
- Navegação breadcrumb clara

---

## 7. ELEMENTOS VISUAIS

### 7.1 Ícones

- **Origem:** lucide-react (padrão) ou react-icons
- **Tamanho:** h-4 w-4 (buttons), h-6 w-6 (cards), h-5 w-5 (icon principal)
- **Cores:** sempre branco (text-white)

### 7.2 Gradientes Tailwind

Paleta de cores para cada card:

```
Cyan:     from-cyan-500 to-cyan-600
Blue:     from-blue-500 to-blue-600
Orange:   from-orange-500 to-orange-600
Rose:     from-rose-500 to-rose-600
Indigo:   from-indigo-500 to-indigo-600
Pink:     from-pink-500 to-pink-600
Emerald:  from-emerald-500 to-emerald-600
Slate:    from-slate-500 to-slate-600
Amber:    from-amber-500 to-amber-600
Purple:   from-purple-500 to-purple-600
```

### 7.3 Animações

- **Hover de cards:** opacidade + sombra
- **Setas:** fade-in + slide-right no hover
- **Skeleton:** pulse durante carregamento
- **Transições:** transition-all (150ms padrão)

---

## 8. FLUXO DE CARREGAMENTO

```
┌─────────────────────────────────────────┐
│ Página monta                            │
├─────────────────────────────────────────┤
│ useEffect → Promise.allSettled()        │
│   ├─ productsService.listProducts()    │
│   ├─ itemsService.listItems()          │
│   ├─ purchaseOrdersService.list()      │
│   ├─ templatesService.listTemplates()  │
│   ├─ manufacturersService.list...()    │
│   ├─ suppliersService.listSuppliers()  │
│   ├─ tagsService.listTags()            │
│   └─ categoriesService.listCategories()│
├─────────────────────────────────────────┤
│ setCounts(resultado)                    │
│ setCountsLoading(false)                 │
├─────────────────────────────────────────┤
│ Renderiza com contadores atualizados    │
└─────────────────────────────────────────┘
```

---

## 9. EXTENSIBILIDADE

A estrutura permite fácil adição de:

**Novos Cards:**

```typescript
{
  id: 'novo-card',
  title: 'Novo Item',
  description: 'Descrição',
  icon: NovoIcon,
  href: '/novo/caminho',
  gradient: 'from-cor-500 to-cor-600',
  hoverBg: 'hover:bg-cor-50 dark:hover:bg-cor-500/10',
  permission: 'NOVA_PERMISSAO',
  countKey: 'chaveDoContador'
}
```

**Novas Seções:**

```typescript
{
  title: 'Nova Seção',
  cards: [...]
}
```

**Novos Botões de Ação:**
Adicionar a `actionButtons` ou `heroBannerButtons`

---

## 10. BOAS PRÁTICAS IMPLEMENTADAS

✅ **Separação de Responsabilidades** - Cada componente faz uma coisa bem  
✅ **DRY** - Não repetir lógica de permissões  
✅ **Tipagem Forte** - TypeScript em todos os componentes  
✅ **Composição** - Props bem definidas  
✅ **Performance** - Promise.allSettled evita cascata  
✅ **Acessibilidade** - Links semânticos, contraste  
✅ **Mobile-First** - Responsivo por padrão  
✅ **Dark Mode** - Classes dark: para tema escuro  
✅ **Permissões Centralizadas** - RBAC em todos os níveis  
✅ **Skeleton Loading** - UX com estados de carregamento

---

## 11. ARQUIVOS ENVOLVIDOS

```
src/
├── app/(dashboard)/
│   └── stock/
│       └── page.tsx                     (Página principal - orquestrador)
│
├── components/
│   └── layout/
│       ├── page-action-bar.tsx          (Header com breadcrumb e ações)
│       ├── page-hero-banner.tsx         (Seção destaque com CTA)
│       ├── page-dashboard-sections.tsx  (Grid de cards por seção)
│       ├── page-breadcrumb.tsx          (Breadcrumb navigation)
│       └── types/
│           └── header.types.ts          (Tipos compartilhados)
│
├── config/
│   └── rbac/
│       └── permission-codes.ts          (Códigos de permissão)
│
├── contexts/
│   └── tenant-context.ts                (Contexto de tenant)
│
├── hooks/
│   └── use-permissions.ts               (Hook de permissões)
│
└── services/
    └── stock/                           (Serviços de API)
        ├── productsService
        ├── itemsService
        ├── templatesService
        └── ... (mais serviços)
```

---

## 12. CHECKLIST PARA NOVOS DASHBOARDS

Ao criar um novo dashboard, siga este checklist:

- [ ] Criar página principal `/novo-modulo/page.tsx`
- [ ] Listar todas as seções e cards necessários
- [ ] Definir ícones (react-icons, de preferencia da biblioteca phosphorIcons)
- [ ] Escolher gradientes Tailwind para cada card
- [ ] Mapear códigos de permissão RBAC
- [ ] Identificar dados que precisam contadores
- [ ] Criar interfaces CardItem específicas se necessário
- [ ] Implementar serviços de API para fetch de dados
- [ ] Usar PageActionBar com breadcrumb
- [ ] Usar PageHeroBanner para CTA principal
- [ ] Usar PageDashboardSections para grid de cards
- [ ] Adicionar skeleton loading para contadores
- [ ] Testar com usuários sem permissões
- [ ] Validar responsividade (mobile/tablet/desktop)
- [ ] Verificar dark mode

---

Esta arquitetura é **escalável, mantível e reutilizável** para criar dashboards em outros módulos do sistema!
