# Module: Core Auth

## Overview

O módulo de autenticação gerencia todo o ciclo de vida de sessão do usuário: login em dois passos, registro, recuperação de senha, seleção de tenant (multi-tenancy) e configuração de PINs de segurança. É o ponto de entrada obrigatório de todos os usuários do sistema — tanto usuários de tenant quanto super admins.

Dependências diretas: `AuthContext`, `TenantContext`, `src/config/api.ts` (chaves de token), `src/lib/saved-accounts.ts` (Fast Login), `src/lib/jwt-utils.ts` (decodificação do JWT).

---

## Page Structure

### Route Tree

```
(auth)/                        # Route group — sem layout compartilhado
  login/page.tsx               # Login em dois passos (identifier → password)
  fast-login/page.tsx          # Login rápido via conta salva + PIN de acesso
  register/page.tsx            # Registro de novo usuário
  forgot-password/page.tsx     # Solicitar reset de senha por e-mail
  reset-password/page.tsx      # Redefinir senha com token (link do e-mail)
  select-tenant/page.tsx       # Seleção de empresa após autenticação
  setup-pins/page.tsx          # Configuração obrigatória de PIN de acesso/ação
  error.tsx                    # Error boundary do grupo auth
```

### Layout Hierarchy

O grupo `(auth)` não possui `layout.tsx` próprio. Todas as páginas são renderizadas diretamente sob o `RootLayout` (`src/app/layout.tsx`). O componente `AuthBackground` (fundo animado com esferas) é reutilizado em páginas individuais.

### Component Tree

```
login/
  page.tsx                      # Formulário em dois passos
    ├── AuthBackground           # Fundo animado SVG
    ├── ThemeToggle              # Alternância de tema claro/escuro
    └── Card
        └── form (TanStack Form)
            ├── Step 1: identifier field (email ou @username)
            └── Step 2: password field + link "Esqueceu a senha?"

select-tenant/
  page.tsx                      # Listagem de tenants disponíveis
    ├── Skeleton (loading)
    ├── Card[] (tenant list)
    └── Button "Acessar Central" (visível apenas para super admins)

setup-pins/
  page.tsx                      # Configuração de PIN
    └── Formulário de dois PINs (acesso e ação)
```

---

## Components

### AuthBackground

- **Responsabilidade:** Renderiza o fundo visual animado (esferas gradiente com motion) presente nas páginas de autenticação.
- **Usado em:** `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`

---

## Hooks

| Hook                     | Propósito                     | Query Key                         | Endpoint                          |
| ------------------------ | ----------------------------- | --------------------------------- | --------------------------------- |
| `useLogin()`             | Autenticar com e-mail e senha | `['auth', 'login']`               | `POST /v1/auth/login/password`    |
| `useRegister()`          | Criar nova conta              | `['auth', 'register']`            | `POST /v1/auth/register/password` |
| `useSendPasswordReset()` | Enviar e-mail de recuperação  | `['auth', 'send-password-reset']` | `POST /v1/auth/send/password`     |
| `useResetPassword()`     | Redefinir senha com token     | `['auth', 'reset-password']`      | `POST /v1/auth/reset/password`    |
| `useRefreshToken()`      | Renovar JWT de acesso         | `['auth', 'refresh']`             | `POST /v1/sessions/refresh`       |
| `useMe(hasToken)`        | Buscar usuário autenticado    | `['me']`                          | `GET /v1/auth/me`                 |

Todos os hooks de mutação residem em `src/hooks/use-auth.ts`. O hook `useMe` fica em `src/hooks/use-me.ts`.

---

## Types

| Interface              | Backend Schema               | In Sync?                                          |
| ---------------------- | ---------------------------- | ------------------------------------------------- |
| `User`                 | `UserResponseSchema`         | Sim                                               |
| `LoginCredentials`     | `LoginSchema`                | Sim                                               |
| `RegisterData`         | `RegisterSchema`             | Sim                                               |
| `AuthResponse`         | `AuthResponseSchema`         | Sim — inclui `tenant` (auto-select) e `tenants[]` |
| `UserTenant`           | `TenantSchema`               | Sim                                               |
| `SelectTenantResponse` | `SelectTenantResponseSchema` | Sim                                               |

Localização: `src/types/auth/user.types.ts`, `src/types/auth/session.types.ts`, `src/types/admin/tenant.types.ts`.

### Interface User

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  isSuperAdmin: boolean;
  hasAccessPin?: boolean;
  hasActionPin?: boolean;
  forceAccessPinSetup?: boolean; // Redireciona para /setup-pins
  forceActionPinSetup?: boolean; // Redireciona para /setup-pins
  forcePasswordReset?: boolean; // Redireciona para /reset-password
  profile?: Profile | null;
}
```

---

## State Management

### Contexts

**`AuthContext`** — `src/contexts/auth-context.tsx`

O contexto central de autenticação. Monitora o token no `localStorage`, expõe `user`, `isAuthenticated`, `isSuperAdmin` e as funções `login`, `register`, `logout`, `refetchUser`.

Regras de comportamento:

- Monitora `localStorage` via `StorageEvent` (outras abas) e evento customizado `auth-token-change` (mesma aba).
- Ao receber erro 401/403 no endpoint `/me`, remove os tokens e redireciona para `/fast-login?session=expired`.
- Após login bem-sucedido, se `forceAccessPinSetup` ou `forceActionPinSetup` for `true`, redireciona para `/setup-pins`.
- Se o backend retornar `code: 'PASSWORD_RESET_REQUIRED'` no login, redireciona automaticamente para `/reset-password?token=...&forced=true`.

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}
```

**`TenantContext`** — `src/contexts/tenant-context.tsx`

Gerencia o tenant selecionado. Persiste o `tenantId` no `localStorage` como `selected_tenant_id`. Ao trocar de tenant, limpa todo o cache do React Query (`queryClient.clear()`) para evitar vazamento de dados entre tenants.

```typescript
interface TenantContextType {
  currentTenant: UserTenant | null;
  tenants: UserTenant[];
  isLoading: boolean;
  isInitialized: boolean;
  selectTenant: (tenantId: string) => Promise<void>;
  clearTenant: () => void;
  refreshTenants: () => Promise<UserTenant[]>;
}
```

### URL State

| Parâmetro          | Página            | Uso                              |
| ------------------ | ----------------- | -------------------------------- |
| `?session=expired` | `/fast-login`     | Exibir aviso de sessão encerrada |
| `?token=`          | `/reset-password` | Token de reset de senha          |
| `?forced=true`     | `/reset-password` | Indica reset forçado pelo admin  |
| `?reason=`         | `/reset-password` | Motivo do reset forçado          |

---

## User Flows

### Flow 1: Login padrão (dois passos)

1. Usuário acessa `/login`.
2. **Passo 1:** digita e-mail ou `@username` → clica "Continuar".
3. **Passo 2:** digita senha → clica "Entrar".
4. `AuthContext.login()` chama `POST /v1/auth/login/password`.
5. Tokens (`token`, `refreshToken`) são salvos no `localStorage`.
6. Conta é salva para Fast Login (`src/lib/saved-accounts.ts`).
7. Se `isSuperAdmin`: redireciona para `/central`.
8. Se backend auto-selecionou tenant (`response.tenant != null`): redireciona para `/`.
9. Caso contrário: redireciona para `/select-tenant`.

### Flow 2: Seleção de tenant

1. Usuário acessa `/select-tenant` (após login com múltiplos tenants).
2. `TenantContext.refreshTenants()` carrega a lista via `GET /v1/auth/tenants`.
3. Se houver apenas 1 tenant, `selectTenant()` é chamado automaticamente.
4. Ao selecionar, `POST /v1/auth/select-tenant` retorna JWT com `tenantId` embutido.
5. Cache do React Query é limpo. Usuário é redirecionado para `/`.

### Flow 3: Reset de senha forçado

1. Admin força reset via painel → backend marca `forcePasswordReset: true`.
2. No próximo login, backend retorna `{ code: 'PASSWORD_RESET_REQUIRED', resetToken }`.
3. `AuthContext.login()` captura o código e redireciona para `/reset-password?token=...&forced=true`.
4. Usuário define nova senha. Login automático é realizado em seguida.

### Flow 4: Configuração de PIN

1. Após login, se `user.forceAccessPinSetup === true`, usuário é redirecionado para `/setup-pins`.
2. Usuário configura PIN de acesso (4 dígitos) e/ou PIN de ação.
3. Após configuração, fluxo de seleção de tenant segue normalmente.

---

## Business Rules

### Regra 1: Auto-seleção de tenant

Se o usuário possui exatamente 1 tenant, o backend retorna o tenant já selecionado na resposta do login (campo `tenant` no `AuthResponse`). O frontend detecta `autoSelectedTenant: true` e redireciona diretamente para `/` sem passar por `/select-tenant`.

### Regra 2: Limpeza de cache ao trocar de tenant

Toda troca de tenant executa `queryClient.clear()` antes de salvar o novo JWT. Isso garante que dados de um tenant nunca sejam exibidos no contexto de outro.

### Regra 3: Proteção de rotas públicas

O `AuthContext` mantém uma lista de rotas públicas (`/login`, `/register`, `/reset-password`, etc.). Fora dessas rotas, qualquer ausência de token válido redireciona para `/fast-login?session=expired`.

### Regra 4: Validação do JWT contra o tenant salvo

O `TenantContext` decodifica o JWT no localStorage e valida se o `tenantId` do payload corresponde ao `selected_tenant_id` salvo. Se houver divergência, efetua logout completo (`clearAuthAndTenant()`).

---

## Audit History

| Date             | Dimension | Score | Report |
| ---------------- | --------- | ----- | ------ |
| Nenhum registro. | —         | —     | —      |
