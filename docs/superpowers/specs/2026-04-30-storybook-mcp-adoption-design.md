# Storybook + MCP Adoption — Design Spec

**Data:** 2026-04-30
**Autor:** Guilherme + Claude (Opus 4.7)
**Status:** Draft pronto para revisão por par (Codex)
**Repositório alvo:** `OpenSea-APP/`

---

## Contexto e motivação

OpenSea-APP tem hoje 50+ primitivos shadcn/Radix em `components/ui/`, dezenas de compostos em `components/shared/` e padrões de página documentados em `OpenSea-APP/docs/patterns/`. Quando Claude (ou outro agente) cria novas páginas, a inconsistência mais comum é **reinventar variantes de componentes existentes**, **errar espaçamento/tema** ou **deixar de cobrir estados** (loading, erro, empty, dark mode).

A solução escolhida não é construir um design system formal (custo de meses, ROI insuficiente para o tamanho do time atual). É instalar **Storybook como pseudo design system** — catálogo vivo de tudo que já existe — e expor o catálogo via **MCP** para que agentes (Claude Code) consultem componentes e seus padrões antes de escrever código novo.

## Decisões de produto (consolidadas com o usuário)

| Decisão                           | Escolha                                                                                | Justificativa                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Escopo de cobertura**           | Primitivos `ui/` + compostos `shared/` + páginas-padrão (entity-list, form, dashboard) | Cobertura completa é o que dá ganho real para a IA — primitivos sozinhos não evitam o erro mais comum (replicar shared incorreto) |
| **Papel do MCP**                  | Lookup (referência) + Verificação visual                                               | Lookup primeiro (depende só de stories básicas); verificação visual amadurece quando estados estiverem cobertos                   |
| **Estratégia de adoção**          | Híbrida: foundation forte + regra "novo código → story" + backfill oportunístico       | Evita "limpeza arqueológica" sem dono; cresce com o trabalho real                                                                 |
| **Hosting**                       | Local + deploy estático no GitHub Pages                                                | Local pra desenvolvimento; deployed pra acesso permanente do agente sem depender de servidor rodando                              |
| **Regressão visual automatizada** | Adiar                                                                                  | Esperar catálogo estabilizar (3-6 meses) antes de escolher Chromatic vs Playwright snapshots                                      |
| **Versão Storybook**              | Última estável                                                                         | Não pinar — usar a mais recente que ofereça MCP oficial                                                                           |

## Arquitetura

### Localização

- Configuração: `OpenSea-APP/.storybook/`
- Stories: **co-localizadas** com componentes (`button.tsx` ↔ `button.stories.tsx`) — padrão Storybook moderno, mantém story perto do código que descreve, evita pasta paralela que envelhece
- Documentação de padrões: `OpenSea-APP/docs/patterns/storybook-pattern.md` (novo)
- Spec/plan: este arquivo + plano correspondente em `OpenSea-APP/docs/superpowers/plans/`

### Stack

- `storybook` — instalar última estável durante setup, **pinar exatamente** (sem `^`/`~`) após primeiro setup funcional. MCP está em preview; minor bumps podem quebrar o endpoint silenciosamente.
- `@storybook/nextjs-vite` — framework recomendado pra Next.js apps. Compatível com Vite (que `@storybook/addon-mcp` e `@storybook/addon-vitest` exigem). Fallback `@storybook/nextjs` (Webpack) só se incompatibilidade real com `next.config.ts` aparecer.
- `@storybook/addon-mcp` — servidor MCP oficial (component discovery, story generation, live preview).
- `@storybook/addon-vitest` — integração com Vitest existente do projeto (substitui o legacy `test-runner` baseado em Jest).
- `@storybook/addon-themes` — toggle light/dark integrado com `next-themes` (já presente no app).
- `@storybook/addon-a11y` — verificação de acessibilidade automática por story (axe-core).
- App Router config: `parameters.nextjs.appDirectory: true` global em `.storybook/preview.tsx` (codebase é Next 16 App Router).

### Três ambientes coexistindo

> **Correção pós-revisão Codex:** GitHub Pages (estático) **não pode servir o endpoint MCP** — `@storybook/addon-mcp` precisa de processo Node rodando. Deploy migrado para **Fly.io** (consistente com OpenSea-API) que já é o stack de hosting do projeto.

1. **Local dev** (`npm run storybook`)
   - Roda em `http://localhost:6006`
   - MCP em `http://localhost:6006/mcp`
   - Hot reload de stories
   - Uso: desenvolver/editar stories

2. **Build estático** (`npm run build-storybook`)
   - Gera `OpenSea-APP/storybook-static/`
   - Usado dentro do container Fly (servido via `storybook dev` em produção, ou via `npx storybook serve` apontando pro static — escolha a definir na Fase 2 conforme suporte oficial)
   - Adicionado ao `.gitignore`

3. **Deployed** (Fly.io app dedicado: `opensea-storybook` ou similar)
   - Container roda Storybook em modo "served" expondo UI estática + endpoint `/mcp`
   - Trigger: deploy manual via Fly MCP (`mcp__flyctl__fly-machine-*`) seguindo regra do projeto, ou GitHub Action que invoca `flyctl deploy`
   - URL: `https://opensea-storybook.fly.dev` (ajustar conforme app criado)
   - Sizing inicial: shared-cpu-1x / 256MB (~US$1,94/mês — barato porque são poucas requisições do agente)
   - Auto-stop: habilitar `auto_stop_machines` pra zerar custo quando ocioso
   - Catálogo é referência viva (sem segredos), exposição pública é OK
   - Uso: agente consulta sem depender de servidor local; usuário acessa do celular

### Integração MCP no workflow do agente

`OpenSea-APP/.mcp.json` (ou `.claude/settings.local.json`) registra dois servidores MCP Storybook:

```jsonc
{
  "mcpServers": {
    "storybook-local": {
      "url": "http://localhost:6006/mcp",
      "comment": "Usado quando o usuário está rodando Storybook local",
    },
    "storybook-deployed": {
      "url": "https://opensea-storybook.fly.dev/mcp",
      "comment": "Fallback Fly.io quando local não está up",
    },
  },
}
```

Agente prioriza local (mais atualizado); cai para deployed se local não responder.

**Validação obrigatória na Fase 1**: confirmar que `@storybook/addon-mcp` em modo build estático/served expõe o endpoint corretamente. Se a versão atual exigir o dev server completo, adaptar o Dockerfile do Fly pra rodar `storybook dev` em modo produção (build pré-aquecido).

### Tailwind 4

- `.storybook/preview.tsx` importa `src/app/globals.css` direto (sem arquivo `preview.css` intermediário)
- `@storybook/nextjs-vite` herda automaticamente o PostCSS do projeto (`postcss.config.mjs` já tem `@tailwindcss/postcss` configurado) — **não duplicar config**
- Só intervir manualmente se aparecer build break real (improvável segundo verificação Codex: setup atual de Tailwind 4 é mínimo e compatível)

### Tema (light/dark)

- Decorator global em `.storybook/preview.tsx` envolve cada story com `<ThemeProvider>` do `next-themes`
- Toolbar do Storybook expõe toggle (via `addon-themes`)
- Stories críticas (Button, Card, Input, Form, PageHeader) cobrem **explicitamente** ambos os temas (variantes `Light` / `Dark` na story)
- Demais stories herdam o toggle global (visualizam dark mas não documentam estados específicos)

### Mocks

- **TanStack Query**: decorator global cria `QueryClient` por story (evita cache cruzado), aplicado em `.storybook/preview.tsx`
- **Next.js router/params**: `@storybook/nextjs-vite` provê mocks via `parameters.nextjs.router` por story; App Router habilitado via `parameters.nextjs.appDirectory: true` global
- **Dados**: factory functions em `OpenSea-APP/src/__fixtures__/<dominio>/` (ex: `__fixtures__/products.ts` exporta `mockProduct()`, `mockProducts(n)`). Reutilizáveis entre stories, testes Vitest e testes E2E
- **Imagens**: pastas `OpenSea-APP/public/storybook-fixtures/` para imagens estáticas usadas como avatar/logo demo

## Convenções de stories (padrão CSF3)

Documento canônico: `OpenSea-APP/docs/patterns/storybook-pattern.md` (criado na Fase 1).

### Estrutura mínima

Toda story segue:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponenteX } from './componente-x';

const meta = {
  title: 'UI/ComponenteX', // ou 'Shared/...', 'Pages/...'
  component: ComponenteX,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered', // ou 'fullscreen' para páginas
  },
  argTypes: {
    /* controls */
  },
} satisfies Meta<typeof ComponenteX>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    /* ... */
  },
};
// + variantes/estados relevantes
```

### Hierarquia de títulos

- `UI/<Componente>` — primitivos em `components/ui/`
- `Shared/<Categoria>/<Componente>` — compostos em `components/shared/` (ex: `Shared/Cards/StatsCard`)
- `Pages/<Padrão>` — templates de página (ex: `Pages/EntityListPage`)
- `Modules/<Modulo>/<Componente>` — componentes específicos de módulo (raro, só quando faz sentido catalogar)

### Idioma

Textos visíveis em **PT-BR** (mesma língua da UI real). Comentários e nomes de variáveis em inglês (regra do projeto).

### Estados obrigatórios por categoria

| Categoria                                  | Estados mínimos                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| Primitivos `ui/`                           | Default + todas variants/sizes da `cva` + disabled (se aplicável)       |
| Inputs (Input, Combobox, DatePicker, etc.) | Default + Focused + Error + Disabled + WithLabel + WithHelper           |
| Modais/Dialogs                             | Open + WithLoading + WithError                                          |
| Cards de dado (StatsCard, etc.)            | Default + Loading + Error + Empty                                       |
| Páginas-template                           | Desktop + Mobile + Loading + Empty + Error + WithFilters (se aplicável) |

### Acessibilidade

- `addon-a11y` ativo globalmente
- CI gate na Fase 2: stories com violações `serious` ou `critical` quebram build
- Stories podem desativar checks específicos com `parameters.a11y.disable = true` (com justificativa em comentário)

## Fases de execução

### Fase 1 — Foundation (3-5 dias)

**Saída:** Storybook funcional + 10 stories exemplares + MCP local + documento de convenções.

**Tarefas:**

1. **Instalação** (~2h)
   - `npx storybook@latest init` em `OpenSea-APP/` — escolher framework `@storybook/nextjs-vite` quando o init perguntar (NÃO o Webpack-based `@storybook/nextjs`)
   - Adicionar deps: `@storybook/addon-mcp`, `@storybook/addon-vitest`, `@storybook/addon-themes`, `@storybook/addon-a11y`
   - Configurar `.storybook/main.ts` (framework `@storybook/nextjs-vite`, addons, paths, static dirs)
   - Configurar `.storybook/preview.tsx`:
     - Importar `src/app/globals.css` direto (sem `preview.css` intermediário)
     - Decorator global: `<ThemeProvider>` (next-themes), `<QueryClientProvider>` (TanStack Query, novo `QueryClient` por story)
     - `parameters.nextjs.appDirectory: true` global (App Router)
   - **Pinar versão exata** após primeiro `npm run storybook` rodar limpo (ex: `"storybook": "10.3.1"` sem `^`)
   - Validar build: `npm run storybook` sem erros
   - Adicionar `storybook-static/` ao `.gitignore`
   - Adicionar scripts ao `package.json`: `storybook`, `build-storybook`
   - **Gate antes de avançar:** responder as 5 questões abertas (ver seção dedicada) e atualizar `storybook-pattern.md` com as respostas

2. **Convenções** (~2h)
   - Criar `OpenSea-APP/docs/patterns/storybook-pattern.md` com regras acima
   - Adicionar entrada em `OpenSea-APP/docs/patterns/frontend-patterns.md` apontando pra ele
   - Criar `OpenSea-APP/src/__fixtures__/index.ts` (placeholder) e exemplos para 1-2 domínios

3. **10 stories exemplares** (~2-3 dias)

   Lista verificada contra o código atual (Apr 2026):
   - **Lote A — Primitivos (4 stories):**
     1. `Button` (`components/ui/button.tsx`)
     2. `Input` + `Form` (`components/ui/input.tsx`, `components/ui/form.tsx`) — story conjunta cobrindo o padrão de form validado
     3. `Card` (`components/ui/card.tsx`)
     4. `Dialog` + `VerifyActionPinModal` (`components/ui/dialog.tsx` + `components/modals/...`) — primitivo + variante destrutiva obrigatória pela rule §7 do CLAUDE.md

   - **Lote B — Shared (3 stories):** 5. `PageHeader` + `PageActionBar` (canônico: `components/layout/page-header.tsx` + `components/layout/page-action-bar.tsx`) 6. `EmptyState` (`components/shared/empty-state.tsx`) 7. `StatsCard` (`components/shared/stats-card.tsx`)

   - **Lote C — Templates (3 stories):** 8. `EntityGrid` (`components/shared/grid/entity-grid.tsx`) — listagem completa com `toolbarStart`/filters/empty/loading/error 9. `EntityForm` (`components/shared/forms/entity-form.tsx`) — form padrão com `CollapsibleSection`, validação inline, loading/erro 10. **`EntityListPageTemplate`** (story sintética, sem `.tsx` correspondente) — demonstra o padrão `entity-list-layout-pattern.md` completo: `PageLayout` → `PageHeader` → `PageActionBar` → `Header` → `PageBody` → `SearchBar` → filters → `EntityGrid` → SelectionToolbar mockado. Vive em `OpenSea-APP/.storybook/templates/EntityListPageTemplate.stories.tsx`

   Cada story cobre os estados obrigatórios da categoria + ambos os temas. 1 commit por lote.

   **Achado durante design:** `components/shared/layout/entity-list-page.tsx` está **deprecated** (comentário no próprio código, recomenda migrar para `@/components/layout`). Não fazer story dele. Considerar em separado se vale fase pra remover/migrar consumidores.

4. **MCP local funcional** (~2h)
   - Validar `addon-mcp` configurado e respondendo em `localhost:6006/mcp`
   - Adicionar entry em `.mcp.json` ou `.claude/settings.local.json`
   - Smoke test: nova sessão Claude, listar componentes via MCP, verificar que retorna os 10
   - Documentar comando de smoke no `storybook-pattern.md`

**Critérios de saída:**

- `npm run storybook` levanta sem erros
- 10 stories renderizam corretamente em light e dark
- MCP responde (smoke test passou)
- `storybook-pattern.md` versionado
- Zero violações `critical` de acessibilidade nas 10 stories

### Fase 2 — Deploy Fly.io + Governança (2-3 dias)

**Saída:** Storybook deployed em Fly.io (UI + endpoint MCP), CI gate de a11y bloqueante, lint de cobertura, governança documentada.

**Tarefas:**

1. **App Fly.io dedicado** (~4h)
   - Criar app via Fly MCP: `mcp__flyctl__fly-apps-create` com nome `opensea-storybook` (ou similar disponível) na org pessoal
   - Criar `OpenSea-APP/Dockerfile.storybook` baseado em `node:22-alpine`:
     - `npm ci` (usar lockfile do APP)
     - `npm run build-storybook -- -o /app/storybook-static`
     - Comando final: rodar `storybook dev` em modo "served" sobre o build pré-aquecido (ou `npx storybook serve` se a versão escolhida suportar isso com `addon-mcp`). **Validar na Fase 1** qual modo expõe `/mcp` corretamente.
   - Criar `OpenSea-APP/fly.storybook.toml`:
     - `app = "opensea-storybook"`
     - `internal_port = 6006`
     - `[[services]]` com TLS + handlers `http`/`tls`
     - `[services.auto_stop_machines] = "stop"`, `min_machines_running = 0` (zera custo quando ocioso)
     - VM size: `shared-cpu-1x` / 256MB
   - Deploy inicial via Fly MCP (`mcp__flyctl__fly-machine-run` ou equivalente conforme regra do projeto que proíbe CLI `fly`)
   - Validar URL pública responde + `/mcp` responde

2. **GitHub Action de redeploy** (~2h)
   - Criar `.github/workflows/storybook-deploy.yml` em `OpenSea-APP/`
   - Trigger: push to `main` afetando `OpenSea-APP/src/components/**`, `OpenSea-APP/.storybook/**`, `OpenSea-APP/Dockerfile.storybook` ou `OpenSea-APP/fly.storybook.toml`
   - Steps: checkout → setup node → install deps → `flyctl deploy --config fly.storybook.toml` (Action permitida pra invocar flyctl com token; regra "Fly MCP only" se aplica a sessões interativas, não a CI)
   - Secret: `FLY_API_TOKEN` no repo

3. **MCP deployed registrado** (~30min)
   - Atualizar `OpenSea-APP/.mcp.json` com URL Fly.io
   - Smoke test: parar Storybook local, abrir nova sessão Claude Code, validar que MCP deployed responde com lista de componentes

4. **Lint gentil de cobertura** (~2h)
   - Husky `pre-commit` (já configurado): adicionar script `OpenSea-APP/scripts/check-storybook-coverage.mjs`
   - Detecta `.tsx` novo em `components/ui/` ou `components/shared/` sem `.stories.tsx` correspondente
   - **Comportamento: warn, não block** — mensagem amigável; commit prossegue

5. **CI gate de a11y bloqueante** (~3h, **escalado pela revisão Codex**)
   - Configurar `@storybook/addon-a11y` com fail em violações `serious`/`critical`
   - Adicionar step no CI principal (`OpenSea-APP/.github/workflows/<existente>.yml`) que roda `vitest --project=storybook` (via `@storybook/addon-vitest`) — bloqueia o PR se houver regressão a11y
   - Bloqueante desde já (não warn-only) — cobertura é estreita o suficiente nas Fase 1 (10 stories) pra não gerar churn

6. **Governança documentada** (~1h)
   - Atualizar `OpenSea-APP/docs/guides/developer-golden-rules.md`: regra "novo componente em `ui/` ou `shared/` → story junto, no mesmo PR"
   - Atualizar `OpenSea-APP/CLAUDE.md`: linha apontando pra `storybook-pattern.md`
   - Adicionar `OpenSea-APP/Dockerfile.storybook` e `fly.storybook.toml` à lista de "infra files" no CLAUDE.md

**Critérios de saída:**

- Storybook deployed no Fly.io acessível via URL pública
- MCP deployed funciona em sessão limpa do Claude (sem servidor local rodando)
- Auto-stop do Fly funcionando (machine para quando ocioso, sobe sob demanda)
- Hook pre-commit detecta componente novo sem story (com warn)
- A11y gate bloqueante ativo no CI (PR vermelho se regressão `serious`/`critical`)
- Regra documentada em developer-golden-rules.md

### Fase 3 — Regra contínua + backfill oportunístico (ongoing)

**Saída:** catálogo cresce com o trabalho real; sem trabalho dedicado de backfill.

**Política contínua:**

- **Componente/página nova** → story junto, no mesmo PR. Hook pre-commit avisa se faltou.
- **Edição de componente existente em `ui/` ou `shared/`** → adicionar story se não existir; atualizar se já existir. Vira parte da definition of done de qualquer task que toque esses paths.
- **Páginas de módulo (`components/<modulo>/...`)** → não exigem stories por default; só catalogar quando vira padrão repetido (3+ módulos com a mesma forma).

**Revisão trimestral (~1h por trimestre):**

- Rodar script que conta stories vs componentes existentes
- Identificar componentes/padrões mais usados sem story (gap de cobertura)
- Decidir se faz sentido backfill dirigido (quando 3+ tasks recentes tocaram um componente sem story)

## Decisões técnicas registradas

| Decisão        | Escolha                                                          | Alternativa rejeitada                          | Por quê                                                                                                        |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Framework      | `@storybook/nextjs-vite`                                         | `@storybook/nextjs` (Webpack)                  | Vite é exigência do `addon-mcp` e do `addon-vitest`; recomendação atual da Storybook                           |
| Versão         | Pinar exato após primeiro setup funcional                        | `latest`                                       | MCP em preview; minor bumps podem quebrar `/mcp` silenciosamente (Codex review)                                |
| Story format   | CSF3                                                             | MDX                                            | Type-safe, mais conciso, não duplica markdown que já mora em docs/                                             |
| Localização    | Co-localizada                                                    | Pasta `stories/` paralela                      | Stories envelhecem se distantes do componente                                                                  |
| MCP server     | `@storybook/addon-mcp` (oficial)                                 | `storybook-mcp-server` (terceiro)              | Oficial é suportado, terceiros podem morrer                                                                    |
| Test runner    | `@storybook/addon-vitest`                                        | `@storybook/test-runner` (Jest legacy)         | Integra com Vitest existente do projeto; é o caminho oficial do Storybook moderno                              |
| Deploy target  | **Fly.io** (app dedicado `opensea-storybook`)                    | GitHub Pages                                   | MCP precisa de Node em runtime; GitHub Pages é estático e **não pode servir** o endpoint `/mcp` (Codex review) |
| Mocks de Query | Decorator global                                                 | Mock por story                                 | Evita boilerplate; cada story cria QueryClient novo (sem cache cross-story)                                    |
| Dados          | Factories em `__fixtures__/`                                     | Inline por story                               | Reutilizáveis em testes Vitest e E2E                                                                           |
| Theme          | `addon-themes` + `next-themes`                                   | Toggle manual em decorator                     | `next-themes` já é a fonte de verdade do app                                                                   |
| A11y gate      | **Bloqueante no CI** desde Fase 2 (fail em `serious`/`critical`) | Warn-only                                      | Cobertura inicial é estreita (10 stories); bloquear desde já evita drift detectado por Codex                   |
| Lint coverage  | Warn (pre-commit)                                                | Block (CI)                                     | Block gera resistência; warn educa sem fricção                                                                 |
| PostCSS        | Herdar config existente do projeto sem duplicar                  | Configurar manualmente em `.storybook/main.ts` | `nextjs-vite` auto-pickup já funciona; intervir só se aparecer break real (Codex review)                       |

## Riscos e mitigações

| Risco                                                                                                                | Probabilidade  | Impacto | Mitigação                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addon-mcp` não suportar modo "served" sobre build estático e exigir `storybook dev` em produção                     | Média          | Alto    | Validar na **Fase 1** (smoke local). Se exigir dev server, Dockerfile do Fly roda `storybook dev` em prod; aumentar VM size se necessário. Plano B: rodar UI estática via `storybook serve` + serverless function no Fly executando o handler MCP |
| MCP oficial muda API antes de estabilizar (`addon-mcp` em preview)                                                   | Alta           | Médio   | Pinar versão exata após primeiro setup; documentar o snapshot funcional; aceitar churn manual nos updates                                                                                                                                         |
| Stories envelhecem (estados dark/loading/error divergem do real) — risco amplificado pelo defer de visual regression | Alta           | Alto    | A11y CI gate **bloqueante desde Fase 2**; lint warn de cobertura; co-localização; revisão trimestral; reavaliar visual regression em 3 meses (Codex review escalou esse risco)                                                                    |
| Suporte a Server Components em Storybook é experimental e alguns componentes podem não renderizar                    | Média          | Médio   | Identificar quais dos 10 são Server Components na Fase 1; extrair em wrappers Client Components quando necessário; documentar limitação no `storybook-pattern.md`                                                                                 |
| Fly.io machine demora pra acordar do auto-stop (cold start) prejudica primeira consulta MCP do agente                | Média          | Baixo   | Aceitar cold start de ~3-5s; documentar no `storybook-pattern.md`; agente faz fallback pra local se deployed timeout; se virar problema crônico, considerar `min_machines_running = 1` (custo ~US$5/mês)                                          |
| Tailwind 4 + Storybook tem incompatibilidade não-óbvia                                                               | Baixa          | Médio   | Codex confirmou setup atual é compatível; só intervir se aparecer break real                                                                                                                                                                      |
| Custo de manter 10 stories detalhadas vira overhead                                                                  | Baixa          | Médio   | Estados obrigatórios são mínimos comprovadamente úteis; expandir só sob demanda                                                                                                                                                                   |
| Equipe não adota a regra D                                                                                           | N/A (1 pessoa) | N/A     | Single-person project; disciplina é própria                                                                                                                                                                                                       |

## Métricas de sucesso

**Curto prazo (após Fase 1):**

- 10 stories funcionais
- MCP responde com lista de componentes em <500ms
- Smoke test do agente: criar uma página seguindo o template `EntityListPageTemplate` consultando MCP, comparar consistência vs criar do zero

**Médio prazo (3 meses após Fase 2):**

- Todo PR de `OpenSea-APP/` que mexe em `ui/` ou `shared/` tem story junto (verificar via git log)
- Acessibilidade: CI gate sem regressões `critical` por 30 dias
- Cobertura: pelo menos 50% dos componentes em `ui/` (~25/50) têm story

**Longo prazo (6 meses):**

- Decisão informada sobre regressão visual automatizada (Chromatic vs Playwright)
- Catálogo cobre os 80% dos padrões mais usados; resto vira gap conhecido
- Avaliação retrospectiva: a IA passou a errar menos em consistência? (heurística: PRs revisados por Codex apontam menos "isso já existe em X")

## Não-objetivos (YAGNI)

- ❌ **Design tokens formais** (cores/espaçamentos como `design-tokens.json`) — Tailwind 4 já é a fonte de verdade
- ❌ **Versionamento independente do Storybook** (publicar como pacote npm) — não é biblioteca consumida por terceiros
- ❌ **Visual regression na Fase 1** — adiado; ver Fase 3 / decisão futura
- ❌ **Stories pra todos os componentes de módulo** (ex: `components/finance/...`) — só padrões repetíveis viram template
- ❌ **MDX docs ricas** — manter docs em `docs/patterns/`; CSF3 + autodocs cobre 90% do uso
- ❌ **Storybook composition** (linkar storybook de outro repo) — over-engineering pra single repo

## Questões abertas a validar durante execução (Codex review)

Estas perguntas precisam de resposta concreta logo no início da Fase 1; o plano de execução tratará cada uma como gate antes de avançar para os 10 stories:

1. **`@storybook/addon-mcp` em modo deployed:** o endpoint `/mcp` é exposto pelo `storybook dev`, pelo `storybook serve` ou apenas pelo dev server interativo? Resposta dita o Dockerfile do Fly.
2. **`addon-mcp` lê manifests on-the-fly ou pré-gerados?** Se lê arquivos JSON do build, podemos servir de função stateless. Se exige Vite middleware, exige dev server.
3. **App Router config:** `parameters.nextjs.appDirectory: true` global cobre tudo, ou cada story precisa setar individualmente?
4. **Server Components nos 10 alvos:** quais dos componentes selecionados são Server Components? Storybook RSC support está experimental — pode exigir wrapper Client Component.
5. **Versão exata a pinar:** qual é a última estável de `storybook` + `@storybook/nextjs-vite` + `@storybook/addon-mcp` que funcionam juntas no momento da instalação? Anotar no `storybook-pattern.md` como "snapshot baseline".

## Anexos

- Padrões existentes em `OpenSea-APP/docs/patterns/` que viram referência: `component-ui-pattern.md`, `entity-list-layout-pattern.md`, `dashboard-layout-pattern.md`, `form-validation-pattern.md`, `page-layout-pattern.md`, `frontend-patterns.md`, `ux-rules.md`
- Plano de implementação detalhado: a ser criado em `OpenSea-APP/docs/superpowers/plans/2026-04-30-storybook-mcp-adoption-plan.md` via skill `writing-plans`
- **Revisão Codex aplicada em 2026-04-30:** spec passou por peer review do agente `codex:codex-rescue`. 6 findings aplicados (deploy → Fly.io, framework → `nextjs-vite`, test runner → `addon-vitest`, versão pinada, PostCSS sem duplicação, a11y gate bloqueante desde Fase 2).
