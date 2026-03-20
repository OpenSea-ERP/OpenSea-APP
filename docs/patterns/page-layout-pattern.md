# Pattern: Page and Layout Patterns

## Problem

Aplicações Next.js com múltiplas áreas de acesso (pública, tenant, super-admin) precisam de um sistema de layouts
hierárquico que: (1) isole contextos de autenticação e permissão por área; (2) compartilhe providers globais
sem duplicação; (3) forneça feedback visual consistente durante carregamento e erros; e (4) aplique verificações
de autorização antes da renderização do conteúdo da página.

---

## Solution

O OpenSea-APP organiza as páginas em três grupos de rotas do Next.js App Router, cada um com seu próprio
`layout.tsx` que empilha os providers e guards necessários. Todos os grupos herdam do layout raiz (`app/layout.tsx`),
que injeta os providers globais uma única vez.

### Hierarquia de layouts

```
app/layout.tsx          ← providers globais (ThemeProvider, QueryProvider, AuthProvider, TenantProvider)
  ├── (auth)/           ← sem layout adicional — páginas públicas sem navbar
  │     error.tsx
  │     login/page.tsx
  │     register/page.tsx
  │     select-tenant/page.tsx
  │     setup-pins/page.tsx
  │     forgot-password/page.tsx
  │     reset-password/page.tsx
  │     fast-login/page.tsx
  │
  ├── (dashboard)/      ← layout com Navbar flutuante + ToolsPanel + ProtectedRoute
  │     layout.tsx
  │     loading.tsx
  │     error.tsx
  │     page.tsx        ← página de boas-vindas
  │     (user)/         ← grupo de rota sem layout próprio (herda dashboard)
  │     (actions)/      ← grupo de rota sem layout próprio (import, print)
  │     (modules)/      ← módulos de negócio (stock, hr, finance, admin)
  │         (tools)/    ← ferramentas transversais (calendar, email, file-manager, tasks)
  │
  └── (central)/        ← layout com CentralNavbar + CentralSidebar + SuperAdminGuard
        layout.tsx
        loading.tsx
        error.tsx
        central/page.tsx
        central/tenants/
        central/plans/
```

---

## Route Groups

### `(auth)` — Autenticação pública

**Propósito:** Páginas acessíveis sem autenticação. Não possuem navbar nem sidebar. O layout raiz fornece
`ThemeProvider`, `QueryProvider`, `AuthProvider` e `TenantProvider`, mas a ausência de `ProtectedRoute`
permite o acesso livre.

**Comportamento de redirecionamento:** O `middleware.ts` detecta o cookie `auth_token` e redireciona
usuários já autenticados que tentam acessar `/login`, `/register` ou `/fast-login` para `/` (dashboard).

**Rotas:**

| Rota               | Descrição                                    |
| ------------------ | -------------------------------------------- |
| `/login`           | Login em duas etapas (identificador → senha) |
| `/register`        | Cadastro de novo usuário                     |
| `/select-tenant`   | Seleção de empresa após autenticação         |
| `/forgot-password` | Solicitação de redefinição de senha          |
| `/reset-password`  | Redefinição via token                        |
| `/setup-pins`      | Configuração de PIN de ação                  |
| `/fast-login`      | Login rápido para retorno ao sistema         |

---

### `(dashboard)` — Área principal (multi-tenant)

**Propósito:** Área principal do sistema, acessível apenas por usuários autenticados com tenant selecionado.
Renderiza a `Navbar` flutuante e o `ToolsPanel` (menu de navegação lateral deslizável).

**Guard:** `ProtectedRoute` verifica autenticação no client-side. Se não autenticado, redireciona para
`/fast-login`. Super admins podem navegar sem tenant selecionado; usuários comuns são redirecionados para
`/select-tenant` se `currentTenant` for nulo.

**Sub-grupos de rota internos (sem layout próprio):**

| Grupo       | Propósito                                                                              |
| ----------- | -------------------------------------------------------------------------------------- |
| `(user)`    | Páginas do usuário: perfil, configurações, debug de permissões                         |
| `(actions)` | Ações globais: importação de dados (`/import`), estúdio de etiquetas (`/print/studio`) |
| `(modules)` | Módulos de negócio agrupados por domínio                                               |
| `(tools)`   | Ferramentas transversais: agenda, e-mail, gerenciador de arquivos, tarefas             |

---

### `(central)` — Painel administrativo (super admin)

**Propósito:** Área exclusiva de super admins para gerenciamento do sistema multi-tenant (empresas, planos,
feature flags, dashboard de MRR).

**Guard:** `SuperAdminGuard` verifica `isSuperAdmin` do `AuthContext`. Se o usuário for autenticado mas não
for super admin, redireciona para `/`. Se não autenticado, redireciona para `/fast-login`.

**Tema independente:** O `CentralThemeProvider` gerencia um tema separado (`light` / `dark-blue`) persistido
no `localStorage`, completamente desacoplado do tema global do dashboard.

---

## Layout Files

### `app/layout.tsx` — Layout raiz

Renderiza o `<html>` e o `<body>`. Injeta todos os providers globais **uma única vez** para evitar
re-montagens ao navegar entre grupos de rota.

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryProvider>
              <AuthProvider>
                <TenantProvider>{children}</TenantProvider>
              </AuthProvider>
            </QueryProvider>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Providers em ordem (de fora para dentro):**

1. `ErrorBoundary` — captura erros não tratados globalmente
2. `ThemeProvider` — next-themes com detecção do sistema
3. `QueryProvider` — React Query com configurações padrão
4. `AuthProvider` — estado de autenticação e perfil do usuário
5. `TenantProvider` — tenant selecionado e lista de tenants do usuário
6. `Toaster` — notificações toast (Sonner)

---

### `(dashboard)/layout.tsx` — Layout do dashboard

```tsx
// src/app/(dashboard)/layout.tsx
'use client';
export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <PrintQueueProvider>
        <div className="min-h-screen bg-linear-to-br ...">
          {/* Efeitos de fundo (gradientes radiais estáticos) */}
          <div className="relative">
            <a href="#main-content" className="sr-only focus:not-sr-only ...">
              Pular para o conteudo principal
            </a>
            <Navbar onMenuOpen={() => setIsMenuOpen(true)} />
            <ToolsPanel isOpen={isMenuOpen} onClose={...} menuItems={menuItems} />
            <main id="main-content" tabIndex={-1} className="pt-28 px-6 pb-12">
              <div className="max-w-[1600px] mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </PrintQueueProvider>
    </ProtectedRoute>
  );
}
```

**Características:**

- `'use client'` — necessário para os hooks `useAuth`, `useTenant`, `useRouter` e o estado `isMenuOpen`
- `pt-28` no `<main>` — compensa a altura da `Navbar` flutuante fixada no topo (`top-4`)
- `max-w-[1600px] mx-auto` — limita a largura do conteúdo em telas muito largas
- `PrintQueueProvider` — carregado com `dynamic({ ssr: false })` para evitar erros de hidratação
- Link "Pular para o conteúdo principal" (`sr-only`) — acessibilidade para leitores de tela

---

### `(central)/layout.tsx` — Layout do Central

```tsx
// src/app/(central)/layout.tsx
'use client';
export default function CentralLayout({ children }) {
  return (
    <SuperAdminGuard>
      <CentralThemeProvider>
        <div className="min-h-screen relative overflow-hidden">
          <AnimatedBackground />
          <div className="relative z-10">
            <a href="#main-content" className="sr-only focus:not-sr-only ...">
              Pular para o conteudo principal
            </a>
            <CentralNavbar />
            <div className="flex">
              <CentralSidebar />
              <main id="main-content" tabIndex={-1} className="flex-1 p-8">
                <div className="max-w-[1600px] mx-auto">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </CentralThemeProvider>
    </SuperAdminGuard>
  );
}
```

**Diferenças em relação ao dashboard:**

- Usa sidebar lateral fixa (`CentralSidebar`) em vez de painel deslizável
- `AnimatedBackground` renderiza esferas animadas com gradientes azul-escuro
- Importa `./central.css` para as classes utilitárias `central-text`, `central-glass`, etc.
- Tema independente via `CentralThemeProvider` — não herda o tema do dashboard

---

## Page Structure

### Padrão: Página de Landing do Módulo

Cada módulo de negócio (stock, hr, finance) possui uma `page.tsx` raiz que funciona como portal de navegação.
A estrutura é padronizada e compartilha os mesmos componentes de layout.

```
ModuloLandingPage
  ├── PageActionBar          ← breadcrumb + botões de ação rápida (com filtro de permissão)
  ├── PageHeroBanner         ← card hero com título, descrição, ícone e botões principais
  └── PageDashboardSections  ← seções com cards de navegação (filtrados por permissão + contadores)
```

**Exemplo real — `(dashboard)/(modules)/stock/page.tsx`:**

```tsx
export default function StockLandingPage() {
  const { hasPermission } = usePermissions();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  // Busca contagens em paralelo com Promise.allSettled (falhas individuais não quebram a página)
  useEffect(() => {
    async function fetchCounts() {
      const [products, items, ...] = await Promise.allSettled([
        productsService.listProducts(),
        itemsService.listItems(),
        // ...
      ]);
      setCounts({ products: products.status === 'fulfilled' ? products.value.products.length : null });
      setCountsLoading(false);
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-8">
      <PageActionBar
        breadcrumbItems={[{ label: 'Estoque', href: '/stock' }]}
        actionButtons={actionButtons}
        hasPermission={hasPermission}
      />
      <PageHeroBanner
        title="Estoque"
        description="Gerencie produtos, movimentações..."
        icon={Package}
        iconGradient="from-emerald-500 to-emerald-600"
        buttons={heroBannerButtons}
        hasPermission={hasPermission}
      />
      <PageDashboardSections
        sections={sections}
        counts={counts}
        countsLoading={countsLoading}
        hasPermission={hasPermission}
      />
    </div>
  );
}
```

---

### Padrão: Página de Lista de Entidade

Páginas que exibem coleções de entidades com busca, filtros, grid/lista alternável e ações em lote.
Utiliza o sistema `CoreProvider` + hooks `useEntityCrud` e `useEntityPage`.

```
ProductsPage (Suspense boundary)
  └── ProductsPageContent
        └── CoreProvider (selection namespace)
              └── PageLayout
                    ├── PageHeader
                    │     ├── PageActionBar    ← breadcrumb + botões (filtrados por permissão)
                    │     └── Header           ← título + descrição
                    └── PageBody
                          ├── SearchBar        ← busca por texto (filtragem client-side)
                          ├── GridLoading / GridError / EntityGrid
                          │     └── FilterDropdown (Template | Fabricante | Categoria)
                          ├── SelectionToolbar ← aparece quando há itens selecionados
                          ├── Dialog (create)  ← modal de criação
                          ├── Dialog (edit)    ← modal de edição
                          ├── VerifyActionPinModal (delete)
                          └── modals de ações rápidas (rename, assign...)
```

**Características importantes:**

- A página exporta um componente raiz que envolve o conteúdo real em `<Suspense>` para suportar `useSearchParams()`
- Filtros via URL (`?template=id1,id2&manufacturer=id3`) permitem bookmarking e compartilhamento
- Botões de ação no header são filtrados via `hasPermission()` antes de serem renderizados
- Estado de seleção múltipla é gerenciado pelo `CoreProvider` com namespace por entidade

---

### Padrão: Página de Detalhe

Páginas que exibem todos os dados de uma entidade específica, identificada por `[id]` na URL.

```tsx
// src/app/(dashboard)/(modules)/stock/(entities)/products/[id]/page.tsx
export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['products', productId],
    queryFn: async () => {
      const response = await productsService.getProduct(productId);
      return response.product;
    },
    refetchOnMount: 'always', // Dados sempre frescos ao montar
  });

  // Estado de carregamento inline (não usa loading.tsx — é granular)
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Estado de não-encontrado inline
  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Produto não encontrado</h2>
          <Button onClick={() => router.push('/stock/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Produtos
          </Button>
        </Card>
      </div>
    );
  }

  return <ProductViewer product={product} variants={variants} ... />;
}
```

---

### Padrão: Página de Edição

Páginas de formulário para atualizar entidades existentes. Utilizam `useState` para estado do formulário
(não `react-hook-form` quando há coerção de tipos complexa), com `Tabs` para agrupar seções.

```
EditProductPage
  ├── PageBreadcrumb       ← breadcrumb com 4 níveis (módulo → lista → detalhe → editar)
  ├── Botões de ação       ← "Excluir" (outline) + "Salvar" (default), no header
  ├── Card de informações  ← dados do produto + ícones de cuidado
  └── Tabs
        ├── "Informações Gerais"   ← campos principais + atributos personalizados
        ├── "Variantes"            ← VariantManager
        └── "Modo de Conservação"  ← CareSelector
```

**Convenções da página de edição:**

- Breadcrumb sempre tem o formato: `Módulo → Lista → Nome do item → Editar`
- Botões "Salvar" e "Excluir" ficam no canto superior direito ao lado do breadcrumb
- O estado de loading é inline (skeleton ou texto) — não usa `loading.tsx`
- Erros de submissão são exibidos como toasts via Sonner (`toast.error(...)`)
- Após salvar com sucesso, redireciona para a página de detalhe com `router.push()`
- `AlertDialog` é usado para confirmação de exclusão destrutiva

---

### Padrão: Página do Central

Páginas do painel administrativo seguem uma estrutura própria com componentes glass.

```tsx
// src/app/(central)/central/page.tsx
export default function CentralDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { theme } = useCentralTheme();

  return (
    <div className="space-y-6 pb-8">
      <PageBreadcrumb items={[{ label: 'Central', href: '/central' }]} />
      <div>
        <h1 className="text-2xl font-bold central-text">Painel Central</h1>
        <p className="text-sm central-text-muted">...</p>
      </div>
      {/* Stats com StatCard */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de Empresas" value={stats?.totalTenants} icon={Building2} ... />
      </div>
      {/* Gráficos com GlassCard + recharts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <ResponsiveContainer><LineChart data={growthData}>...</LineChart></ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
```

**Componentes exclusivos do Central:**

- `GlassCard` — card com efeito glassmorphism adaptado ao tema `dark-blue`
- `StatCard` — card de métrica com ícone, valor e cor customizável
- `AnimatedBackground` — esferas animadas com gradientes
- Classes CSS: `central-text`, `central-text-muted`, `central-glass`, `central-glass-subtle`

---

## Loading States

O Next.js App Router renderiza automaticamente o arquivo `loading.tsx` mais próximo durante a navegação
e o Suspense de Server Components. O OpenSea-APP possui 10 arquivos `loading.tsx` estrategicamente posicionados.

### Posicionamento dos arquivos `loading.tsx`

| Arquivo                                             | Quando é exibido                          |
| --------------------------------------------------- | ----------------------------------------- |
| `app/(dashboard)/loading.tsx`                       | Carregamento da página de boas-vindas     |
| `app/(dashboard)/(modules)/stock/loading.tsx`       | Navegação para `/stock`                   |
| `app/(dashboard)/(modules)/hr/loading.tsx`          | Navegação para `/hr`                      |
| `app/(dashboard)/(modules)/hr/overview/loading.tsx` | Navegação para `/hr/overview`             |
| `app/(dashboard)/(modules)/finance/loading.tsx`     | Navegação para `/finance`                 |
| `app/(dashboard)/(tools)/calendar/loading.tsx`      | Navegação para `/calendar`                |
| `app/(dashboard)/(tools)/email/loading.tsx`         | Navegação para `/email`                   |
| `app/(dashboard)/(tools)/file-manager/loading.tsx`  | Navegação para `/file-manager`            |
| `app/(dashboard)/(tools)/tasks/loading.tsx`         | Navegação para `/tasks`                   |
| `app/(central)/loading.tsx`                         | Navegação para qualquer rota `/central/*` |

### Anatomia do skeleton padrão

Todos os `loading.tsx` seguem o mesmo padrão estrutural: header (título + botão) → cards de métricas → área de conteúdo.

```tsx
// Padrão para módulos de negócio (stock, hr, finance)
import { Skeleton } from '@/components/ui/skeleton';

export default function StockLoading() {
  return (
    <div className="space-y-6">
      {/* Header: título + botão de ação */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Área de conteúdo principal */}
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
```

### Skeleton para layouts especializados

Ferramentas com layout diferenciado usam skeletons que refletem sua estrutura real:

```tsx
// Email: sidebar + lista de mensagens (dois painéis)
export default function EmailLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-64 space-y-3">
        {' '}
        {/* Sidebar */}
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-2">
        {' '}
        {/* Lista de mensagens */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Calendar: header + área do calendário completo
export default function CalendarLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <Skeleton className="h-[600px] w-full rounded-xl" />
    </div>
  );
}
```

**Importante:** Para carregamentos dentro de uma página já montada (ex: lista de entidades após navegação
client-side), o loading é feito inline na página usando `isLoading` do React Query + componentes
`GridLoading` ou `Skeleton` — **não** pelo `loading.tsx` do App Router.

---

## Error Boundaries

O App Router suporta `error.tsx` para capturar erros em segmentos de rota. O OpenSea-APP possui 4 arquivos
`error.tsx`, um por grupo de rota principal.

### Hierarquia dos error boundaries

```
app/error.tsx           ← GlobalError (fallback final — min-h-screen centralizado)
  ├── (auth)/error.tsx  ← AuthError   (redireciona para /login)
  ├── (dashboard)/error.tsx  ← DashboardError  (redireciona para /)
  └── (central)/error.tsx   ← CentralError    (redireciona para /central)
```

### Anatomia de um `error.tsx`

Todos os `error.tsx` são `'use client'` (obrigatório pelo Next.js), recebem `error` e `reset`, e seguem
o mesmo padrão visual: texto explicativo + dois botões (voltar / tentar novamente).

```tsx
// src/app/(dashboard)/error.tsx
'use client';
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DashboardError]', error); // Log para monitoramento
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold ...">
            Erro ao carregar a página
          </h2>
          <p className="text-sm ...">Seus dados estão seguros.</p>
          {error.digest && (
            <p className="text-xs font-mono">Referência: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.assign('/')}>
            Página inicial
          </Button>
          <Button onClick={reset}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  );
}
```

**Diferenças por área:**

| Arquivo                 | Título                          | Botão "Voltar"      | Destino    |
| ----------------------- | ------------------------------- | ------------------- | ---------- |
| `app/error.tsx`         | "Algo deu errado"               | "Voltar ao início"  | `/`        |
| `(auth)/error.tsx`      | "Erro na autenticação"          | "Voltar ao login"   | `/login`   |
| `(dashboard)/error.tsx` | "Erro ao carregar a página"     | "Página inicial"    | `/`        |
| `(central)/error.tsx`   | "Erro no painel administrativo" | "Voltar ao Central" | `/central` |

### `not-found.tsx` global

```tsx
// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center ...">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl font-bold text-slate-200 dark:text-slate-800">
          404
        </div>
        <h2 className="text-xl font-semibold ...">Página não encontrada</h2>
        <p className="text-sm ...">
          A página que você procura não existe ou foi movida.
        </p>
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## Middleware

O arquivo `src/middleware.ts` é a primeira camada de proteção, executada no Edge Runtime antes do
carregamento de qualquer página.

```ts
// src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Rotas públicas (qualquer rota /central/* também é pública aqui)
  const publicRoutes = [
    '/login',
    '/fast-login',
    '/register',
    '/',
    '/select-tenant',
  ];
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith('/central');

  // Redireciona usuários autenticados que tentam acessar login/register
  if (
    token &&
    (pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/fast-login')
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Permite acesso a rotas públicas sem verificação de token
  if (isPublicRoute) return NextResponse.next();

  // Para todas as outras rotas, permite (verificação real ocorre no AuthContext)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Limitações conhecidas:** O middleware não tem acesso ao `localStorage`. A verificação completa de
autenticação (e permissões) é feita no client-side pelos componentes `ProtectedRoute` e `SuperAdminGuard`.
A verificação no middleware serve apenas para evitar que usuários autenticados acessem as páginas de login.

---

## Permission Gating

O sistema de controle de acesso opera em três níveis na interface:

### Nível 1: Guard de rota (`ProtectedRoute` / `SuperAdminGuard`)

Protege segmentos inteiros de rota. Redireciona o usuário se não tiver acesso.

```tsx
// Automático via layout — não é necessário em páginas individuais
<ProtectedRoute requiredPermission="stock.products.read">
  <ProductsPage />
</ProtectedRoute>
```

### Nível 2: Verificação imperativa em páginas (`usePermissions`)

Filtra botões, seções e cards com base nas permissões do usuário atual.

```tsx
// src/app/(dashboard)/(modules)/stock/(entities)/products/page.tsx
const { hasPermission } = usePermissions();

// Filtra botões do header
const visibleActionButtons = actionButtons
  .filter(btn => (btn.permission ? hasPermission(btn.permission) : true))
  .map(({ permission, ...btn }) => btn);

// Filtra cards do módulo landing
const visibleModules = moduleCards.filter(
  card => !card.permission || hasPermission(card.permission)
);
```

### Nível 3: Componente `PermissionGate` (renderização condicional)

Oculta ou substitui elementos individuais (botões, campos, menus) sem redirecionar.

```tsx
import { PermissionGate, CanCreate, CanDelete } from '@/components/auth/permission-gate';

// Permissão única — oculta o botão se não tiver acesso
<PermissionGate permission="hr.employees.create">
  <Button>Novo Funcionário</Button>
</PermissionGate>

// Com fallback — mostra algo quando não tem permissão
<PermissionGate
  permission="stock.products.delete"
  fallback={<Button disabled>Excluir</Button>}
>
  <Button variant="destructive">Excluir</Button>
</PermissionGate>

// Múltiplas permissões (OR) — basta ter uma
<PermissionGate permission={['hr.employees.update', 'hr.employees.delete']}>
  <EditMenu />
</PermissionGate>

// Todas as permissões (AND)
<PermissionGate permission={['admin.companies.read', 'admin.companies.update']} requireAll>
  <FullEditor />
</PermissionGate>

// Atalhos de conveniência
<CanCreate entity="hr.employees"><Button>Criar</Button></CanCreate>
<CanUpdate entity="hr.employees"><Button>Editar</Button></CanUpdate>
<CanDelete entity="hr.employees"><Button>Excluir</Button></CanDelete>
```

**Comportamento durante carregamento:** `PermissionGate` retorna `null` enquanto `usePermissions` carrega.
Isso evita flickering de conteúdo não autorizado antes da verificação completar.

---

## Dynamic Routes

O padrão `[id]` é usado uniformemente para rotas de detalhe e edição.

### Estrutura padrão de entidade

```
(entities)/products/
  page.tsx                    ← lista de produtos (/stock/products)
  [id]/
    page.tsx                  ← detalhe do produto (/stock/products/:id)
    edit/
      page.tsx                ← edição do produto (/stock/products/:id/edit)
```

### Acesso ao parâmetro dinâmico

```tsx
// Em páginas Client Component
const params = useParams();
const productId = params.id as string;

// Em páginas Server Component (se necessário)
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
}
```

### Rotas dinâmicas com múltiplos segmentos

Algumas rotas possuem múltiplos parâmetros aninhados:

```
locations/
  [warehouseId]/
    page.tsx                             ← detalhe do armazém
    zones/[zoneId]/
      page.tsx                           ← detalhe da zona
      layout/page.tsx                    ← layout visual da zona
      structure/page.tsx                 ← estrutura da zona

import/stock/variants/by-product/
  [productId]/page.tsx                   ← importação de variantes por produto
```

---

## Files

### Layouts e páginas raiz

| Arquivo                           | Propósito                         |
| --------------------------------- | --------------------------------- |
| `src/app/layout.tsx`              | Layout raiz com providers globais |
| `src/app/error.tsx`               | Error boundary global             |
| `src/app/not-found.tsx`           | Página 404 global                 |
| `src/app/(auth)/error.tsx`        | Error boundary da área de auth    |
| `src/app/(dashboard)/layout.tsx`  | Layout do dashboard com Navbar    |
| `src/app/(dashboard)/error.tsx`   | Error boundary do dashboard       |
| `src/app/(dashboard)/loading.tsx` | Skeleton do dashboard             |
| `src/app/(dashboard)/page.tsx`    | Página de boas-vindas             |
| `src/app/(central)/layout.tsx`    | Layout do Central com sidebar     |
| `src/app/(central)/error.tsx`     | Error boundary do Central         |
| `src/app/(central)/loading.tsx`   | Skeleton do Central               |

### Componentes de layout

| Arquivo                                             | Propósito                                  |
| --------------------------------------------------- | ------------------------------------------ |
| `src/components/layout/navbar.tsx`                  | Navbar flutuante do dashboard              |
| `src/components/layout/tools-panel.tsx`             | Painel deslizável de navegação por módulos |
| `src/components/layout/page-layout.tsx`             | `PageLayout`, `PageHeader`, `PageBody`     |
| `src/components/layout/page-action-bar.tsx`         | Barra de ação com breadcrumb + botões      |
| `src/components/layout/page-breadcrumb.tsx`         | Componente de breadcrumb                   |
| `src/components/layout/page-hero-banner.tsx`        | Banner hero de landing de módulo           |
| `src/components/layout/page-dashboard-sections.tsx` | Grid de cards com contadores               |
| `src/components/layout/header.tsx`                  | Título e descrição da página               |
| `src/components/layout/search-bar.tsx`              | Barra de busca padronizada                 |

### Guards de autenticação

| Arquivo                                     | Propósito                               |
| ------------------------------------------- | --------------------------------------- |
| `src/components/auth/protected-route.tsx`   | Guard para usuários autenticados        |
| `src/components/auth/super-admin-guard.tsx` | Guard exclusivo para super admins       |
| `src/components/auth/permission-gate.tsx`   | Gate de permissão granular por elemento |
| `src/middleware.ts`                         | Verificação de cookie no Edge Runtime   |

---

## Rules

### Quando usar cada abordagem

| Situação                                    | Abordagem                                                        |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Proteger uma área inteira de rota           | `layout.tsx` com `ProtectedRoute` ou `SuperAdminGuard`           |
| Ocultar botões/ações sem permissão          | `PermissionGate` ou verificação imperativa com `hasPermission()` |
| Feedback durante navegação entre páginas    | `loading.tsx` no diretório da rota                               |
| Feedback durante fetch dentro de uma página | `isLoading` do React Query + `Skeleton` inline                   |
| Rota acessível sem autenticação             | Adicionar em `publicRoutes` no `middleware.ts`                   |
| Rota exclusiva de super admin               | Usar `(central)/layout.tsx` ou `SuperAdminGuard` diretamente     |

### Armadilhas comuns

1. **`useSearchParams()` sem `Suspense`:** Qualquer componente que chama `useSearchParams()` deve estar
   dentro de um boundary `<Suspense>`. O padrão do projeto é exportar um componente raiz simples que
   envolve o conteúdo real em `<Suspense>`:

   ```tsx
   export default function ProductsPage() {
     return (
       <Suspense
         fallback={
           <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
         }
       >
         <ProductsPageContent />
       </Suspense>
     );
   }
   function ProductsPageContent() {
     const searchParams = useSearchParams(); // Seguro aqui
     // ...
   }
   ```

2. **`loading.tsx` vs skeleton inline:** O `loading.tsx` só é ativado durante navegação entre páginas
   (Server Components ou Suspense de layout). Para estados de carregamento de dados dentro de uma página
   já renderizada, use sempre `isLoading` do React Query com `Skeleton` ou `GridLoading` inline.

3. **`'use client'` em layouts:** Os layouts `(dashboard)` e `(central)` são `'use client'` porque
   usam hooks (`useAuth`, `useTenant`, `useState`). Isso não é um problema de performance — eles não
   re-renderizam a árvore de Server Components filhos.

4. **Verificação de permissão no servidor:** O projeto não usa verificação de permissão server-side nas
   páginas. Toda autorização é client-side via `usePermissions()`. Não adicionar lógica de permissão
   em Server Components sem alinhar com o padrão existente.

5. **Rotas `/central/*` no middleware:** O middleware marca todas as rotas `/central/*` como públicas
   (`isPublicRoute`). A proteção real é feita pelo `SuperAdminGuard` no layout client-side. Isso é
   intencional para evitar complexidade no Edge Runtime.

---

## Audit History

| Date       | Dimension            | Score | Report                                                                             |
| ---------- | -------------------- | ----- | ---------------------------------------------------------------------------------- |
| 2026-03-10 | Documentação inicial | —     | Análise completa de `src/app/`, layouts, guards, loading states e error boundaries |
