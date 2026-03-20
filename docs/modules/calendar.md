# Module: Calendar (Frontend)

## Overview

O módulo de Agenda é a interface centralizada de gestão de compromissos e eventos do OpenSea-APP. Ele oferece uma visão consolidada de todos os acontecimentos relevantes do sistema — reuniões manuais, ausências de RH, vencimentos financeiros, pedidos de compra e outros eventos gerados automaticamente — em um único calendário visual integrado ao `@fullcalendar/react`.

O módulo está organizado sob o route group `(dashboard)/(tools)/calendar` e não possui sub-rotas de detalhe — toda a interação acontece na página principal por meio de dialogs e sheets.

**Dependências com outros módulos:**

- `hr/` — Ausências aprovadas (`HR_ABSENCE`) e aniversários de funcionários (`HR_BIRTHDAY`) são sincronizados automaticamente via `CalendarSyncService`
- `finance/` — Lançamentos financeiros geram eventos de vencimento (`FINANCE_ENTRY`)
- `stock/` — Pedidos de compra geram eventos de acompanhamento (`STOCK_PO`)
- `rbac/` — Permissões RBAC controlam quais ações o usuário pode executar na agenda (criar, editar, excluir, convidar, exportar)
- `storage/` — Avatares de participantes são resolvidos via `storageFilesService.getServeUrl()`

---

## Route Structure

### Route Tree

```
/calendar     # Página principal da Agenda — calendário FullCalendar + dialogs/sheets
```

O módulo possui apenas uma rota. Toda a navegação ocorre na mesma página por meio de estado local e URL query params.

### URL State (Query Params)

| Param  | Tipo        | Descrição                                                                            |
| ------ | ----------- | ------------------------------------------------------------------------------------ |
| `view` | `string`    | Vista ativa: `timeGridWeek`, `timeGridDay` ou `listWeek` (omitido se `dayGridMonth`) |
| `type` | `EventType` | Filtro de tipo de evento ativo                                                       |
| `date` | ISO string  | Data inicial ao navegar diretamente para um período                                  |

### Layout Hierarchy

```
(dashboard)/layout.tsx          # Navbar principal + NavigationMenu
  └── (tools)/calendar/page.tsx # Página da Agenda (sem layout intermediário)
```

O route group `(tools)` não possui arquivo `layout.tsx` próprio; herda diretamente o layout do `(dashboard)`.

---

## Page Structure

### Component Tree

```
/calendar
  page.tsx                        # CalendarPage — orquestra estado, permissões e dialogs
    ├── PageActionBar              # Breadcrumb ("Agenda") + botões: "Exportar iCal", "Novo Evento"
    ├── Card (hero banner)         # Banner compacto com título, descrição e filtros
    │   ├── CalendarSelector       # Seletor multi-calendário (só exibido quando há > 1 calendário)
    │   └── EventFilters           # Linha de filtros: busca, tipo, toggle "Eventos do sistema"
    │       └── EventSearchCombobox  # Busca por nome de evento com debounce 300ms
    ├── Card (calendário)          # Container principal de altura flexível (flex-1)
    │   └── CalendarView           # FullCalendar com 4 visualizações e renderização customizada
    ├── EventCreateDialog          # Dialog de criação de evento
    │   └── CalendarEventForm      # Formulário compartilhado (estado gerenciado pelo parent)
    │       └── RecurrencePicker   # Editor visual de RRULE (frequência, intervalo, dias, contagem)
    ├── EventEditDialog            # Dialog de edição de evento
    │   └── CalendarEventForm      # Mesmo formulário reutilizado
    └── EventDetailSheet           # Sheet lateral com todos os detalhes do evento
        ├── EventTypeBadge         # Badge colorido com ícone do tipo
        ├── InviteShareDialog      # Dialog para convidar participantes ou compartilhar com equipe
        ├── VerifyActionPinModal   # Confirmação de exclusão de evento com PIN de ação
        └── VerifyActionPinModal   # Confirmação de remoção de participante com PIN de ação
```

A página é um componente `'use client'`. O estado de `CalendarPage` controla:

- Intervalo de datas carregado (sincronizado com a navegação do FullCalendar via `datesSet`)
- Vista atual (sincronizada com URL)
- Filtro de tipo de evento ativo (sincronizado com URL)
- Toggle de eventos do sistema
- IDs de calendários selecionados (multi-calendar)
- Abertura/fechamento de cada dialog ou sheet
- Evento selecionado atualmente

---

## Components

### CalendarView

- **Props:** `{ events: CalendarEvent[], onDateClick?, onEventClick?, onDatesSet?, currentView?, initialDate?, className? }` + `ref: CalendarViewRef`
- **Responsabilidade:** Encapsula o `FullCalendar` com os plugins `dayGridPlugin`, `timeGridPlugin`, `listPlugin` e `interactionPlugin`. Mapeia `CalendarEvent[]` para o formato `EventInput[]` do FullCalendar, aplica cores por `EVENT_TYPE_COLORS` e renderiza ícones de tipo no conteúdo do evento (`eventContent`). Expõe `CalendarViewRef.gotoDate(date)` via `useImperativeHandle` para navegação programática a partir da busca.
- **Usado em:** `page.tsx`

**Visualizações disponíveis:**

| Valor          | Label (PT-BR) | Descrição                                                |
| -------------- | ------------- | -------------------------------------------------------- |
| `dayGridMonth` | Mês           | Grade mensal com no máximo 3 eventos por dia ("+N mais") |
| `timeGridWeek` | Semana        | Grade de horas, 7 colunas                                |
| `timeGridDay`  | Dia           | Grade de horas, 1 coluna                                 |
| `listWeek`     | Agenda        | Lista cronológica da semana                              |

### CalendarEventForm

- **Props:** `{ state: CalendarEventFormState, actions: CalendarEventFormActions, popovers: PopoverStates, accentColor: string, idPrefix: string, calendarSlot?: ReactNode }`
- **Responsabilidade:** Formulário stateless compartilhado entre `EventCreateDialog` e `EventEditDialog`. Gerencia os campos: título, campos opcionais colapsáveis (descrição, local, fuso horário, recorrência), data/hora (modo normal e dia inteiro), tipo de evento, visibilidade, cor e seletor de calendário injetado via `calendarSlot`.
- **Usado em:** `EventCreateDialog`, `EventEditDialog`

### RecurrencePicker

- **Props:** `{ value: string | null, onChange: (rrule: string | null) => void, accentColor?: string, titleSlot?: ReactNode }`
- **Responsabilidade:** Editor visual de regras de recorrência RRULE. Suporta frequências `DAILY`, `WEEKLY`, `MONTHLY` e `YEARLY`; intervalo de 1 a 99; seleção de dias da semana (somente para `WEEKLY`); e limite de repetições (`COUNT`). O valor emitido segue o formato `RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE`.
- **Usado em:** `CalendarEventForm`

### EventTypeBadge

- **Props:** `{ type: EventType, className?: string }`
- **Responsabilidade:** Badge colorido que exibe o ícone e o label PT-BR do tipo de evento. A cor de fundo e borda é derivada de `EVENT_TYPE_COLORS[type]` com opacidade reduzida. Exporta também `EVENT_TYPE_ICONS` para uso em outros componentes.
- **Usado em:** `EventDetailSheet`, `EventFilters`, `CalendarView`

### EventFilters

- **Props:** `{ selectedType, onTypeChange, includeSystemEvents, onSystemEventsChange, onEventSelect? }`
- **Responsabilidade:** Linha de filtros do hero banner. Contém `EventSearchCombobox` (se `onEventSelect` fornecido), seletor de tipo de evento com ícones e switch "Eventos do sistema".
- **Usado em:** `page.tsx`

### EventSearchCombobox

- **Props:** `{ onEventSelect: (event: CalendarEvent) => void }`
- **Responsabilidade:** Campo de busca textual de eventos com debounce de 300ms. Chama `calendarEventsService.list()` diretamente com `search` param e janela de ±1 mês em torno da data atual. Ao selecionar um resultado, chama `onEventSelect` e o pai navega o calendário para a data do evento via `calendarViewRef.gotoDate()`.
- **Usado em:** `EventFilters`

### EventDetailSheet

- **Props:** `{ event, open, onOpenChange, onEdit?, canEdit, canDelete, canInvite, canRespond, canShare, canManageParticipants, canManageReminders, currentUserId, calendars }`
- **Responsabilidade:** Sheet lateral com todos os detalhes de um evento: tipo, visibilidade, recorrência, data/hora formatada em PT-BR, local, fuso horário com offset UTC, descrição, sistema RSVP (Aceitar/Recusar/Talvez), seletor de lembrete, lista de participantes (avatar group com até 8 + overflow, expandível para lista completa), link para a entidade de origem em eventos de sistema, nome do criador e botão de exclusão. A remoção de participante e a exclusão do evento exigem PIN de ação via `VerifyActionPinModal`.
- **Usado em:** `page.tsx`

### EventCreateDialog / EventEditDialog

- **Props (Create):** `{ open, onOpenChange, defaultDate?, calendars?, defaultCalendarId? }`
- **Props (Edit):** `{ event: CalendarEvent | null, open, onOpenChange }`
- **Responsabilidade:** Dialogs de criação e edição de evento. Ambos reutilizam `CalendarEventForm` com estado gerenciado localmente via `useState`. A cor de destaque do header e dos controles é `color || EVENT_TYPE_COLORS[type]`. O `EventCreateDialog` permite selecionar o calendário de destino via `calendarSlot` (popover com lista de calendários onde o usuário tem `access.canCreate`). O `EventEditDialog` exibe o calendário do evento de forma não editável.
- **Usado em:** `page.tsx`

### CalendarSelector

- **Props:** `{ calendars: Calendar[], selectedIds: string[], onSelectionChange: (ids: string[]) => void }`
- **Responsabilidade:** Popover de seleção/deseleção de calendários visíveis. Agrupa os calendários por tipo (Pessoal, Equipe — sub-agrupado por `ownerId`, Sistema) com checkboxes e indicadores de cor. Exibido no hero banner apenas quando o usuário tem mais de um calendário disponível.
- **Usado em:** `page.tsx`

### CalendarPicker

- **Props:** `{ calendars: Calendar[], value: string, onChange: (calendarId: string) => void }`
- **Responsabilidade:** Select agrupado de calendários para formulários externos (ex.: outras páginas que criam eventos programaticamente). Retorna `null` se houver apenas um calendário disponível.
- **Usado em:** componentes externos que precisam criar eventos

### CalendarBadge

- **Props:** `{ name: string, type: CalendarType, color?: string | null, className?: string }`
- **Responsabilidade:** Badge compacto que exibe o nome e o tipo do calendário (Pessoal, Time, Sistema) com ícone e cor correspondentes.
- **Usado em:** componentes externos que exibem referência a um calendário

### InviteShareDialog

- **Props:** `{ event: CalendarEvent, open, onOpenChange }`
- **Responsabilidade:** Dialog unificado para convidar participantes individuais ou compartilhar o evento com uma equipe inteira. Possui duas abas: "Usuários" (busca por nome/e-mail com ciclo de papel Convidado/Responsável) e "Equipes" (lista de equipes ativas do tenant). Filtra participantes já existentes. Chama `useInviteParticipants()` ou `useShareEventWithTeam()` conforme a aba ativa.
- **Usado em:** `EventDetailSheet`

### TeamCalendarPermissionsDialog

- **Props:** `{ calendar: Calendar | null, open, onOpenChange, userTeamRole?, teamColor? }`
- **Responsabilidade:** Dialog de configuração granular de permissões de um calendário de equipe. Exibe uma grade de permissões (Visualizar, Criar, Editar, Excluir, Compartilhar, Gerenciar) para cada papel (Proprietário, Administrador, Membro). Papéis iguais ou superiores ao papel do usuário atual ficam bloqueados.
- **Usado em:** páginas de gestão de equipes (fora do módulo de calendar diretamente)

---

## Hooks

Todos os hooks de calendar estão em `src/hooks/calendar/` com barrel re-export via `src/hooks/calendar/index.ts`.

### Hooks de Eventos

| Hook                        | Query Key                     | Endpoint                                              | Notas                                                                                                         |
| --------------------------- | ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `useCalendarEvents(params)` | `['calendar-events', params]` | `GET /v1/calendar/events`                             | `enabled` requer `startDate` e `endDate`; `keepPreviousData`; `staleTime` 60s                                 |
| `useCalendarEvent(id)`      | `['calendar-events', id]`     | `GET /v1/calendar/events/:id`                         | `enabled` quando `id` presente; `staleTime` 30s — usado para dados ao vivo do evento selecionado              |
| `useCreateCalendarEvent()`  | —                             | `POST /v1/calendar/events`                            | Atualização otimista: insere evento temporário na lista; rollback em erro; `invalidateQueries` em `onSettled` |
| `useUpdateCalendarEvent()`  | —                             | `PATCH /v1/calendar/events/:id`                       | Atualização otimista: atualiza evento na lista sem `onSettled`/`invalidateQueries` (ver padrão otimista)      |
| `useDeleteCalendarEvent()`  | —                             | `DELETE /v1/calendar/events/:id`                      | Atualização otimista: remove evento da lista; rollback em erro                                                |
| `useInviteParticipants()`   | —                             | `POST /v1/calendar/events/:id/participants`           | Atualização otimista do evento individual; invalida lista e evento em `onSettled`                             |
| `useRespondToEvent()`       | —                             | `PATCH /v1/calendar/events/:id/respond`               | Atualização otimista do status do participante; invalida lista e evento                                       |
| `useRemoveParticipant()`    | —                             | `DELETE /v1/calendar/events/:id/participants/:userId` | Atualização otimista; invalida lista e evento                                                                 |
| `useManageReminders()`      | —                             | `PUT /v1/calendar/events/:id/reminders`               | Atualização otimista dos lembretes; invalida lista e evento                                                   |
| `useShareEventWithUsers()`  | —                             | `POST /v1/calendar/events/:id/share-users`            | Sem otimismo; invalida lista e evento em `onSettled`                                                          |
| `useShareEventWithTeam()`   | —                             | `POST /v1/calendar/events/:id/share-team`             | Sem otimismo; invalida lista e evento em `onSettled`                                                          |
| `useUnshareUser()`          | —                             | `DELETE /v1/calendar/events/:id/share-users/:userId`  | Invalida lista e evento                                                                                       |

### Hooks de Calendários

| Hook                                 | Query Key          | Endpoint                                            | Notas                                                                                      |
| ------------------------------------ | ------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `useMyCalendars()`                   | `['my-calendars']` | `GET /v1/calendar/calendars`                        | `staleTime` 300s (5 min); retorna calendários pessoais, de equipes e de sistema do usuário |
| `useCreateTeamCalendar()`            | —                  | `POST /v1/calendar/calendars/team`                  | Invalida `['my-calendars']`                                                                |
| `useUpdateCalendar()`                | —                  | `PATCH /v1/calendar/calendars/:id`                  | Invalida `['my-calendars']`                                                                |
| `useDeleteCalendar()`                | —                  | `DELETE /v1/calendar/calendars/:id`                 | Invalida `['my-calendars']`                                                                |
| `useUpdateTeamCalendarPermissions()` | —                  | `PATCH /v1/calendar/calendars/:id/team-permissions` | Invalida `['my-calendars']`                                                                |

---

## Types

Todos os tipos de calendar estão em `src/types/calendar/` com barrel re-export via `src/types/calendar/index.ts`.

### event.types.ts

| Interface/Type            | Descrição                                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EventType`               | Union: `MEETING`, `TASK`, `REMINDER`, `DEADLINE`, `HOLIDAY`, `BIRTHDAY`, `VACATION`, `ABSENCE`, `FINANCE_DUE`, `PURCHASE_ORDER`, `CUSTOM`                                    |
| `EventVisibility`         | `PUBLIC` \| `PRIVATE`                                                                                                                                                        |
| `ParticipantRole`         | `OWNER` \| `ASSIGNEE` \| `GUEST`                                                                                                                                             |
| `ParticipantStatus`       | `PENDING` \| `ACCEPTED` \| `DECLINED` \| `TENTATIVE`                                                                                                                         |
| `EventParticipant`        | Participante de evento com `userName`, `userEmail`, `userAvatarUrl`, `role` e `status`                                                                                       |
| `EventReminder`           | Lembrete por usuário: `minutesBefore`, `isSent`, `sentAt`                                                                                                                    |
| `CalendarEvent`           | Evento completo com `rrule`, `timezone`, `systemSourceType`, `systemSourceId`, `occurrenceDate` (para recorrências expandidas), `isRecurring`, `participants?`, `reminders?` |
| `CreateCalendarEventData` | Dados de criação; todos opcionais exceto `title`, `startDate`, `endDate`                                                                                                     |
| `UpdateCalendarEventData` | Atualização parcial de todos os campos editáveis                                                                                                                             |
| `CalendarEventsQuery`     | Filtros de listagem: `startDate`, `endDate`, `type?`, `search?`, `includeSystemEvents?`, `calendarIds?` (CSV), paginação                                                     |
| `InviteParticipantsData`  | `{ participants: { userId, role? }[] }`                                                                                                                                      |
| `RespondToEventData`      | `{ status: 'ACCEPTED' \| 'DECLINED' \| 'TENTATIVE' }`                                                                                                                        |
| `ManageRemindersData`     | `{ reminders: { minutesBefore }[] }` — lista completa que substitui lembretes existentes                                                                                     |
| `SystemSourceType`        | `HR_ABSENCE` \| `HR_BIRTHDAY` \| `FINANCE_ENTRY` \| `STOCK_PO`                                                                                                               |
| `EVENT_TYPE_COLORS`       | Mapa de cor hexadecimal por `EventType` (ex.: `MEETING: '#3b82f6'`, `DEADLINE: '#ef4444'`)                                                                                   |
| `REMINDER_PRESETS`        | Constante com 6 presets: 5, 10, 15, 30 min; 1h; 1 dia                                                                                                                        |
| `SYSTEM_SOURCE_ROUTES`    | Mapa de função `(id) => path` por `SystemSourceType` para navegação ao recurso de origem                                                                                     |
| `SYSTEM_SOURCE_LABELS`    | Labels PT-BR por `SystemSourceType`                                                                                                                                          |

### calendar.types.ts

| Interface/Type            | Descrição                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CalendarType`            | `PERSONAL` \| `TEAM` \| `SYSTEM`                                                                                                                   |
| `CalendarAccess`          | Objeto de permissões de acesso para o usuário atual: `canRead`, `canCreate`, `canEdit`, `canDelete`, `canShare`, `canManage`                       |
| `Calendar`                | Calendário com tipo, cor, dono (`ownerId`, `ownerName`, `ownerColor`), módulo de sistema (`systemModule`) e objeto `access` calculado pelo backend |
| `CreateTeamCalendarData`  | `{ teamId, name, description?, color? }`                                                                                                           |
| `UpdateCalendarData`      | `{ name?, description?, color? }`                                                                                                                  |
| `TeamCalendarPermissions` | 18 campos booleanos: `ownerCan*`, `adminCan*`, `memberCan*` — cada papel × 6 permissões                                                            |

### Sincronização com Backend

| Arquivo             | Backend Schema             | Sincronizado? |
| ------------------- | -------------------------- | ------------- |
| `event.types.ts`    | `calendar-event.schema.ts` | Sim           |
| `calendar.types.ts` | `calendar.schema.ts`       | Sim           |

Observação: datas são sempre `string` (ISO 8601). O campo `occurrenceDate` é preenchido pelo backend para ocorrências expandidas de eventos recorrentes.

---

## Services

O módulo se comunica com o backend exclusivamente via services em `src/services/calendar/`.

| Service                 | Arquivo                      | Base Path                |
| ----------------------- | ---------------------------- | ------------------------ |
| `calendarEventsService` | `calendar-events.service.ts` | `/v1/calendar/events`    |
| `calendarsService`      | `calendars.service.ts`       | `/v1/calendar/calendars` |

Ambos utilizam `apiClient` de `src/lib/api-client.ts`, que injeta automaticamente o JWT de tenant em cada requisição.

A função `calendarEventsService.getExportUrl()` não faz requisição — apenas constrói a URL para o download direto via `fetch` nativo com o token de autenticação injetado manualmente.

---

## Permissions

| Código                          | Descrição                        | Usado em                                           |
| ------------------------------- | -------------------------------- | -------------------------------------------------- |
| `calendar.events.list`          | Listar eventos                   | `ProtectedRoute` da página                         |
| `calendar.events.create`        | Criar evento                     | Botão "Novo Evento" e clique em data               |
| `calendar.events.update`        | Editar evento                    | Botão de edição no `EventDetailSheet`              |
| `calendar.events.delete`        | Excluir evento                   | Botão de exclusão no `EventDetailSheet`            |
| `calendar.events.manage`        | Gerenciar todos os eventos       | Ações administrativas                              |
| `calendar.events.share-users`   | Compartilhar evento com usuários | `InviteShareDialog` (aba Usuários)                 |
| `calendar.events.share-teams`   | Compartilhar evento com equipes  | `InviteShareDialog` (aba Equipes)                  |
| `calendar.events.export`        | Exportar agenda como iCal        | Botão "Exportar iCal"                              |
| `calendar.participants.invite`  | Convidar participantes           | Botão "Convidar" no `EventDetailSheet`             |
| `calendar.participants.respond` | Responder a convite (RSVP)       | Seção RSVP no `EventDetailSheet`                   |
| `calendar.participants.manage`  | Remover participantes            | Botão de remoção no `EventDetailSheet`             |
| `calendar.reminders.create`     | Configurar lembretes             | Seletor de lembrete no `EventDetailSheet`          |
| `calendar.reminders.delete`     | Remover lembretes                | Seletor de lembrete (ao selecionar "Sem lembrete") |
| `ui.menu.calendar`              | Exibir item "Agenda" no menu     | Menu de navegação                                  |

---

## State Management

- **Contextos:** Nenhum contexto específico do módulo de calendar. Utiliza `AuthContext` para `user.id` (verificação de propriedade de evento) e `TenantContext` implicitamente via `apiClient`.
- **URL State:** `?view=`, `?type=`, `?date=` — sincronizados bidiretcionalmente com `useSearchParams` + `router.replace()` sem scroll.
- **React Query Keys:**
  - `['calendar-events', params]` — lista de eventos por intervalo de datas e filtros
  - `['calendar-events', id]` — evento individual (dados ao vivo para o sheet aberto)
  - `['my-calendars']` — lista de calendários do usuário
- **useState local:** `CalendarPage` gerencia: `dateRange`, `currentView`, `selectedType`, `includeSystemEvents`, `selectedCalendarIds`, estado dos dialogs (`createDialogOpen`, `editDialogOpen`, `detailSheetOpen`), `selectedEvent` e `defaultCreateDate`.

**Padrão de atualização otimista:** `useCreateCalendarEvent`, `useUpdateCalendarEvent` e `useDeleteCalendarEvent` implementam `onMutate` com rollback em `onError`. Por seguir o padrão documentado em `optimistic-update-dnd-pattern.md`, `useUpdateCalendarEvent` não chama `invalidateQueries` em `onSettled` para evitar snap-back.

---

## FullCalendar Integration

O módulo utiliza `@fullcalendar/react` com os seguintes pacotes:

| Pacote                      | Plugins             | Finalidade                    |
| --------------------------- | ------------------- | ----------------------------- |
| `@fullcalendar/daygrid`     | `dayGridPlugin`     | Vista mensal                  |
| `@fullcalendar/timegrid`    | `timeGridPlugin`    | Vistas de semana e dia        |
| `@fullcalendar/list`        | `listPlugin`        | Vista de agenda               |
| `@fullcalendar/interaction` | `interactionPlugin` | Clique em datas, `selectable` |

**Configuração relevante:**

- `locale="pt-br"` — labels e datas em português
- `editable={false}` — drag-and-drop desabilitado
- `dayMaxEvents={3}` — máximo de 3 eventos visíveis por célula na vista mensal
- `eventContent` — renderização customizada com ícone por tipo e horário formatado na vista mensal
- `height="100%"` — o calendário preenche toda a altura do Card pai

**Mapeamento de eventos:**

```typescript
// mapToFullCalendarEvents()
{
  id: event.id + (event.occurrenceDate ?? ''),  // único por ocorrência de recorrência
  start: event.occurrenceDate ?? event.startDate,  // data expandida para recorrências
  backgroundColor: event.color ?? EVENT_TYPE_COLORS[event.type],
  extendedProps: { calendarEvent: event },  // payload completo para o handler de clique
}
```

---

## User Flows

### Flow 1: Criar um Evento

1. Usuário acessa `/calendar`
2. Sistema carrega eventos do mês atual via `useCalendarEvents(dateRange)`
3. Usuário clica em "Novo Evento" ou clica em uma data na grade
4. `EventCreateDialog` abre com data padrão pré-preenchida e formulário em branco
5. Usuário preenche título, data/hora e opcionalmente tipo, local, descrição, recorrência e calendário
6. Submit chama `useCreateCalendarEvent().mutateAsync()`
7. Atualização otimista insere o evento temporário na lista imediatamente
8. Toast de sucesso; backend confirma e a lista é invalidada para buscar o ID real

### Flow 2: Visualizar e Responder a um Convite

1. Usuário vê um evento colorido na grade (cor de `EVENT_TYPE_COLORS[type]`)
2. Clica no evento — `handleEventClick()` define `selectedEvent` e abre `EventDetailSheet`
3. Sheet exibe detalhes: tipo, datas, local, fuso horário, participantes com avatares e rings coloridos
4. Se o usuário é participante mas não é o criador, exibe seção RSVP com botões Aceitar/Recusar/Talvez
5. Clique em "Aceitar" chama `useRespondToEvent().mutateAsync()` com `status: 'ACCEPTED'`
6. Atualização otimista altera o status do participante no cache do evento individual
7. Toast de sucesso

### Flow 3: Buscar e Navegar até um Evento

1. Usuário clica no campo "Buscar eventos..." na barra de filtros
2. `EventSearchCombobox` abre popover com campo de busca
3. Após digitar 2+ caracteres (debounce 300ms), `calendarEventsService.list()` é chamado com `search` param
4. Resultados exibem ícone por tipo, título, data formatada e cor
5. Usuário seleciona um evento — `handleSearchSelect()` é chamado
6. `calendarViewRef.current.gotoDate(eventDate)` navega o calendário para a data
7. `EventDetailSheet` abre automaticamente com o evento selecionado

### Flow 4: Exportar Agenda como iCal

1. Usuário clica em "Exportar iCal" (visível somente com permissão `calendar.events.export`)
2. `handleExport()` constrói a URL via `calendarEventsService.getExportUrl()` com os filtros ativos
3. `fetch()` com `Authorization: Bearer <token>` baixa o arquivo
4. `URL.createObjectURL(blob)` + `<a download="opensea-agenda.ics">` dispara o download
5. Toast de sucesso "Agenda exportada com sucesso"

### Flow 5: Convidar Participantes e Compartilhar com Equipe

1. Usuário abre um evento no `EventDetailSheet`
2. Na seção de Participantes, clica em "Convidar" (visível para o proprietário com permissão `calendar.participants.invite`)
3. `InviteShareDialog` abre com duas abas: Usuários e Equipes
4. Na aba Usuários: busca por nome/e-mail, clica para selecionar, cicla papel (Convidado/Responsável)
5. Clique em "Convidar (N)" chama `useInviteParticipants().mutateAsync()`
6. Atualização otimista adiciona participantes temporários ao cache do evento
7. Na aba Equipes: seleciona uma equipe e clica "Compartilhar com equipe" — chama `useShareEventWithTeam()`
8. Toast de sucesso com contagem de participantes adicionados

### Flow 6: Filtrar por Multi-Calendário

1. Usuário com mais de um calendário vê botão "Calendários (N/M)" no hero banner
2. `CalendarSelector` abre popover com checkboxes agrupados (Pessoal, Equipes por grupo, Sistema)
3. Ao desmarcar um calendário, `selectedCalendarIds` é atualizado
4. `useCalendarEvents()` é re-executado com `calendarIds` como CSV dos IDs selecionados
5. FullCalendar exibe somente os eventos dos calendários selecionados

---

## Audit History

| Data       | Dimensão             | Score | Relatório                                                      |
| ---------- | -------------------- | ----- | -------------------------------------------------------------- |
| 2026-03-10 | Documentação inicial | —     | Criação da documentação completa do módulo calendar (frontend) |
