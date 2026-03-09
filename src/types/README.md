# Frontend Types Architecture

## Structure

Types are organized by **domain module** in subdirectories. Each module has:

- Individual `*.types.ts` files (one per entity/concern)
- A barrel `index.ts` that re-exports everything

```
types/
  stock/           # Product, Variant, Item, Warehouse, Supplier, etc.
  hr/              # Employee, Department, Company
  auth/            # User, Session, AuditLog
  sales/           # Customer, Order, Comment, Promotion, Reservation
  rbac/            # Permission, PermissionGroup
  admin/           # Dashboard (frontend), Tenant
  common/          # Pagination, Enums (shared across modules)
```

## How to Import

Always import from the **module barrel**, never from individual files:

```typescript
// CORRECT
import type { Product, Variant } from '@/types/stock';
import type { Employee } from '@/types/hr';
import type { PaginationMeta } from '@/types/pagination';

// WRONG - never import from individual type files
import type { Product } from '@/types/stock/product.types';
```

## How to Add a New Type

### To an existing entity:

Edit the corresponding `*.types.ts` file. The barrel re-export handles the rest.

```
Adding `weight` to Product?
  -> Edit: src/types/stock/product.types.ts
  -> Done. All `import { Product } from '@/types/stock'` get the new field.
```

### New entity in an existing module:

1. Create `src/types/{module}/new-entity.types.ts`
2. Add `export * from './new-entity.types'` to `src/types/{module}/index.ts`

### New module:

1. Create `src/types/{module}/` directory
2. Create type files + `index.ts` barrel
3. Add `export * from './{module}'` to `src/types/index.ts`

## Rules

| Rule              | Detail                                                             |
| ----------------- | ------------------------------------------------------------------ |
| No `any`          | Use `unknown` or `Record<string, unknown>`. ESLint warns on `any`. |
| Dates as `string` | JSON returns ISO strings. Use `string`, not `Date`.                |
| Match backend     | Types must match backend Zod schemas exactly.                      |
| `import type`     | Always use `import type` for type-only imports.                    |
| No monoliths      | One file per entity/concern. Max ~200 lines per file.              |

## Backwards Compatibility

Root-level shim files re-export from subdirectories for backwards compatibility:

- `pagination.ts` -> `./common/pagination`
- `enums.ts` -> `./common/enums`
- `dashboard.ts` -> `./admin/dashboard.types`
- `tenant.ts` -> `./admin/tenant.types`

Do NOT delete these shims - some imports reference them directly.

## Swagger

```bash
npm run api:export   # Export swagger.json from backend
```

Type generation from Swagger was removed — backend schemas are inline (not `$ref`-based), producing unusable types. All types are maintained manually in module directories. Future investment in named Swagger schemas will enable re-adding auto-generation.
