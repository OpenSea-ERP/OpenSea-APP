# Storybook Pattern (OpenSea-APP)

> **Status:** Adotado em 2026-04-30 — catálogo vivo de componentes UI/shared/layout exposto via MCP para agentes (Claude Code).

## Stack pinada (snapshot baseline 2026-04-30)

| Pacote                    | Versão (pinada exata) |
| ------------------------- | --------------------- |
| `storybook`               | `10.3.6`              |
| `@storybook/nextjs-vite`  | `10.3.6`              |
| `@storybook/addon-mcp`    | `0.6.0` (preview)     |
| `@storybook/addon-vitest` | `10.3.6`              |
| `@storybook/addon-themes` | `10.3.6`              |
| `@storybook/addon-a11y`   | `10.3.6`              |

**Regra:** versões pinadas sem `^`/`~` em `package.json`. MCP em preview — minor bumps podem quebrar `/mcp` silenciosamente.

## Localização

- Config: `OpenSea-APP/.storybook/main.ts` + `preview.tsx`
- Stories: **co-localizadas** com componentes (`button.tsx` ↔ `button.stories.tsx`)
- Templates sintéticos: `OpenSea-APP/.storybook/templates/`
- Fixtures: `OpenSea-APP/src/__fixtures__/<dominio>/`

## Convenções de título

- `UI/<Componente>` — primitivos em `components/ui/`
- `Shared/<Categoria>/<Componente>` — compostos em `components/shared/` ou `components/layout/`
- `Pages/<Padrão>` — templates sintéticos
- `Modules/<Modulo>/<Componente>` — específicos de módulo (raro)

## Estrutura mínima (CSF3)

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponenteX } from './componente-x';

const meta = {
  title: 'UI/ComponenteX',
  component: ComponenteX,
  tags: ['autodocs'],
  parameters: { layout: 'centered' }, // ou 'fullscreen'
} satisfies Meta<typeof ComponenteX>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    /* ... */
  },
};
```

## Idioma

Textos visíveis em **PT-BR** (mesma língua da UI real). Comentários e variáveis em inglês (regra do projeto).

## Estados obrigatórios por categoria

| Categoria           | Estados mínimos                                               |
| ------------------- | ------------------------------------------------------------- |
| Primitivos `ui/`    | Default + variants/sizes da `cva` + disabled                  |
| Inputs              | Default + Focused + Error + Disabled + WithLabel + WithHelper |
| Modais              | Open + WithLoading + WithError                                |
| Cards de dado       | Default + Loading + Error + Empty                             |
| Templates de página | Desktop + Mobile + Loading + Empty + Error + WithFilters      |

## Acessibilidade

- `addon-a11y` ativo globalmente com `parameters.a11y.test = 'error'` (Vitest/CI gate bloqueante)
- Run only `wcag2a` + `wcag2aa` rules
- Desabilitar checks específicos só com justificativa: `parameters.a11y.disable = true` + comentário

## Mocks globais (`preview.tsx`)

- TanStack Query: `QueryClient` novo por story (decorator global, sem cache cross-story)
- Theme: `withThemeByClassName` + `next-themes` ThemeProvider
- Next router: `parameters.nextjs.appDirectory: true` global (App Router)
- Dados: factory functions em `src/__fixtures__/<dominio>/` (`mockProduct`, `mockProducts`, `mockUser`, etc.)
- Imagens: `public/storybook-fixtures/`

## MCP

- **Local:** `http://localhost:6006/mcp` quando `npm run storybook` está rodando
- **Deployed:** `https://opensea-storybook.fly.dev/mcp` (Fase 2 — Fly.io app dedicado, auto-stop habilitado)
- **Tools expostas (verificadas no boot 2026-04-30):**
  - `preview-stories` — get story preview URLs por id ou path
  - `get-storybook-story-instructions` — instruções de desenvolvimento
  - `run-story-tests` — rodar Vitest com a11y check
  - `list-all-documentation` — listar componentes catalogados
  - `get-documentation` — docs por id
  - `get-documentation-for-story` — docs de variante específica

## Snapshot funcional — respostas às 5 questões abertas do spec

1. **Endpoint `/mcp` em deploy:** o dev server (`storybook dev`) é quem expõe `/mcp` via Vite middleware. Build estático servido por `serve` ou `nginx` **não expõe** o endpoint. → Para Fly.io usar **Estratégia B** (rodar `storybook dev --ci --no-open` no container).
2. **Manifests:** addon-mcp opera **on-the-fly** sobre o dev server (necessita Vite middleware), confirmando Estratégia B.
3. **App Router config:** **global** em `preview.tsx` via `parameters.nextjs.appDirectory: true` — não precisa setar por story.
4. **Server Components nos 10 alvos:**
   - **Sem `'use client'`:** `button.tsx`, `input.tsx`, `card.tsx` (RSC-compatible — sem hooks; renderizam normalmente em Storybook)
   - **Com `'use client'`:** `form.tsx`, `dialog.tsx`, `page-action-bar.tsx`, `empty-state.tsx`, `stats-card.tsx`, `entity-grid.tsx`, `entity-form.tsx`, `shared/page-header.tsx`
   - Nenhum exigiu wrapper Client adicional.
5. **Versões pinadas:** ver tabela "Stack pinada" acima.

## Achados durante adoção

- **`PageHeader` real é em `src/components/shared/page-header.tsx`**, com props diretas `{ title, description, icon, gradient, ... }`. NÃO existe `src/components/layout/page-header.tsx`. O componente em `src/components/shared/layout/page-header.tsx` está marcado `@deprecated` e deve ser removido em milestone futuro.
- **`PageActionBar`** real (em `src/components/layout/page-action-bar.tsx`) recebe `{ breadcrumbItems, buttons, actionButtons, hasPermission, actions, children }` — não é só wrapper de botões.
- **Husky** está configurado no root do monorepo (`/d/Code/Projetos/OpenSea/.husky/`) e o `pre-commit` invoca `cd OpenSea-APP && npx lint-staged`. Hook de coverage (Task 22) deve ser instalado em **`OpenSea-APP/.husky/`** (criar) ou no script de pre-commit do root.

## Smoke test do MCP

```bash
# Local — dev server rodando
curl -s -X POST http://localhost:6006/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Deployed
curl -s -X POST https://opensea-storybook.fly.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Resposta esperada: SSE stream com `result.tools` listando 6 tools.

## Política contínua (Fase 3)

- Componente novo em `components/ui/`, `components/shared/` ou `components/layout/` → story junto, no mesmo PR. Hook pre-commit avisa se faltar.
- Edição de componente catalogado → atualizar story no mesmo PR.
- Componentes específicos de módulo (`components/<modulo>/...`) → catalogar quando padrão se repete em 3+ módulos.
- Revisão trimestral: rodar `npm run storybook:coverage` e identificar gaps de cobertura.
