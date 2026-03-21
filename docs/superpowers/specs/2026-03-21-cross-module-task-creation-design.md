# Cross-Module Task Creation Hooks

**Data:** 2026-03-21
**Escopo:** Sistema reutilizável para criar tasks a partir de qualquer módulo do OpenSea
**Fase:** 1 (criação manual) — Fase 2 (automações + badge reverso) projetada mas não implementada

---

## 1. Visão Geral

Hook + componente reutilizável que permite a qualquer módulo do OpenSea criar task cards vinculadas à entidade de origem. Usa `systemSourceType`/`systemSourceId` no Card para rastreabilidade.

### Fluxo

```
Módulo (Email, Stock, Finance, HR, Sales, Calendar)
  └── useCreateTaskFromEntity({ sourceType, sourceId, sourceLabel, suggestedTitle })
        └── CreateTaskQuickModal (select board + coluna + título)
              ├── Criar rápido → createCard + createIntegration
              └── Expandir → CardModal completo (pré-preenchido)
```

---

## 2. Hook: `useCreateTaskFromEntity`

### Interface

```typescript
interface CreateTaskFromEntityOptions {
  sourceType: IntegrationType;   // 'CUSTOMER' | 'PRODUCT' | 'EMAIL' | 'FINANCE_ENTRY' | 'DEPARTMENT' | 'CALENDAR_EVENT'
  sourceId: string;              // ID da entidade de origem
  sourceLabel: string;           // Label para exibição (nome, assunto, etc.)
  suggestedTitle?: string;       // Título pré-preenchido para o card
}

interface UseCreateTaskFromEntityReturn {
  openQuickCreate: (options: CreateTaskFromEntityOptions) => void;
  QuickCreateModal: React.FC;    // Componente modal para renderizar no JSX
}
```

### Uso

```tsx
function EmailToolbar({ message }) {
  const { openQuickCreate, QuickCreateModal } = useCreateTaskFromEntity();

  return (
    <>
      <Button onClick={() => openQuickCreate({
        sourceType: 'EMAIL',
        sourceId: message.id,
        sourceLabel: message.subject,
        suggestedTitle: message.subject,
      })}>
        Criar Tarefa
      </Button>
      <QuickCreateModal />
    </>
  );
}
```

### Localização

- Hook: `OpenSea-APP/src/hooks/tasks/use-create-task-from-entity.ts`
- Pode ser importado por qualquer módulo: `import { useCreateTaskFromEntity } from '@/hooks/tasks/use-create-task-from-entity'`

### Dependências

- `useBoards()` — listar boards do usuário
- `useCreateCard()` — criar o card
- `useCreateIntegration()` — vincular a integração
- `hasPermission(TOOLS.TASKS.CARDS.REGISTER)` — gating

---

## 3. Componente: `CreateTaskQuickModal`

### Localização

`OpenSea-APP/src/components/tasks/cards/create-task-quick-modal.tsx`

### Layout

```
┌─────────────────────────────────────┐
│  Criar Tarefa                    ✕  │
│                                     │
│  [📧 Re: Orçamento atualizado]     │  ← chip da entidade de origem
│                                     │
│  Quadro *                           │
│  [▾ Selecionar quadro...]          │
│                                     │
│  Coluna *                           │
│  [▾ Selecionar coluna...]          │
│                                     │
│  Título *                           │
│  [Re: Orçamento atualizado____]    │  ← pré-preenchido
│                                     │
│         [Expandir]  [Criar Tarefa]  │
│└────────────────────────────────────┘
```

### Campos

1. **Chip de origem** — ícone + label da entidade (não editável, visual)
2. **Quadro** — Select dropdown com boards do usuário. Busca via `useBoards()`. Obrigatório.
3. **Coluna** — Select dropdown com colunas do board selecionado. Default: primeira coluna. Obrigatório.
4. **Título** — Input text, pré-preenchido com `suggestedTitle`. Obrigatório.

### Botões

- **Expandir** — Fecha o quick modal. Abre o `CardModal` completo em modo criação com:
  - `defaultColumnId` da coluna selecionada
  - Título já preenchido
  - Integração com a entidade de origem já vinculada
  - `systemSourceType`/`systemSourceId` preenchidos
- **Criar Tarefa** — Cria o card via API, depois cria a integração. Toast de sucesso. Fecha modal.

### Dimensões

- `max-w-[420px]` — compacto
- Cores do StepWizard (`bg-slate-50 dark:bg-white/5` no header)

---

## 4. Backend: Schema Updates

### Adicionar ao `createCardSchema` (Zod)

```typescript
// Em src/http/schemas/tasks/card.schema.ts
systemSourceType: z.string().max(50).optional(),
systemSourceId: z.string().uuid().optional(),
```

### Adicionar ao `CreateCardRequest` (Frontend types)

```typescript
// Em src/types/tasks/card.types.ts
systemSourceType?: string;
systemSourceId?: string;
```

### Fluxo de criação

1. Frontend chama `createCard({ title, columnId, systemSourceType, systemSourceId, ... })`
2. Backend cria o card com source tracking
3. Frontend chama `createIntegration({ type: sourceType, entityId: sourceId, entityLabel: sourceLabel })`
4. Card fica vinculado à entidade de origem por 2 caminhos:
   - `Card.systemSourceType`/`systemSourceId` — tracking direto no card
   - `CardIntegration` — vinculação visível na UI

---

## 5. Pontos de Integração por Módulo

### Mapeamento

| Módulo | Onde aparece | `sourceType` | `suggestedTitle` | Dados extras |
|--------|-------------|-------------|-----------------|-------------|
| Email | Toolbar da mensagem | `EMAIL` | `msg.subject` | — |
| Stock/Produtos | Context menu (EntityContextMenu) | `PRODUCT` | `"Tarefa: {product.name}"` | — |
| Finance/Entradas | Context menu da entrada | `FINANCE_ENTRY` | `entry.description` | — |
| HR/Funcionários | Context menu do funcionário | `DEPARTMENT` | `"Tarefa: {employee.name}"` | — |
| Sales/Clientes | Context menu do cliente | `CUSTOMER` | `"Tarefa: {customer.name}"` | — |
| Calendar/Eventos | Menu de ações do evento | `CALENDAR_EVENT` | `event.title` | — |

### Gating

O item "Criar Tarefa" só aparece se:
```typescript
const { hasPermission } = usePermissions();
const canCreateTask = hasPermission('tools.tasks.cards.register');
```

### Padrão de integração no context menu

```typescript
// Em qualquer módulo
actions={[
  ...(canCreateTask ? [{
    id: 'create-task',
    label: 'Criar Tarefa',
    icon: ListChecks,
    onClick: () => openQuickCreate({
      sourceType: 'PRODUCT',
      sourceId: product.id,
      sourceLabel: product.name,
      suggestedTitle: `Tarefa: ${product.name}`,
    }),
  }] : []),
]}
```

---

## 6. Fase 2 — Automações (projetado, não implementado)

### Model: `TaskAutomationRule`

```prisma
model TaskAutomationRule {
  id          String   @id @default(uuid())
  tenantId    String
  boardId     String
  columnId    String?
  eventType   String   // 'FINANCE_ENTRY_OVERDUE', 'EMAIL_RECEIVED_FLAGGED', etc.
  conditions  Json?    // filtros opcionais (ex: { type: 'PAYABLE', isOverdue: true })
  titleTemplate String // "Cobrança: {{entry.description}}"
  priority    CardPriority @default(NONE)
  assigneeId  String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  board  Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId, eventType])
  @@map("task_automation_rules")
}
```

### Domain Events planejados

| Evento | Módulo | Trigger |
|--------|--------|---------|
| `EMAIL_RECEIVED_FLAGGED` | Email | Email importante recebido |
| `FINANCE_ENTRY_OVERDUE` | Finance | Entrada vencida |
| `STOCK_PO_CREATED` | Stock | Pedido de compra criado |
| `SALES_ORDER_CREATED` | Sales | Pedido de venda criado |
| `HR_ABSENCE_APPROVED` | HR | Ausência aprovada |

### Subscriber

```typescript
// domain-event-subscribers.ts
DomainEvents.subscribe('FINANCE_ENTRY_OVERDUE', async (event) => {
  const rules = await taskAutomationRulesRepo.findByEvent(event.tenantId, 'FINANCE_ENTRY_OVERDUE');
  for (const rule of rules) {
    if (matchesConditions(rule.conditions, event.data)) {
      await createCardUseCase.execute({
        boardId: rule.boardId,
        columnId: rule.columnId,
        title: renderTemplate(rule.titleTemplate, event.data),
        priority: rule.priority,
        assigneeId: rule.assigneeId,
        systemSourceType: 'FINANCE_ENTRY',
        systemSourceId: event.data.entryId,
      });
    }
  }
});
```

### UI de configuração

Tab "Automações" no Board Settings (StepWizard):
- Step 1: Selecionar evento trigger
- Step 2: Configurar condições (filtros)
- Step 3: Definir card template (título, prioridade, coluna, responsável)

---

## 7. Fase 2 — Badge Reverso (projetado, não implementado)

### Endpoint

```
GET /v1/tasks/cards/by-source?type=EMAIL&sourceId=xxx
```

Retorna: `{ card: { id, title, boardId, status } | null }`

### Componente

```typescript
// src/components/tasks/shared/task-link-badge.tsx
interface TaskLinkBadgeProps {
  sourceType: IntegrationType;
  sourceId: string;
}
```

Badge compacto mostrando ícone de task + status. Clicável — abre o card no modal.

Usado nos módulos de origem:
```tsx
<TaskLinkBadge sourceType="EMAIL" sourceId={message.id} />
```

---

## 8. Permissões

Usa permissões existentes:
- `tools.tasks.cards.register` — criar card (gating do botão "Criar Tarefa")
- `tools.tasks.boards.access` — listar boards (select no quick modal)

Não requer permissões novas.

---

## 9. Componentes e Arquivos

### Fase 1 (implementar agora)

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `OpenSea-APP/src/hooks/tasks/use-create-task-from-entity.ts` | Hook | Hook reutilizável |
| `OpenSea-APP/src/components/tasks/cards/create-task-quick-modal.tsx` | Componente | Modal rápido de criação |
| `OpenSea-API/src/http/schemas/tasks/card.schema.ts` | Schema | Adicionar systemSource ao create |
| `OpenSea-APP/src/types/tasks/card.types.ts` | Tipos | Adicionar systemSource ao CreateCardRequest |
| Módulos diversos | Modificação | Adicionar "Criar Tarefa" nos context menus/toolbars |

### Fase 2 (projetado, implementar depois)

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `OpenSea-API/prisma/schema.prisma` | Schema | Model TaskAutomationRule |
| `OpenSea-API/src/lib/domain-event-subscribers.ts` | Subscriber | Handler para criar tasks automaticamente |
| `OpenSea-APP/src/components/tasks/shared/task-link-badge.tsx` | Componente | Badge reverso nos módulos de origem |
| `OpenSea-API/src/http/controllers/tasks/cards/v1-get-card-by-source.controller.ts` | Controller | Endpoint by-source |
