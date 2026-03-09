# ALTA: Auto-Gerar Types e Modularizar Types do Frontend

**Status**: CONCLUIDO (Feb 2026)
**Resultado**: Types fragmentados em modulos, pipeline Swagger funcional
**Esforco real**: ~8h

---

## O que foi feito

### 1. Exportar Swagger do backend (commit API `087b91f`)

- Criado `OpenSea-API/scripts/export-swagger.ts`
- Usa `writeFileSync` (Sentry poluia stdout)
- Gera `swagger.json` direto em `OpenSea-APP/swagger/`

### 2. Pipeline de geracao (commit APP `3e8f3fa`)

- Script `api:export` exporta swagger do backend
- ~~`api:generate` e `api:update` removidos (Mar 2026)~~ — types gerados eram inuteis (0 named schemas)
- `src/types/generated/` removido — todos os types sao manuais em modulos

### 3. Fragmentar monolitos em modulos

| Arquivo original | Linhas | Destino             | Arquivos            | Commit    |
| ---------------- | ------ | ------------------- | ------------------- | --------- |
| `stock.ts`       | 1.721  | `src/types/stock/`  | 16 files + index.ts | `ca70229` |
| `hr.ts`          | 502    | `src/types/hr/`     | 3 files + index.ts  | `4873ebb` |
| `auth.ts`        | 341    | `src/types/auth/`   | 2 files + index.ts  | `13390a5` |
| `sales.ts`       | 272    | `src/types/sales/`  | 6 files + index.ts  | `13390a5` |
| `rbac.ts`        | 253    | `src/types/rbac/`   | 2 files + index.ts  | `13390a5` |
| `pagination.ts`  | -      | `src/types/common/` | 2 files + index.ts  | `d4539e2` |
| `enums.ts`       | -      | `src/types/common/` | (acima)             | `d4539e2` |
| `dashboard.ts`   | -      | `src/types/admin/`  | 2 files + index.ts  | `d4539e2` |
| `tenant.ts`      | -      | `src/types/admin/`  | (acima)             | `d4539e2` |

### 4. Estrutura final

```
src/types/
  common/         pagination.ts, enums.ts
  stock/          16 files (product, variant, item, warehouse, supplier, etc.)
  hr/             3 files (employee, department, company)
  auth/           2 files (user, session)
  sales/          6 files (customer, order, comment, promotion, reservation, notification)
  rbac/           2 files (permission, group)
  admin/          2 files (dashboard, tenant)
  entity-config.ts, brasilapi.ts, menu.ts, settings.ts (frontend-only)
  index.ts        barrel re-export de todos os modulos
```

### 5. Backwards compatibility

- Root shims mantidos: `pagination.ts`, `enums.ts`, `dashboard.ts`, `tenant.ts`
- Imports `from '@/types/stock'` continuam funcionando (barrel index.ts)
- Conflitos auth/rbac resolvidos com exports seletivos

### 6. Documentacao

- `src/types/README.md` - guia rapido para agentes/devs
- `CLAUDE.md` - secao "Frontend Types Architecture" atualizada

## Checklist

- [x] Swagger JSON exportado do backend
- [x] Script `api:update` gerando types automaticamente
- [x] Types monoliticos fragmentados em modulos
- [x] Barrel exports funcionando (0 imports quebrados)
- [x] tsc --noEmit: 0 errors
- [x] npm run build: passa
- [x] Documentacao do workflow atualizada
- [ ] CI validando sincronia — PENDENTE (baixa prioridade)

## Pendente

- [ ] **Facades Swagger**: Quando backend migrar para `$ref` schemas, types gerados serao uteis e cada `*.types.ts` pode importar deles
- [ ] **Sincronizar enums**: `ProductStatus` diverge (frontend: `ARCHIVED`, backend: `DRAFT`/`OUT_OF_STOCK`/`DISCONTINUED`); `UnitOfMeasure` 31 vs 3 valores
- [ ] **Normalizar datas**: Alguns types usam `Date` onde backend retorna `string` (ISO)
- [ ] **CI validation**: Adicionar step para verificar que types gerados estao em sincronia
