# Pattern: Context & State Management

## Problem

Aplicações multi-tenant com autenticação JWT exigem que múltiplas camadas de estado coexistam de forma coerente: dados do usuário autenticado, tenant selecionado, tema da interface, permissões de RBAC e estado de UI local. O desafio é evitar:

- Re-renders desnecessários por contextos muito amplos
- Vazamento de dados entre tenants ao trocar de empresa
- Inconsistência entre token JWT e estado React
- Mistura de responsabilidades entre estado de servidor e estado de cliente

A solução adotada no OpenSea-APP separa claramente as responsabilidades: **React Context para estado global de cliente** (autenticação, tenant, tema) e **React Query para estado de servidor** (dados do backend via fetch).

---

## Solution

O sistema de estado é organizado em quatro camadas sobrepostas:

```
┌─────────────────────────────────────────────────────┐
│  ThemeProvider (next-themes)                        │  ← Tema global (light/dark/system)
│  ┌───────────────────────────────────────────────┐  │
│  │  QueryProvider (React Query singleton)        │  │  ← Cache de servidor (TTL, GC)
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  AuthProvider                           │  │  │  ← Usuário, tokens, login/logout
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │  TenantProvider                   │  │  │  │  ← Tenant selecionado, JWT scoped
│  │  │  │  ┌─────────────────────────────┐  │  │  │  │
│  │  │  │  │  [children]                 │  │  │  │  │  ← Páginas e layouts
│  │  │  │  └─────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

Contextos de escopo mais restrito (como `CentralThemeProvider`, `PrintQueueProvider`, `SelectionProvider`) são inseridos nos layouts específicos das seções que os necessitam, em vez de no root.

---

## Architecture Decision: Context vs. React Query vs. Local State

| Tipo de Estado                        | Mecanismo                               | Exemplos                                  |
| ------------------------------------- | --------------------------------------- | ----------------------------------------- |
| Identidade do usuário autenticado     | `AuthContext`                           | `user`, `isSuperAdmin`, `isAuthenticated` |
| Tenant selecionado e lista de tenants | `TenantContext`                         | `currentTenant`, `tenants`                |
| Tema visual                           | `ThemeProvider` / `CentralThemeContext` | `theme`, `toggleTheme`                    |
| Dados do servidor com cache           | React Query (`useQuery`)                | produtos, funcionários, permissões        |
| Mutações no servidor                  | React Query (`useMutation`)             | criar/atualizar/deletar                   |
| UI local (formulários, modais, abas)  | `useState`                              | `isOpen`, `activeTab`, `formValues`       |
| Seleção múltipla de itens em lista    | `SelectionContext`                      | `selectedIds`, `selectItem`               |
| Fila de impressão de etiquetas        | `PrintQueueContext`                     | `queue`, `addToQueue`                     |

**Regra geral:** use Context apenas para estado que precisa ser compartilhado entre múltiplos componentes não relacionados na árvore. Para tudo que vem do servidor, use React Query.

---

## Implementation

### Provider Composition (Root Layout)

O arquivo `src/app/layout.tsx` define a ordem exata de composição de todos os providers globais:

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

A ordem é deliberada: `ThemeProvider` fica fora do `QueryProvider` porque não depende de estado de servidor. `AuthProvider` fica dentro do `QueryProvider` porque utiliza `useLogin`, `useLogout` e `useMe` (React Query mutations/queries). `TenantProvider` fica dentro do `AuthProvider` porque depende do token gerado pelo login.

---

### AuthContext (`src/contexts/auth-context.tsx`)

Responsável por toda a lógica de autenticação do usuário. Expõe um hook `useAuth()` que retorna:

```typescript
interface AuthContextType {
  user: User | null; // dados do usuário (via GET /v1/me)
  isLoading: boolean; // carregando dados do usuário
  isAuthenticated: boolean; // tem token válido + dados carregados
  isSuperAdmin: boolean; // campo do JWT payload
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void; // força recarregamento de /v1/me
}
```

**Estado interno:** O `AuthProvider` mantém um estado reativo `hasToken` que reflete a presença do token no `localStorage`. Esse estado é atualizado via dois mecanismos:

1. Evento nativo `storage` do browser — captura mudanças de **outras abas**
2. Evento customizado `auth-token-change` — captura mudanças na **mesma aba**

```tsx
// Detecta mudanças de token em tempo real
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === authConfig.tokenKey || e.key === authConfig.refreshTokenKey) {
      setHasToken(!!localStorage.getItem(authConfig.tokenKey));
    }
  };
  const handleTokenChange = () => {
    setHasToken(!!localStorage.getItem(authConfig.tokenKey));
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('auth-token-change', handleTokenChange);
  return () => {
    /* cleanup */
  };
}, []);
```

**Fluxo de login:** Após autenticação bem-sucedida, o `login()` salva os tokens, dispara `refetchUser()`, e salva a conta no sistema de Fast Login. Se o backend retornar um tenant pré-selecionado (usuário com apenas um tenant), o evento `tenant-refreshed` é disparado para o `TenantProvider`:

```tsx
if (response.tenant) {
  localStorage.setItem('selected_tenant_id', response.tenant.id);
  window.dispatchEvent(
    new CustomEvent('tenant-refreshed', { detail: response.tenant })
  );
}
```

**Redirecionamento automático:** O `AuthProvider` observa erros do `useMe` e redireciona para `/fast-login?session=expired` em caso de token inválido (HTTP 401/403), mas apenas se o usuário não estiver em uma rota pública.

**Proteção contra hydration mismatch:** O estado inicial de `hasToken` é calculado via função lazy do `useState`, que só acessa `localStorage` no cliente:

```tsx
const [hasToken, setHasToken] = useState(() => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(authConfig.tokenKey);
});
```

---

### TenantContext (`src/contexts/tenant-context.tsx`)

Gerencia a seleção de tenant em um sistema multi-tenant. Expõe `useTenant()`:

```typescript
interface TenantContextType {
  currentTenant: UserTenant | null; // tenant ativo
  tenants: UserTenant[]; // todos os tenants do usuário
  isLoading: boolean;
  isInitialized: boolean; // hidratação inicial concluída
  selectTenant: (tenantId: string) => Promise<void>;
  clearTenant: () => void;
  refreshTenants: () => Promise<UserTenant[]>;
}
```

**Comportamento crítico ao trocar de tenant:** Ao selecionar um tenant, o `TenantProvider` chama `queryClient.clear()` para **apagar todo o cache do React Query**. Isso evita vazamento de dados entre tenants — por exemplo, ver produtos do Tenant A enquanto se está no Tenant B:

```tsx
const selectTenant = useCallback(
  async (tenantId: string) => {
    const data = await apiClient.post<SelectTenantResponse>(
      API_ENDPOINTS.TENANTS.SELECT,
      { tenantId }
    );

    // CRÍTICO: Limpar todo o cache do React Query antes de trocar de tenant
    queryClient.clear();

    // Atualiza o token com o JWT escopado ao tenant
    localStorage.setItem(authConfig.tokenKey, data.token);
    localStorage.setItem('selected_tenant_id', data.tenant.id);

    window.dispatchEvent(new CustomEvent('auth-token-change'));
  },
  [tenants]
);
```

**Auto-hidratação:** Na montagem inicial, o provider verifica se há um `selected_tenant_id` no `localStorage` e um token válido. Se sim, carrega a lista de tenants e restaura o tenant salvo automaticamente. O flag `isInitialized` é definido como `true` ao término desse processo — o dashboard aguarda `isInitialized === true` antes de redirecionar:

```tsx
// src/app/(dashboard)/layout.tsx
const { currentTenant, isLoading, isInitialized } = useTenant();

useEffect(() => {
  if (!isAuthenticated || isLoading || !isInitialized) return;
  if (!currentTenant && !isSuperAdmin) {
    router.push('/select-tenant');
  }
}, [currentTenant, isAuthenticated, isLoading, isInitialized, isSuperAdmin]);
```

**Validação de consistência JWT vs. localStorage:** O `TenantProvider` decodifica o JWT atual e valida se o `tenantId` no payload corresponde ao `selected_tenant_id` salvo. Se houver inconsistência (ex: token sem `tenantId` mas `localStorage` com ID salvo), a sessão é limpa:

```tsx
const payload = decodeJWT(token);
if (storedTenantId && !payload.tenantId) {
  clearAuthAndTenant(); // limpa localStorage + queryClient.clear()
}
```

**Comunicação entre contextos via eventos customizados:**

| Evento              | Emissor                                          | Receptor                         | Propósito                              |
| ------------------- | ------------------------------------------------ | -------------------------------- | -------------------------------------- |
| `auth-token-change` | `TokenManager`, `TenantProvider`, `AuthProvider` | `AuthProvider`, `TenantProvider` | Sincronizar estado ao mudar token      |
| `tenant-refreshed`  | `AuthProvider` (login), `TokenManager` (refresh) | `TenantProvider`                 | Restaurar tenant após refresh de token |

---

### ThemeProvider — Tema Global (`src/components/theme-provider.tsx`)

Wrapper fino sobre `next-themes`. Aplicado no root layout com `attribute="class"` para controlar o tema via classe CSS no `<html>`:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

O tema global suporta `light`, `dark` e `system` (segue preferência do sistema operacional). O `next-themes` persiste a escolha no `localStorage` sob a chave `theme`.

---

### CentralThemeContext — Tema da Área Central (`src/contexts/central-theme-context.tsx`)

Contexto específico da área `/central` (painel de super admin). Gerencia um tema independente do tema global, com paleta azul escura exclusiva:

```typescript
type Theme = 'light' | 'dark-blue';

interface CentralThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void; // alterna entre 'dark-blue' e 'light'
}
```

O tema padrão é `'dark-blue'`. A persistência é feita na chave `central-theme` do `localStorage`. A aplicação do tema ocorre via classe CSS no `document.documentElement`:

```tsx
const applyTheme = (newTheme: Theme) => {
  const root = document.documentElement;
  root.classList.remove('dark-blue', 'light');
  root.classList.add(newTheme);
};
```

O `CentralThemeProvider` é inserido exclusivamente no `src/app/(central)/layout.tsx`, **dentro** do `SuperAdminGuard`, garantindo que o contexto só existe para super admins:

```tsx
// src/app/(central)/layout.tsx
<SuperAdminGuard>
  <CentralThemeProvider>
    <CentralNavbar />
    <CentralSidebar />
    <main>{children}</main>
  </CentralThemeProvider>
</SuperAdminGuard>
```

---

### QueryProvider — Estado de Servidor (`src/providers/query-provider.tsx`)

Instância singleton do `QueryClient`, exportada para uso direto em contextos que precisam invalidar cache fora de componentes React (como o `TenantProvider`):

```tsx
// Configuração global de todas as queries
const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // dados ficam "frescos" por 5 minutos
      gcTime: 1000 * 60 * 10, // dados removidos do cache após 10 min sem uso
      refetchOnWindowFocus: false, // não refetch ao voltar para a aba
      retry: 1, // retenta 1 vez em caso de erro
    },
    mutations: {
      retry: false, // mutações não são retentadas
    },
  },
};

// Singleton — importado pelo TenantProvider para queryClient.clear()
export const queryClient = new QueryClient(defaultQueryClientOptions);
```

---

### SelectionContext (`src/contexts/selection-context.tsx`)

Contexto de UI para gerenciar seleção múltipla de itens em listas. Não é um provider global — deve ser instanciado em cada página que necessite de seleção múltipla:

```typescript
interface SelectionContextData {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  isSelecting: boolean; // drag selection em andamento
  selectItem: (id: string, event?: React.MouseEvent) => void;
  toggleSelection: (id: string) => void;
  selectRange: (startId: string, endId: string, allIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  selectMultiple: (ids: string[]) => void;
  startDragSelection: () => void;
  endDragSelection: () => void;
  addToDragSelection: (id: string) => void;
}
```

Suporta os padrões de seleção comuns em sistemas de arquivos e grids:

- **Click simples:** seleciona apenas o item clicado
- **Ctrl+Click / Cmd+Click:** adiciona/remove da seleção
- **Shift+Click:** seleção em range (requer `allIds` da página)
- **Drag selection:** arrastar para selecionar múltiplos itens

O módulo `src/core/selection/` contém uma implementação alternativa mais robusta, usada pelo `CoreProvider` em listagens do sistema core. O `SelectionProvider` em `src/contexts/selection-context.tsx` é a versão legada.

---

### PrintQueueContext (`src/core/print-queue/context/print-queue-context.tsx`)

Contexto de escopo restrito para gerenciar a fila de impressão de etiquetas. É inserido apenas no `(dashboard)/layout.tsx` via `PrintQueueProvider` com carregamento lazy:

```tsx
// src/app/(dashboard)/layout.tsx
const PrintQueueProvider = dynamic(
  () => import('@/core/print-queue').then(m => m.PrintQueueProvider),
  { ssr: false } // Não renderizado no servidor
);
```

O estado da fila é persistido no `localStorage` via `loadFromStorage()` / `saveToStorage()`.

---

## Custom Hooks

Cada contexto expõe um hook dedicado que lança erro se usado fora do provider correspondente:

| Hook                | Contexto                                            | Proteção                                                                      |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `useAuth()`         | `AuthProvider`                                      | `throw new Error('useAuth must be used within an AuthProvider')`              |
| `useTenant()`       | `TenantProvider`                                    | `throw new Error('useTenant must be used within a TenantProvider')`           |
| `useCentralTheme()` | `CentralThemeProvider`                              | `throw new Error('useCentralTheme must be used within CentralThemeProvider')` |
| `useSelection()`    | `SelectionProvider`                                 | `throw new Error('useSelection deve ser usado dentro de SelectionProvider')`  |
| `usePermissions()`  | Composição de `useAuth` + `useTenant` + React Query | Herda proteções dos contextos dependentes                                     |

---

## usePermissions — Hook Composto

O hook `usePermissions()` em `src/hooks/use-permissions.ts` é um exemplo de composição: combina `useAuth`, `useTenant` e uma query React Query para fornecer verificação de permissões:

```tsx
export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  const { data: effectivePermissions = [], isLoading } = useQuery({
    queryKey: ['my-permissions', user?.id, currentTenant?.id],
    queryFn: () => listMyPermissions(), // GET /v1/me/permissions
    enabled: !!user?.id && !!currentTenant, // só busca com tenant selecionado
    staleTime: 15 * 60 * 1000, // permissões ficam frescas por 15 min
    gcTime: 30 * 60 * 1000,
  });

  const permissions = useMemo(
    () => createPermissionMap(effectivePermissions),
    [effectivePermissions]
  );

  return {
    hasPermission: code => isPermissionAllowed(permissions, code),
    hasAnyPermission: (...codes) =>
      codes.some(c => isPermissionAllowed(permissions, c)),
    hasAllPermissions: (...codes) =>
      codes.every(c => isPermissionAllowed(permissions, c)),
    isDenied: code => isPermissionDenied(permissions, code),
    isLoading,
  };
}
```

A query key inclui `user?.id` e `currentTenant?.id` — ao trocar de tenant, o React Query trata como uma query diferente e busca as permissões do novo contexto.

---

## localStorage Persistence

Mapa completo do que é armazenado no `localStorage`:

| Chave                    | Responsável                    | Conteúdo                            | Limpeza                                   |
| ------------------------ | ------------------------------ | ----------------------------------- | ----------------------------------------- |
| `auth_token`             | `AuthProvider`, `TokenManager` | JWT de acesso (escopo de tenant)    | `logout()`, refresh falho, token inválido |
| `refresh_token`          | `AuthProvider`, `TokenManager` | JWT de refresh (single-use)         | `logout()`, refresh falho                 |
| `session_id`             | `AuthProvider`                 | ID da sessão no servidor            | `logout()`                                |
| `selected_tenant_id`     | `TenantProvider`               | UUID do tenant selecionado          | `clearTenant()`, `clearAuthAndTenant()`   |
| `theme`                  | `next-themes`                  | `'light'` \| `'dark'` \| `'system'` | Nunca (preferência do usuário)            |
| `central-theme`          | `CentralThemeContext`          | `'light'` \| `'dark-blue'`          | Nunca (preferência do usuário)            |
| `opensea_saved_accounts` | `saved-accounts.ts`            | JSON com contas do Fast Login       | Usuário remove manualmente                |
| `print-queue-*`          | `PrintQueueContext`            | Estado da fila de impressão         | Após impressão concluída                  |

---

## Guard Components

Dois componentes protegem rotas baseados no estado dos contextos:

### ProtectedRoute

Usado no `(dashboard)/layout.tsx`. Verifica autenticação e, opcionalmente, permissões específicas:

```tsx
<ProtectedRoute
  requiredPermission="stock.products.read.all"
  // ou requiredPermissions={['stock.products.read', 'stock.products.read.all']}
  // ou requireAll={true} (AND em vez de OR)
>
  <ProductsPage />
</ProtectedRoute>
```

Renderiza um spinner enquanto `isAuthLoading || isPermissionsLoading` for verdadeiro, evitando flash de conteúdo não autorizado.

### SuperAdminGuard

Usado no `(central)/layout.tsx`. Verifica `isSuperAdmin` do `AuthContext` e redireciona para `/` se o usuário não for super admin:

```tsx
<SuperAdminGuard>
  <CentralThemeProvider>
    {/* Área exclusiva de super admins */}
  </CentralThemeProvider>
</SuperAdminGuard>
```

---

## Token Refresh — Integração com Contextos

O `TokenManager` em `src/lib/api-client-auth.ts` opera de forma independente do React, mas se comunica com os contextos via eventos customizados. Ao fazer refresh com sucesso:

1. Salva os novos tokens no `localStorage`
2. Dispara `auth-token-change` → `AuthProvider` reage e verifica o estado
3. Se o response de refresh incluir `tenant.id`, dispara `tenant-refreshed` → `TenantProvider` restaura o tenant

O sistema de refresh usa um **lock por promise** para evitar múltiplas chamadas simultâneas ao endpoint `/v1/sessions/refresh` (limitado a 10 req/min no backend). O refresh token é **single-use**: ao usar, o backend retorna um novo par de tokens.

---

## Files

| Arquivo                                                | Propósito                                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `src/app/layout.tsx`                                   | Composição de providers globais — ordem e hierarquia                             |
| `src/contexts/auth-context.tsx`                        | `AuthProvider` + `useAuth()`                                                     |
| `src/contexts/tenant-context.tsx`                      | `TenantProvider` + `useTenant()`                                                 |
| `src/contexts/central-theme-context.tsx`               | `CentralThemeProvider` + `useCentralTheme()`                                     |
| `src/contexts/selection-context.tsx`                   | `SelectionProvider` + `useSelection()` (legado)                                  |
| `src/providers/query-provider.tsx`                     | Singleton `queryClient` + `QueryProvider`                                        |
| `src/components/theme-provider.tsx`                    | Wrapper sobre `next-themes`                                                      |
| `src/components/auth/protected-route.tsx`              | Guard de rota com verificação de permissões                                      |
| `src/components/auth/super-admin-guard.tsx`            | Guard exclusivo para super admins                                                |
| `src/hooks/use-permissions.ts`                         | Hook composto: `usePermissions()`, `usePermission()`, `useMultiplePermissions()` |
| `src/lib/api-client.ts`                                | `ApiClient` — HTTP client com refresh automático                                 |
| `src/lib/api-client-auth.ts`                           | `TokenManager` — gerenciamento de JWT e refresh                                  |
| `src/lib/jwt-utils.ts`                                 | `decodeJWT()` + `isJwt()` — decodificação sem validação                          |
| `src/lib/saved-accounts.ts`                            | Fast Login — contas salvas no `localStorage`                                     |
| `src/app/(central)/layout.tsx`                         | Insere `CentralThemeProvider` + `SuperAdminGuard`                                |
| `src/app/(dashboard)/layout.tsx`                       | Insere `PrintQueueProvider`, verifica tenant selecionado                         |
| `src/core/print-queue/context/print-queue-context.tsx` | Fila de impressão de etiquetas                                                   |
| `src/core/selection/selection-context.tsx`             | `SelectionProvider` (versão core, mais robusta)                                  |
| `src/core/providers/core-provider.tsx`                 | `CoreProvider` — agrega providers do sistema core                                |
| `src/config/api.ts`                                    | `authConfig` (chaves localStorage), `API_ENDPOINTS`                              |

---

## Rules

### Quando usar Context

- Estado compartilhado entre componentes não relacionados na árvore
- Estado que precisa sobreviver a navegações (não é resetado ao desmontar)
- Identidade do usuário, tenant ativo, tema visual

### Quando NÃO usar Context

- Dados que vêm do servidor — use React Query
- Estado de UI local (modal aberto, aba ativa) — use `useState`
- Estado de formulário — use `react-hook-form` (local) ou `useState`

### Armadilhas comuns

**1. Não usar `useMemo` no valor do contexto causa re-renders em cascata.**
Todos os contextos do projeto envolvem o `value` em `useMemo` com as dependências corretas. Omitir o `useMemo` faz todos os consumidores re-renderizarem a cada render do provider.

**2. Não chamar `queryClient.clear()` ao trocar de tenant vaza dados entre organizações.**
O `TenantProvider` chama `queryClient.clear()` tanto em `selectTenant()` quanto em `clearTenant()`. Nunca omitir essa chamada em fluxos que mudam o tenant.

**3. Acessar `localStorage` durante SSR lança `ReferenceError`.**
Sempre guardar com `typeof window === 'undefined'` ou usar função lazy no `useState` inicial.

**4. `isInitialized` do TenantProvider deve ser aguardado antes de redirecionar.**
O `(dashboard)/layout.tsx` verifica `!isTenantInitialized` antes de qualquer redirecionamento. Sem isso, usuários com tenant salvo são redirecionados para `/select-tenant` antes da hidratação concluir.

**5. Contextos de escopo restrito não devem ser movidos para o root layout.**
`CentralThemeProvider`, `PrintQueueProvider` e `SelectionProvider` têm escopo intencional. Movê-los para o root causaria inicialização desnecessária e possível conflito de classes CSS (`dark-blue` aplicada globalmente).

---

## Audit History

| Data | Dimensão | Pontuação | Relatório        |
| ---- | -------- | --------- | ---------------- |
| —    | —        | —         | Nenhum registro. |
