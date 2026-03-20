# Pattern: React Query and API Hooks

## Problem

O frontend precisa se comunicar com o backend REST de forma consistente, com gerenciamento de estado do servidor (cache, revalidação, carregamento, erros), suporte a atualizações otimistas para operações críticas de UX (como drag-and-drop de cards), e paginação integrada — tudo isso sem duplicar lógica entre componentes.

## Solution

O projeto utiliza **TanStack Query v5** (React Query) como camada de gerenciamento de estado do servidor, combinado com um **cliente HTTP próprio** (`ApiClient`) baseado em `fetch` nativo. A arquitetura segue três camadas:

```
Componente React
      ↓
Hook React Query  (src/hooks/{módulo}/use-*.ts)
      ↓
Service           (src/services/{módulo}/*.service.ts)
      ↓
ApiClient         (src/lib/api-client.ts)
      ↓
Backend REST API  (http://localhost:3333)
```

---

## Implementation

### 1. Configuração Global do QueryClient

**Arquivo:** `src/providers/query-provider.tsx`

```typescript
const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutos — dados são considerados frescos
      gcTime: 1000 * 60 * 10,          // 10 minutos — tempo no cache após sem observadores
      refetchOnWindowFocus: false,      // não refetch ao focar janela (padrão desativado)
      retry: 1,                         // 1 tentativa automática em caso de falha
    },
    mutations: {
      retry: false,                     // mutações não são retentadas automaticamente
    },
  },
};

export const queryClient = new QueryClient(defaultQueryClientOptions);

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

O `queryClient` é exportado como singleton para permitir invalidação manual de cache em contextos fora do React (ex: troca de tenant em `tenant-context.tsx`).

---

### 2. Cliente HTTP (ApiClient)

**Arquivo:** `src/lib/api-client.ts`

O `ApiClient` é uma classe que encapsula o `fetch` nativo com as seguintes responsabilidades:

- Injeção automática do token JWT no header `Authorization: Bearer {token}`
- Timeout configurável por requisição (padrão: 30 segundos)
- **Renovação automática de token (refresh):** quando recebe HTTP 401, tenta chamar o endpoint de refresh e reexecuta a requisição original com o novo token
- Suporte a `FormData` (não serializa como JSON quando o body for `FormData`)
- Método especial `getBlob()` para download de arquivos binários com extração de nome do header `Content-Disposition`

```typescript
// Uso básico
import { apiClient } from '@/lib/api-client';

// GET com query params
const response = await apiClient.get<ProductsResponse>('/v1/products', {
  params: { page: '1', limit: '20' },
});

// POST com JSON
const product = await apiClient.post<ProductResponse>('/v1/products', {
  name: 'Camiseta Azul',
  templateId: 'tpl-123',
});

// Download de arquivo
const { blob, filename } = await apiClient.getBlob(
  '/v1/calendar/events/export'
);
```

**Classe de erro tipada:** `ApiError` (em `src/lib/api-client.types.ts`)

```typescript
export class ApiError extends Error {
  status?: number; // HTTP status code (ex: 404, 422)
  data?: Record<string, unknown>; // corpo completo do erro
  code?: string; // código semântico do erro (ex: 'PASSWORD_RESET_REQUIRED')
}
```

---

### 3. Centralização de Endpoints

**Arquivo:** `src/config/api.ts`

Todos os endpoints da API são centralizados no objeto `API_ENDPOINTS`. Endpoints com parâmetros são representados como funções:

```typescript
export const API_ENDPOINTS = {
  PRODUCTS: {
    LIST: '/v1/products',
    GET: (productId: string) => `/v1/products/${productId}`,
    CREATE: '/v1/products',
    UPDATE: (productId: string) => `/v1/products/${productId}`,
    DELETE: (productId: string) => `/v1/products/${productId}`,
  },
  FINANCE_ENTRIES: {
    LIST: '/v1/finance/entries',
    CANCEL: (id: string) => `/v1/finance/entries/${id}/cancel`,
    REGISTER_PAYMENT: (id: string) => `/v1/finance/entries/${id}/payments`,
    // ...
  },
  // ...
} as const;
```

---

### 4. Services (Camada de Acesso à API)

**Localização:** `src/services/{módulo}/*.service.ts`

Cada módulo possui um objeto service com métodos assíncronos que fazem chamadas ao `apiClient` e retornam dados tipados. Os services não possuem estado próprio — são objetos simples com funções.

```typescript
// src/services/stock/products.service.ts
export const productsService = {
  async list(query?: ProductsQuery): Promise<PaginatedProductsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.search) params.append('search', query.search);
    // ... outros filtros

    const url = params.toString()
      ? `${API_ENDPOINTS.PRODUCTS.LIST}?${params.toString()}`
      : API_ENDPOINTS.PRODUCTS.LIST;

    return apiClient.get<PaginatedProductsResponse>(url);
  },

  async getProduct(productId: string): Promise<ProductResponse> {
    return apiClient.get<ProductResponse>(
      API_ENDPOINTS.PRODUCTS.GET(productId)
    );
  },

  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    return apiClient.post<ProductResponse>(API_ENDPOINTS.PRODUCTS.CREATE, data);
  },

  async deleteProduct(productId: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.PRODUCTS.DELETE(productId));
  },
};
```

---

### 5. Organização dos Hooks por Módulo

**Localização:** `src/hooks/`

```
src/hooks/
  index.ts                    # Barrel — re-exporta todos os hooks públicos
  create-crud-hooks.ts        # Factory genérica de hooks CRUD
  use-auth.ts                 # Login, registro, reset de senha
  use-me.ts                   # Perfil do usuário autenticado
  use-sessions.ts             # Sessões e logout
  use-users.ts                # Gerenciamento de usuários
  use-permissions.ts          # Verificação de permissões RBAC
  use-batch-delete.ts         # Exclusão em lote com progresso
  stock/
    index.ts
    use-products.ts           # Produtos com paginação
    use-variants.ts           # Variantes por produto
    use-items.ts              # Itens de estoque
    use-categories.ts         # Categorias e tags
    use-purchase-orders.ts    # Ordens de compra
    use-inventory.ts          # Ciclos de inventário
    use-movements.ts          # Movimentações
    use-volumes.ts            # Volumes e expedição
    use-volumes-crud.ts       # CRUD de volumes
    use-analytics.ts          # Dashboard de estoque
    use-scan.ts               # Scanner de QR/código de barras
    use-labels.ts             # Geração de etiquetas
    use-import.ts             # Importação de planilhas
    use-care-options.ts       # Cuidados têxteis
    use-product-care.ts       # Cuidados por produto
    use-stock-other.ts        # Fabricantes, fornecedores, templates
    use-label-templates.ts    # Templates de etiqueta
    use-label-templates-crud.ts
    use-tags.ts
  finance/
    index.ts
    use-finance-entries.ts    # Contas a pagar/receber
    use-bank-accounts.ts      # Contas bancárias
    use-finance-categories.ts # Categorias financeiras
    use-cost-centers.ts       # Centros de custo
    use-loans.ts              # Empréstimos
    use-consortia.ts          # Consórcios
    use-contracts.ts          # Contratos
    use-finance-dashboard.ts  # Dashboard financeiro
    use-suppliers.ts          # Fornecedores (finance)
    use-customers.ts          # Clientes (finance)
    use-brasil-api-banks.ts   # Bancos via BrasilAPI
  calendar/
    index.ts
    use-calendar-events.ts    # Eventos, participantes, lembretes
    use-my-calendars.ts       # Calendários do usuário
  email/
    index.ts
    use-email.ts              # Contas e mensagens de e-mail
    use-email-page.ts         # Estado da página de e-mail
    use-email-unread-count.ts # Contagem de não lidos
  sales/
    index.ts
    use-customers.ts          # Clientes de vendas
    use-sales-orders.ts       # Pedidos de venda
    use-sales-other.ts        # Promoções, reservas, notificações
  storage/
    index.ts
    use-files.ts              # Upload, download, rename, move, delete
    use-folders.ts            # Pastas e conteúdo
    use-folder-access.ts      # Controle de acesso
    use-sharing.ts            # Links de compartilhamento
    use-trash.ts              # Lixeira
    use-file-manager.ts       # Estado do gerenciador de arquivos
  tasks/
    use-boards.ts             # Quadros Kanban
    use-cards.ts              # Cards com atualização otimista
    use-columns.ts            # Colunas do board
    use-comments.ts           # Comentários em cards
    use-subtasks.ts           # Subtarefas
    use-checklists.ts         # Checklists
    use-members.ts            # Membros do board
    use-labels.ts             # Labels do board
    use-attachments.ts        # Anexos
    use-automations.ts        # Automações
    use-activity.ts           # Log de atividades
    use-custom-fields.ts      # Campos customizados
  admin/
    use-admin.ts              # Tenants e planos (super admin)
    use-admin-companies.ts    # Empresas (admin)
  shared/
    use-activity.ts
    use-attachments.ts        # Attachments compartilhados (finance)
  notifications/
    (hooks de notificações)
```

---

### 6. Hook de Query — Padrão de Leitura

O padrão para hooks de leitura segue esta estrutura:

```typescript
// src/hooks/stock/use-products.ts

// Query Keys — declaradas como constante local, exportadas quando necessário
const QUERY_KEYS = {
  PRODUCTS: ['products'],
  PRODUCTS_PAGINATED: (query?: ProductsQuery) => [
    'products',
    'paginated',
    query,
  ],
  PRODUCT: (id: string) => ['products', id],
} as const;

// Lista simples (sem paginação)
export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: () => productsService.listProducts(),
  });
}

// Lista paginada com filtros — a query inteira é parte da chave
export function useProductsPaginated(query?: ProductsQuery) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS_PAGINATED(query),
    queryFn: () => productsService.list(query),
    placeholderData: keepPreviousData, // mantém dados anteriores durante carregamento
    staleTime: 30000, // 30s — sobrescreve o padrão global de 5min
  });
}

// Detalhe — desativado enquanto não há ID
export function useProduct(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCT(productId),
    queryFn: () => productsService.getProduct(productId),
    enabled: !!productId, // não executa se productId for vazio/undefined
  });
}
```

**Valores de `staleTime` por contexto:**

| Contexto                     | staleTime   | Justificativa                 |
| ---------------------------- | ----------- | ----------------------------- |
| Padrão global                | 5 minutos   | Dados gerais de listagem      |
| Permissões do usuário        | 15 minutos  | Raramente mudam em tempo real |
| Presigned URLs de arquivo    | 45 minutos  | URLs expiram em 1 hora        |
| Eventos de calendário        | 60 segundos | Mudanças frequentes           |
| Perfil do usuário (`/v1/me`) | 2 minutos   | Detectar mudanças rápidas     |
| Dados paginados com filtros  | 30 segundos | Filtros mudam com frequência  |

---

### 7. Hook de Mutação — Padrão de Escrita

O padrão para mutações simples (sem atualização otimista) usa `onSuccess` para invalidar o cache:

```typescript
// src/hooks/stock/use-products.ts

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      productsService.createProduct(data),
    onSuccess: () => {
      // Invalida todas as queries que começam com ['products']
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: UpdateProductRequest;
    }) => productsService.updateProduct(productId, data),
    onSuccess: (_, variables) => {
      // Invalida a lista E o detalhe específico
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCT(variables.productId),
      });
    },
  });
}
```

**Uso no componente:**

```typescript
function CreateProductForm() {
  const createProduct = useCreateProduct();

  async function handleSubmit(data: CreateProductRequest) {
    try {
      await createProduct.mutateAsync(data);
      toast.success('Produto criado com sucesso');
    } catch (error) {
      toast.error('Erro ao criar produto', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleSubmit)}>
      {/* ... */}
      <Button disabled={createProduct.isPending}>
        {createProduct.isPending ? 'Criando...' : 'Criar Produto'}
      </Button>
    </form>
  );
}
```

---

### 8. Atualização Otimista (Optimistic Updates)

Utilizada em operações onde a latência degradaria a experiência do usuário (drag-and-drop de cards, rename de arquivos, exclusão em listas longas).

**Regra crítica:** Nunca usar `onSettled` + `invalidateQueries` em mutações que têm `onMutate`, exceto quando a invalidação é estritamente necessária (ex: participantes de evento onde a sincronização com o servidor é obrigatória). O `onSettled` causa "snap-back" porque o refetch retorna dados desatualizados do servidor. Mutações puramente otimistas usam apenas `onMutate` (atualização) + `onError` (rollback).

**Regra crítica — guard no callback de `setQueriesData`:** O callback SEMPRE deve verificar se a estrutura de dados esperada existe antes de modificá-la. Isso é necessário porque `setQueriesData` com prefix matching pode atingir queries com formatos diferentes.

```typescript
// CORRETO — verifica antes de modificar
queryClient.setQueriesData<CalendarEventsResponse>(
  { queryKey: QUERY_KEYS.CALENDAR_EVENTS },
  old => {
    if (!old?.events) return old; // guard obrigatório
    return { ...old, events: old.events.filter(e => e.id !== id) };
  }
);

// ERRADO — pode quebrar se old for undefined ou de tipo diferente
queryClient.setQueriesData(
  { queryKey: QUERY_KEYS.CALENDAR_EVENTS },
  (old: CalendarEventsResponse) => ({
    ...old,
    events: old.events.filter(e => e.id !== id),
  })
);
```

**Estrutura completa do padrão otimista:**

```typescript
// src/hooks/calendar/use-calendar-events.ts

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => calendarEventsService.delete(id),

    onMutate: async id => {
      // 1. Cancelar queries em andamento para evitar conflito
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });

      // 2. Capturar snapshot do estado atual para rollback
      const previousQueries =
        queryClient.getQueriesData<CalendarEventsResponse>({
          queryKey: QUERY_KEYS.CALENDAR_EVENTS,
        });

      // 3. Aplicar atualização otimista em TODAS as queries com esse prefixo
      queryClient.setQueriesData<CalendarEventsResponse>(
        { queryKey: QUERY_KEYS.CALENDAR_EVENTS },
        old => {
          if (!old?.events) return old; // guard obrigatório
          return {
            ...old,
            events: old.events.filter(e => e.id !== id),
          };
        }
      );

      // 4. Retornar contexto para uso no rollback
      return { previousQueries };
    },

    onError: (_, __, context) => {
      // 5. Rollback em caso de erro — restaura o snapshot
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },

    // Sem onSettled/invalidateQueries — o servidor é a fonte de verdade
    // mas o cliente não precisa confirmar para manter a UX fluida
  });
}
```

**Exemplo com criação otimista (item temporário):**

```typescript
// src/hooks/calendar/use-calendar-events.ts

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCalendarEventData) =>
      calendarEventsService.create(data),

    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      const previousQueries =
        queryClient.getQueriesData<CalendarEventsResponse>({
          queryKey: QUERY_KEYS.CALENDAR_EVENTS,
        });

      // Cria item temporário com ID fictício
      const tempEvent: CalendarEvent = {
        id: `temp-${Date.now()}`,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        // ... outros campos com valores padrão
        participants: [],
        reminders: [],
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueriesData<CalendarEventsResponse>(
        { queryKey: QUERY_KEYS.CALENDAR_EVENTS },
        old => {
          if (!old?.events) return old;
          return { ...old, events: [...old.events, tempEvent] };
        }
      );

      return { previousQueries };
    },

    onError: (_, __, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },

    // Aqui onSettled é necessário para substituir o item temp pelo real
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
    },
  });
}
```

**Exemplo avançado — mover card com reordenação de posições:**

```typescript
// src/hooks/tasks/use-cards.ts

export function useMoveCard(boardId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: MoveCardRequest }) =>
      cardsService.move(boardId, cardId, data),

    onMutate: async ({ cardId, data }) => {
      await qc.cancelQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      const previousQueries = qc.getQueriesData<CardsResponse>({
        queryKey: CARD_QUERY_KEYS.CARDS(boardId),
      });

      qc.setQueriesData<CardsResponse>(
        { queryKey: CARD_QUERY_KEYS.CARDS(boardId) },
        old => {
          if (!old?.cards) return old;
          const cards = old.cards;
          const movedCard = cards.find(c => c.id === cardId);
          if (!movedCard) return old;

          // Recalcula posições para coluna de origem e destino
          const srcColumnId = movedCard.columnId;
          const dstColumnId = data.columnId;
          const dstPosition = data.position;

          const srcCards = cards
            .filter(c => c.columnId === srcColumnId && c.id !== cardId)
            .sort((a, b) => a.position - b.position);

          const dstCards =
            srcColumnId === dstColumnId
              ? srcCards
              : cards
                  .filter(c => c.columnId === dstColumnId && c.id !== cardId)
                  .sort((a, b) => a.position - b.position);

          const updatedCard = {
            ...movedCard,
            columnId: dstColumnId,
            position: dstPosition,
          };
          dstCards.splice(dstPosition, 0, updatedCard);

          const positionMap = new Map<
            string,
            { columnId: string; position: number }
          >();
          srcCards.forEach((c, i) =>
            positionMap.set(c.id, { columnId: srcColumnId, position: i })
          );
          dstCards.forEach((c, i) =>
            positionMap.set(c.id, { columnId: dstColumnId, position: i })
          );

          return {
            ...old,
            cards: cards.map(c => {
              const update = positionMap.get(c.id);
              return update ? { ...c, ...update } : c;
            }),
          };
        }
      );

      return { previousQueries };
    },

    onError: (_, __, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    // Sem onSettled — UX de drag-and-drop deve ser imediato e não causar snap-back
  });
}
```

---

### 9. Convenções de Query Keys

As query keys seguem hierarquia crescente de especificidade:

```typescript
// Padrão: [entidade] → [entidade, filtros/params] → [entidade, id]

const QUERY_KEYS = {
  // Raiz — invalida TUDO relacionado à entidade
  PRODUCTS: ['products'],

  // Lista com filtros — a query object completa como parte da chave
  // Garante cache separado para cada combinação de filtros
  PRODUCTS_PAGINATED: (query?: ProductsQuery) => [
    'products',
    'paginated',
    query,
  ],

  // Detalhe individual
  PRODUCT: (id: string) => ['products', id],

  // Relações
  VARIANTS_BY_PRODUCT: (productId: string) => [
    'variants',
    'product',
    productId,
  ],
} as const;
```

**Padrão de objects keys** (usado em `use-me.ts` e `use-sessions.ts`):

```typescript
// Padrão factory com métodos para garantir consistência
export const meKeys = {
  all: ['me'] as const,
  detail: () => [...meKeys.all, 'detail'] as const,
  employee: () => [...meKeys.all, 'employee'] as const,
  auditLogs: (query?: AuditLogsQuery) =>
    [...meKeys.all, 'audit-logs', query] as const,
  permissions: () => [...meKeys.all, 'permissions'] as const,
};
```

**Regra de invalidação por escopo:**

```typescript
// Invalida TUDO de 'products' (lista + detalhes + paginados)
queryClient.invalidateQueries({ queryKey: ['products'] });

// Invalida apenas o detalhe específico
queryClient.invalidateQueries({ queryKey: ['products', productId] });

// Invalida apenas as listas paginadas (mantém detalhe em cache)
queryClient.invalidateQueries({ queryKey: ['products', 'paginated'] });
```

---

### 10. Paginação

O backend retorna uma estrutura padronizada para todas as listas paginadas:

```typescript
// src/types/common/pagination.ts
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Resposta paginada típica
interface PaginatedProductsResponse {
  products: Product[];
  meta: PaginationMeta;
}
```

O hook paginado usa a query completa como chave para manter cache separado por combinação de filtros, e `keepPreviousData` para evitar flash de conteúdo durante a troca de página:

```typescript
export function useProductsPaginated(query?: ProductsQuery) {
  return useQuery({
    queryKey: ['products', 'paginated', query], // query object na chave
    queryFn: () => productsService.list(query),
    placeholderData: keepPreviousData,           // mantém página anterior visível
    staleTime: 30000,
  });
}

// Uso no componente
function ProductsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching } = useProductsPaginated({
    page,
    limit: 20,
    search,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <>
      {isFetching && <LoadingBar />} {/* indica carregamento sem esconder a lista */}
      <ProductTable data={data?.products ?? []} />
      <Pagination
        current={page}
        total={data?.meta.pages ?? 1}
        onChange={setPage}
      />
    </>
  );
}
```

---

### 11. Factory Genérica de CRUD Hooks

**Arquivo:** `src/hooks/create-crud-hooks.ts`

Para entidades simples sem lógica especial, existe uma factory que gera automaticamente os 5 hooks CRUD padrão:

```typescript
interface CrudService<TEntity, TCreateRequest, TUpdateRequest> {
  list?: () => Promise<TEntity[]>;
  get?: (id: string) => Promise<TEntity>;
  create?: (data: TCreateRequest) => Promise<TEntity>;
  update?: (id: string, data: TUpdateRequest) => Promise<TEntity>;
  delete?: (id: string) => Promise<void>;
}

// Uso
const categoryHooks = createCrudHooks<
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest
>({
  entityName: 'category',
  pluralEntityName: 'categories',
  service: categoriesService,
});

// Hooks gerados automaticamente:
const { data } = categoryHooks.useList();
const { data } = categoryHooks.useGet(id);
const mutation = categoryHooks.useCreate();
const mutation = categoryHooks.useUpdate();
const mutation = categoryHooks.useDelete();

// Query keys expostas para uso manual:
categoryHooks.queryKeys.all; // ['categories']
categoryHooks.queryKeys.list(); // ['categories', 'list']
categoryHooks.queryKeys.detail(id); // ['categories', 'detail', id]
```

---

### 12. Tratamento de Erros

**Nível do ApiClient:** Erros HTTP são convertidos para `ApiError` com `status` e `code` tipados.

**Nível dos hooks:** Erros ficam disponíveis via `error` retornado pelo `useQuery`/`useMutation`. O componente decide como exibi-los.

**Utilitários de toast** em `src/lib/toast-utils.ts`:

```typescript
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';

// Exibe toast de erro com botão "Copiar erro" (inclui timestamp para debug)
showErrorToast({
  title: 'Erro ao criar produto',
  description: error.message,
  context: { productId: variables.productId },
});

// Toast simples de sucesso
showSuccessToast('Produto criado com sucesso');
```

**Padrão de uso em componentes:**

```typescript
function DeleteProductButton({ productId }: { productId: string }) {
  const deleteProduct = useDeleteProduct();

  async function handleDelete() {
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success('Produto removido');
    } catch (error) {
      showErrorToast({
        title: 'Falha ao remover produto',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  return (
    <Button
      variant="destructive"
      disabled={deleteProduct.isPending}
      onClick={handleDelete}
    >
      {deleteProduct.isPending ? 'Removendo...' : 'Remover'}
    </Button>
  );
}
```

**Erros específicos por código:** O campo `code` da `ApiError` permite tratar casos especiais sem depender da mensagem textual:

```typescript
// Em src/lib/api-client-error.ts — exemplo de tratamento especial
const isResetRequired = code === 'PASSWORD_RESET_REQUIRED';
const isNotFound = response.status === 404;

// Em componentes
try {
  await mutateAsync(data);
} catch (error) {
  if (error instanceof ApiError && error.code === 'DUPLICATE_ENTRY') {
    form.setError('name', { message: 'Já existe um produto com este nome' });
  } else {
    showErrorToast({ title: 'Erro inesperado', description: error.message });
  }
}
```

---

### 13. Hook Especializado — `useBatchDelete`

Para exclusão de múltiplos itens com feedback de progresso:

```typescript
// Não usa React Query internamente — é um hook de estado local com chamadas diretas
const { deleteBatch, isDeleting, progress, completed, failed } = useBatchDelete(
  (id) => productsService.deleteProduct(id),
  {
    batchSize: 3,               // processa 3 por vez
    delayBetweenBatches: 1000,  // aguarda 1s entre lotes (rate limit)
    maxRetries: 3,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produtos removidos com sucesso');
    },
    onError: (error, failedIds) => {
      toast.error(`Falha ao remover ${failedIds.length} produto(s)`);
    },
  }
);

// Exibe barra de progresso
<Progress value={progress} />
<span>{completed} de {total} removidos</span>
```

---

### 14. Hook de Permissões com React Query

O hook `usePermissions` usa React Query para buscar e cachear as permissões efetivas do usuário:

```typescript
export function usePermissions() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  const { data: effectivePermissions = [] } = useQuery({
    queryKey: ['my-permissions', user?.id, currentTenant?.id],
    queryFn: () => listMyPermissions(),
    enabled: !!user?.id && !!currentTenant,
    staleTime: 15 * 60 * 1000, // 15 minutos — permissões raramente mudam
    gcTime: 30 * 60 * 1000,
    retry: 2,
    throwOnError: false,
  });

  const permissions = useMemo(
    () => createPermissionMap(effectivePermissions),
    [effectivePermissions]
  );

  return {
    hasPermission: (code: string) => isPermissionAllowed(permissions, code),
    hasAnyPermission: (...codes: string[]) =>
      codes.some(c => isPermissionAllowed(permissions, c)),
    hasAllPermissions: (...codes: string[]) =>
      codes.every(c => isPermissionAllowed(permissions, c)),
    // ...
  };
}
```

---

## Files

Arquivos relevantes para consultar ao trabalhar com este padrão:

| Arquivo                                     | Responsabilidade                                       |
| ------------------------------------------- | ------------------------------------------------------ |
| `src/providers/query-provider.tsx`          | Configuração global do QueryClient                     |
| `src/lib/api-client.ts`                     | Cliente HTTP com refresh automático                    |
| `src/lib/api-client-auth.ts`                | Gerenciamento de tokens JWT                            |
| `src/lib/api-client-error.ts`               | Parsing e tipagem de erros HTTP                        |
| `src/lib/api-client.types.ts`               | Tipos: `ApiError`, `RequestOptions`, `RefreshResponse` |
| `src/lib/toast-utils.ts`                    | Utilitários para exibir toasts padronizados            |
| `src/config/api.ts`                         | Endpoints centralizados e configuração de base URL     |
| `src/hooks/create-crud-hooks.ts`            | Factory genérica para hooks CRUD simples               |
| `src/hooks/stock/use-products.ts`           | Exemplo canônico de hook paginado                      |
| `src/hooks/calendar/use-calendar-events.ts` | Exemplo completo de atualização otimista               |
| `src/hooks/tasks/use-cards.ts`              | Otimista com reordenação de posições (DnD)             |
| `src/hooks/storage/use-files.ts`            | Otimista em rename/delete de arquivos                  |
| `src/hooks/use-permissions.ts`              | Query com `useMemo` para mapa de permissões            |
| `src/hooks/use-batch-delete.ts`             | Exclusão em lote com progresso e retry                 |

---

## Rules

### Quando usar atualização otimista

Usar `onMutate` + `setQueriesData`:

- Drag-and-drop de cards em boards Kanban
- Rename de arquivos ou pastas no file manager
- Exclusão de itens em listas longas (feedback imediato)
- Criação de evento de calendário (aparece instantaneamente no calendário)
- Resposta a convite (status muda sem esperar resposta do servidor)

Não usar (usar apenas `onSuccess` + `invalidateQueries`):

- Criação de entidades complexas com muitos campos derivados
- Operações com efeitos colaterais no servidor (ex: registrar pagamento que atualiza saldo)
- Qualquer operação onde o estado final depende de cálculo feito pelo servidor

### Regras de Query Keys

1. Sempre declarar `QUERY_KEYS` como constante local no arquivo do hook
2. Exportar as keys quando precisam ser referenciadas por outros hooks (ex: `BOARD_QUERY_KEYS` importado em `use-cards.ts`)
3. Incluir todos os parâmetros de filtro como parte da chave para listas filtradas
4. Usar o prefixo da entidade para garantir invalidação em cascata correta

### Regras de Invalidação

1. Ao criar/deletar um item: invalidar a raiz da entidade (`['products']`)
2. Ao atualizar um item: invalidar a raiz + o detalhe específico
3. Nunca usar `invalidateQueries` em `onSettled` quando há `onMutate` para evitar snap-back em operações otimistas
4. Exceção: quando o item temporário precisa ser substituído pelo real (ex: criação otimista onde o server retorna campos calculados)

### Armadilhas comuns

- **Snap-back com DnD:** Adicionar `onSettled` + `invalidateQueries` em hooks com `onMutate` causa o card a voltar à posição anterior após o drag. Remover o `onSettled`.
- **Query key sem filtros:** Usar `['products']` ao invés de `['products', 'paginated', query]` faz todas as páginas compartilharem o mesmo cache e não atualizar ao mudar filtros.
- **`setQueriesData` sem guard:** Chamar sem verificar `if (!old?.data) return old` pode retornar `undefined` onde o React Query esperava dados, causando erros de tipagem em runtime.
- **Criação de `queryClient` dentro de componente:** O `QueryClient` deve ser singleton. Nunca criar com `new QueryClient()` dentro de um componente ou hook — usar o `queryClient` exportado de `query-provider.tsx`.
- **`enabled: false` permanente:** Usar `enabled: !!id` é correto, mas verificar se o componente pai não envia o hook com `id = ''` de forma permanente, mantendo o hook desabilitado para sempre.

## Audit History

| Date       | Dimension            | Score | Report                                          |
| ---------- | -------------------- | ----- | ----------------------------------------------- |
| 2026-03-10 | Documentação inicial | —     | Criado com base na análise do codebase completo |
