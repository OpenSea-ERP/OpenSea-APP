# Pattern: Types Architecture

## Problem

Aplicações frontend de grande porte frequentemente acumulam tipos TypeScript em arquivos monolíticos, gerando os seguintes problemas:

- **Acoplamento excessivo**: uma única alteração pode afetar centenas de componentes que importam de um arquivo gigante.
- **Conflitos de nomes**: tipos com mesmo nome em módulos diferentes colidem ao ser exportados de um único ponto.
- **Dificuldade de manutenção**: é difícil identificar quais tipos pertencem a qual domínio de negócio.
- **Riscos de sincronização**: sem um contrato claro, tipos frontend podem divergir silenciosamente dos schemas do backend.
- **Tipos gerados inutilizáveis**: a geração automática via Swagger resulta em `any` massivo quando o backend não usa schemas `$ref` nomeados.

## Solution

O OpenSea-APP adota uma **arquitetura modular de tipos organizada por domínio**. Cada módulo de negócio possui seu próprio diretório em `src/types/{module}/`, com arquivos de entidade individuais (`*.types.ts`) e um barrel `index.ts` que reexporta tudo.

Os tipos são **mantidos manualmente** para garantir precisão — eles devem sempre refletir os schemas Zod do backend. A geração automática via Swagger foi desativada por produzir apenas tipos `any` (o backend não usa schemas `$ref` nomeados).

### Diagrama de Estrutura

```
src/types/
├── index.ts                    # Barrel raiz — reexporta todos os módulos
│
├── common/                     # Tipos compartilhados entre módulos
│   ├── pagination.ts           # PaginationMeta, PaginatedQuery, normalizePagination()
│   ├── enums.ts                # Enums PT-BR: TenantStatus, PlanTier, TenantRole, etc.
│   └── index.ts
│
├── stock/                      # Módulo de Estoque (16 arquivos)
│   ├── product.types.ts
│   ├── variant.types.ts
│   ├── item.types.ts
│   ├── warehouse.types.ts
│   ├── supplier.types.ts
│   ├── manufacturer.types.ts
│   ├── category.types.ts
│   ├── template.types.ts
│   ├── volume.types.ts
│   ├── care.types.ts
│   ├── purchase-order.types.ts
│   ├── scan.types.ts
│   ├── inventory.types.ts
│   ├── import.types.ts
│   ├── analytics.types.ts
│   ├── label.types.ts
│   └── index.ts
│
├── hr/                         # Módulo de RH (12 arquivos)
│   ├── employee.types.ts
│   ├── department.types.ts
│   ├── company.types.ts
│   ├── work-schedule.types.ts
│   ├── time-entry.types.ts
│   ├── time-bank.types.ts
│   ├── overtime.types.ts
│   ├── vacation-period.types.ts
│   ├── absence.types.ts
│   ├── payroll.types.ts
│   ├── bonus.types.ts
│   ├── deduction.types.ts
│   └── index.ts
│
├── auth/                       # Módulo de Autenticação (2 arquivos)
│   ├── user.types.ts
│   ├── session.types.ts
│   └── index.ts
│
├── sales/                      # Módulo de Vendas (6 arquivos)
│   ├── customer.types.ts
│   ├── order.types.ts
│   ├── comment.types.ts
│   ├── promotion.types.ts
│   ├── reservation.types.ts
│   ├── notification.types.ts
│   └── index.ts
│
├── finance/                    # Módulo Financeiro (9 arquivos)
│   ├── finance-entry.types.ts
│   ├── finance-category.types.ts
│   ├── cost-center.types.ts
│   ├── bank-account.types.ts
│   ├── receivable.types.ts
│   ├── loan.types.ts
│   ├── consortium.types.ts
│   ├── contract.types.ts
│   ├── dashboard.types.ts
│   └── index.ts
│
├── admin/                      # Módulo Admin/Central (2 arquivos)
│   ├── dashboard.types.ts      # Tipos frontend-only (Module, SearchResult)
│   ├── tenant.types.ts
│   └── index.ts
│
├── rbac/                       # Módulo de Controle de Acesso (2 arquivos)
│   ├── permission.types.ts
│   ├── group.types.ts
│   └── index.ts
│
├── calendar/                   # Módulo de Agenda (2 arquivos)
│   ├── event.types.ts
│   ├── calendar.types.ts
│   └── index.ts
│
├── email/                      # Módulo de E-mail (4 arquivos)
│   ├── email-account.types.ts
│   ├── email-folder.types.ts
│   ├── email-message.types.ts
│   └── index.ts
│
├── storage/                    # Módulo de Arquivos (4 arquivos)
│   ├── file.types.ts
│   ├── folder.types.ts
│   ├── access.types.ts
│   ├── share.types.ts
│   └── index.ts
│
├── tasks/                      # Módulo de Tarefas (12 arquivos)
│   ├── board.types.ts
│   ├── card.types.ts
│   ├── column.types.ts
│   ├── (... outros)
│   └── index.ts
│
│   # Shims de retrocompatibilidade (não remover)
├── pagination.ts               # → reexporta de ./common/pagination
├── enums.ts                    # → reexporta de ./common/enums
├── dashboard.ts                # → reexporta de ./admin/dashboard.types
└── tenant.ts                   # → reexporta de ./admin/tenant.types
```

## Implementation

### 1. Convenção de Importação

**Sempre** importe do barrel do módulo. **Nunca** importe do arquivo individual `*.types.ts`.

```typescript
// CORRETO — importa do barrel do módulo
import type { Product, ProductsQuery, ProductStatus } from '@/types/stock';
import type { Employee, ContractType } from '@/types/hr';
import type { PaginationMeta } from '@/types/common';
import type { EffectivePermission } from '@/types/rbac';

// INCORRETO — nunca importe do arquivo individual
import type { Product } from '@/types/stock/product.types'; // ❌
import type { Employee } from '@/types/hr/employee.types'; // ❌
```

Exemplos reais do codebase:

```typescript
// src/hooks/stock/use-movements.ts
import type { MovementHistoryQuery, BatchApprovalRequest } from '@/types/stock';

// src/hooks/email/use-email-page.ts
import type { EmailAccount, EmailMessageListItem } from '@/types/email';

// src/hooks/storage/use-sharing.ts
import type { CreateShareLinkRequest } from '@/types/storage';

// src/hooks/admin/use-admin-companies.ts
import type { Company } from '@/types/admin';

// src/hooks/use-permissions.ts
import type { EffectivePermission } from '@/types/rbac';
```

### 2. Estrutura de um Arquivo de Tipos

Cada arquivo `*.types.ts` segue esta convenção:

```typescript
// src/types/stock/product.types.ts

// 1. Importações de outros módulos (sempre com 'import type')
import type { PaginationMeta, PaginatedQuery } from '../pagination';
import type { TemplateAttributes } from './template.types';
import type { Supplier } from './supplier.types';

// 2. Tipos de status como union types
export type ProductStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DISCONTINUED'
  | 'OUT_OF_STOCK';

// 3. Mapas de labels em PT-BR para o status
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  DISCONTINUED: 'Descontinuado',
  OUT_OF_STOCK: 'Sem Estoque',
};

// 4. Interface principal da entidade
export interface Product {
  id: string;
  name: string;
  status: ProductStatus;
  // ...
  createdAt: Date; // atenção: stock usa Date (herança histórica)
  updatedAt?: Date;
}

// 5. Interfaces de request (Create, Update)
export interface CreateProductRequest {
  /* ... */
}
export interface UpdateProductRequest {
  /* ... */
}

// 6. Interfaces de response
export interface ProductResponse {
  product: Product;
}
export interface ProductsResponse {
  products: Product[];
}

// 7. Query params
export interface ProductsQuery extends PaginatedQuery {
  templateId?: string;
  status?: ProductStatus;
  search?: string;
}

// 8. Response paginada
export interface PaginatedProductsResponse {
  products: Product[];
  pagination: PaginationMeta;
}
```

### 3. Barrel do Módulo

```typescript
// src/types/stock/index.ts
export * from './product.types';
export * from './variant.types';
export * from './item.types';
// ... demais entidades

// Reexporta tipos de paginação para retrocompatibilidade
export type { PaginationMeta, PaginatedQuery } from '../pagination';
```

### 4. Barrel Raiz com Tratamento de Conflitos

O `src/types/index.ts` reexporta todos os módulos, mas alguns módulos possuem nomes conflitantes e precisam de reexportação seletiva:

```typescript
// src/types/index.ts

// Módulos sem conflito — reexportação simples
export * from './admin';
export * from './auth';
export * from './calendar';
export * from './common';
export * from './email';
export * from './finance';
export * from './hr';
export * from './sales';
export * from './stock';
export * from './storage';

// Tasks tem conflito com sales (Comment, CreateCommentRequest)
// Importe de '@/types/tasks' diretamente para tipos específicos de tasks
export {
  type Card,
  type Board,
  type Column,
  type Checklist,
  // ...
} from './tasks';

// RBAC tem conflito com auth (Permission, PermissionGroup)
// Importe de '@/types/rbac' diretamente para tipos específicos de RBAC
export {
  type PermissionWithEffect,
  type EffectivePermission,
  type AllPermissionsResponse,
  // ...
} from './rbac';
```

### 5. Tipos de Paginação

Todos os endpoints de listagem usam o sistema de paginação unificado definido em `src/types/common/pagination.ts`:

```typescript
// Metadados de paginação — formato normalizado
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number; // normalizado de 'limit' ou 'perPage'
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// Query params para envio ao backend
export interface PaginatedQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Função utilitária — normaliza inconsistências do backend
export function normalizePagination(raw: RawPaginationMeta): PaginationMeta {
  const limit = raw.limit ?? raw.perPage ?? 20;
  const totalPages =
    raw.totalPages ?? raw.pages ?? Math.ceil(raw.total / limit);
  return {
    total: raw.total,
    page: raw.page,
    limit,
    totalPages,
    hasNext: raw.hasNext ?? raw.page < totalPages,
    hasPrev: raw.hasPrev ?? raw.page > 1,
  };
}
```

Uso em interfaces de query:

```typescript
// src/types/stock/product.types.ts
export interface ProductsQuery extends PaginatedQuery {
  templateId?: string;
  categoryId?: string;
  status?: ProductStatus;
  search?: string;
}
```

### 6. Mapas de Labels PT-BR (Enums)

Enums e seus mapas de labels em português estão centralizados em `src/types/common/enums.ts`. O padrão é: enum TypeScript + objeto `NOME_LABELS` com o mesmo conjunto de chaves.

```typescript
// src/types/common/enums.ts
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  [TenantStatus.ACTIVE]: 'Ativo',
  [TenantStatus.INACTIVE]: 'Inativo',
  [TenantStatus.SUSPENDED]: 'Suspenso',
};

export enum PlanTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  [PlanTier.FREE]: 'Gratuito',
  [PlanTier.STARTER]: 'Iniciante',
  [PlanTier.PROFESSIONAL]: 'Profissional',
  [PlanTier.ENTERPRISE]: 'Empresarial',
};
```

O mesmo padrão é replicado nos módulos individuais para status de domínio:

```typescript
// src/types/stock/item.types.ts
export type ItemStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_TRANSIT'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'DISPOSED';

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  AVAILABLE: 'Disponível',
  RESERVED: 'Reservado',
  IN_TRANSIT: 'Em Trânsito',
  DAMAGED: 'Danificado',
  EXPIRED: 'Expirado',
  DISPOSED: 'Descartado',
};
```

### 7. Convenção de Datas

O backend serializa datas como strings ISO 8601 via JSON. A regra geral é usar `string` para datas, mas há inconsistência histórica no módulo `stock`:

| Módulo                    | Tipo de data | Observação                                            |
| ------------------------- | ------------ | ----------------------------------------------------- |
| `hr/`                     | `string`     | Padrão correto (ex: `hireDate: string`)               |
| `auth/`                   | `Date`       | Herança histórica                                     |
| `stock/`                  | `Date`       | Herança histórica em `Product`, `Variant`, `Category` |
| `stock/template.types.ts` | `string`     | Já migrado para string                                |
| `rbac/`                   | `string`     | Padrão correto (ex: `createdAt: string`)              |
| `finance/`                | `string`     | Padrão correto                                        |

Para novas entidades, use sempre `string` para datas. Ao editar entidades antigas, mantenha o tipo existente para não quebrar componentes dependentes sem necessidade.

### 8. Política de `any`

A regra ESLint `no-explicit-any` está definida como `error`. Use as alternativas:

```typescript
// INCORRETO
attributes: any;
metadata: any;

// CORRETO
attributes: Record<string, unknown>;
metadata: Record<string, unknown>;

// Para JSON livre
data: unknown;
```

A única exceção é `src/components/ui/entity-form.tsx`, que possui um `eslint-disable` no nível do arquivo devido a restrições de generics do react-hook-form.

### 9. Shims de Retrocompatibilidade

Quatro arquivos na raiz de `src/types/` funcionam como shims para imports legados. Eles **não devem ser removidos** enquanto houver código importando diretamente deles:

```typescript
// src/types/pagination.ts
export * from './common/pagination';

// src/types/enums.ts
export * from './common/enums';

// src/types/dashboard.ts
export * from './admin/dashboard.types';

// src/types/tenant.ts
export * from './admin/tenant.types';
```

### 10. Tipos Exclusivamente Frontend

Alguns tipos não possuem equivalente no backend — eles representam configurações de UI, estados de componentes ou contratos de componentes reutilizáveis:

| Arquivo                    | Propósito                                                  |
| -------------------------- | ---------------------------------------------------------- |
| `entity-config.ts`         | Configuração de formulários, viewers e grids genéricos     |
| `brasilapi.ts`             | Respostas da API BrasilAPI (CEP, CNPJ)                     |
| `menu.ts`                  | Estrutura de menus de navegação                            |
| `settings.ts`              | Configurações de preferências do usuário                   |
| `admin/dashboard.types.ts` | `Module`, `SearchResult`, `Notification` (UI do dashboard) |

## Files

### Onde encontrar exemplos no codebase

| Padrão                                          | Arquivo de referência                  |
| ----------------------------------------------- | -------------------------------------- |
| Entidade com status + labels PT-BR              | `src/types/stock/item.types.ts`        |
| Entidade com relações expandidas                | `src/types/stock/product.types.ts`     |
| Entidade com dates como string (padrão correto) | `src/types/hr/employee.types.ts`       |
| Tipos de paginação e normalização               | `src/types/common/pagination.ts`       |
| Enums de sistema em PT-BR                       | `src/types/common/enums.ts`            |
| Barrel com conflitos resolvidos                 | `src/types/index.ts`                   |
| Barrel simples de módulo                        | `src/types/stock/index.ts`             |
| Shim de retrocompatibilidade                    | `src/types/pagination.ts`              |
| Tipos exclusivamente frontend                   | `src/types/entity-config.ts`           |
| Importação correta em hook                      | `src/hooks/stock/use-movements.ts`     |
| Importação correta em serviço                   | `src/services/hr/employees.service.ts` |

## Rules

### Quando usar este padrão

- Ao criar qualquer tipo TypeScript no frontend do OpenSea-APP.
- Ao adicionar um novo módulo de negócio ao sistema.
- Ao adicionar uma nova entidade a um módulo existente.

### Quando NÃO fazer

- **Não crie arquivos de tipo monolíticos** como `types.ts` ou `all-types.ts` na raiz.
- **Não importe de arquivos `*.types.ts` individuais** — sempre importe do barrel `index.ts`.
- **Não use `any`** — use `unknown` ou `Record<string, unknown>`.
- **Não delete os shims de retrocompatibilidade** na raiz de `src/types/` sem antes migrar todos os imports existentes.
- **Não coloque tipos de UI/componente** nos mesmos arquivos de tipos de domínio (ex: não misture `Product` com `ProductCardProps`).

### Como adicionar uma nova entidade a um módulo existente

1. Crie `src/types/{module}/nova-entidade.types.ts`
2. Adicione `export * from './nova-entidade.types'` no `src/types/{module}/index.ts`
3. Pronto — todos os `import { X } from '@/types/{module}'` recebem os novos tipos automaticamente

```typescript
// Passo 1 — criar o arquivo
// src/types/stock/nova-entidade.types.ts
export interface NovaEntidade {
  id: string;
  nome: string;
  criadoEm: string; // use string para datas
}

// Passo 2 — registrar no barrel
// src/types/stock/index.ts
export * from './nova-entidade.types'; // adicionar esta linha
```

### Como adicionar um novo módulo

1. Crie o diretório `src/types/{modulo}/`
2. Crie os arquivos `*.types.ts` com os tipos das entidades
3. Crie o `src/types/{modulo}/index.ts` reexportando tudo
4. Adicione `export * from './{modulo}'` no `src/types/index.ts` raiz
5. Se houver conflitos de nomes com outros módulos, use reexportação seletiva no barrel raiz

### Sincronização com o Backend

Os tipos frontend **devem refletir os schemas Zod do backend**. O padrão no backend é:

```typescript
// Backend: src/http/schemas/stock/products/product.schema.ts
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  templateId: z.string().uuid(),
  supplierId: z.string().uuid().optional(),
});

// updateSchema herda do createSchema tornando tudo opcional
const updateProductSchema = createProductSchema.partial();
```

O frontend espelha esse padrão:

```typescript
// Frontend: src/types/stock/product.types.ts
export interface CreateProductRequest {
  name: string; // z.string().min(1).max(255)
  templateId: string; // z.string().uuid()
  supplierId?: string; // z.string().uuid().optional()
}

export interface UpdateProductRequest {
  name?: string; // createSchema.partial() torna todos opcionais
  templateId?: string;
  supplierId?: string;
}
```

### Armadilhas Comuns

**Importar de arquivo individual em vez do barrel:**

```typescript
// Causa: o arquivo individual pode ser movido ou renomeado
import type { Product } from '@/types/stock/product.types'; // ERRADO
import type { Product } from '@/types/stock'; // CORRETO
```

**Usar `Date` em novos tipos:**

```typescript
// O JSON.parse() retorna strings — Date(string) causa bugs silenciosos
createdAt: Date; // INCORRETO para novos tipos
createdAt: string; // CORRETO — ISO 8601 retornado pelo backend
```

**Definir tipos de domínio em arquivos de componente:**

```typescript
// Causa acoplamento e impede reuso
// src/components/ProductCard.tsx — ERRADO
interface Product {
  id: string;
  name: string;
}

// src/types/stock/product.types.ts — CORRETO
export interface Product {
  id: string;
  name: string;
}
```

**Ignorar conflitos de nomes no barrel raiz:**

Os módulos `tasks` e `sales` ambos exportam `Comment`. Os módulos `rbac` e `auth` ambos exportam `Permission` e `PermissionGroup`. Esses conflitos já estão tratados no `src/types/index.ts` com reexportação seletiva. Para tipos específicos desses módulos, importe sempre pelo caminho do módulo: `@/types/tasks` ou `@/types/rbac`.
