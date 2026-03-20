# Permission Wizard Redesign

## Overview

Redesign the permission management UI from a collapsible tree (current `ManagePermissionsModal`) to a **modal with vertical module tabs + checkbox matrix** (Option C). Simultaneously restructure all permission codes to be cleaner, reducing from ~721 to ~242 permissions across 7 tabs.

## Goals

1. Replace the current tree-based permission modal with a matrix-style UI
2. Standardize permissions around 8 actions: Criar, Editar, Excluir, Exportar, Gerenciar, Importar, Listar, Ver
3. Consolidate sub-resources into parent resources (e.g., bins/zones → warehouses)
4. Add select-all controls for both rows (→) and columns (⬇)
5. Reorganize modules into 7 logical tabs matching the application navigation

## UI Design — Option C: Modal with Vertical Module Tabs

### Modal Structure

- **Size**: `max-w-6xl` (wider than current `max-w-5xl`), `h-[85vh]` (same as current)
- **Layout**: Left sidebar (module tabs, ~160px) + Right area (matrix content)
- **Colors**: Follow existing design system (slate bg, border-border, blue-500 checkboxes)

### Left Sidebar — Module Tabs (7 tabs, ordered)

Each tab displays:

- Module icon (emoji or Lucide icon)
- Module name in PT-BR
- Permission count badge (e.g., "47" selected)

Tabs in fixed order:

1. 📦 Estoque (9 resources, 51 perms)
2. 💰 Financeiro (9 resources, 52 perms)
3. 👥 Recursos Humanos (8 resources, 43 perms)
4. 🛒 Vendas (3 resources, 19 perms)
5. 🏢 Administração (5 resources, 21 perms) — Empresas, RBAC, Auditoria, Sessões
6. 🔧 Ferramentas (7 resources, 38 perms) — Agenda, Armazenamento, Email, Tarefas
7. ⚙️ Sistema (3 resources, 10 perms) — Etiquetas, Notificações, Permissões Pessoais

Active tab: `bg-blue-500/15 border border-blue-500/30 rounded-md`
Inactive tab: `opacity-50`

### Right Area — Permission Matrix

#### Header

- Module name + subtitle "X de Y permissões ativas neste módulo"
- "Selecionar tudo" and "Limpar tudo" buttons (top right)

#### Column Name → Permission Code Action Mapping

| Display (PT-BR) | Code Action |
| --------------- | ----------- |
| Criar           | `create`    |
| Editar          | `update`    |
| Excluir         | `delete`    |
| Exportar        | `export`    |
| Gerenciar       | `manage`    |
| Importar        | `import`    |
| Listar          | `list`      |
| Ver             | `read`      |

#### Matrix Table

- **Sticky header row** with column names + select-all column icon (⬇) below each name
- **8 columns** (alphabetical): Criar, Editar, Excluir, Exportar, Gerenciar, Importar, Listar, Ver
- **Rows**: Resources in alphabetical order, each with:
  - Select-all row icon (→) at left of resource name
  - Subtitle text for consolidated resources (e.g., "zonas, bins, endereços, etiquetas")
  - Checkboxes for each applicable action
  - N/A state (grayed out, not clickable) for inapplicable actions

#### Checkbox States

- **Checked**: `bg-blue-500 rounded text-white` with ✓
- **Unchecked**: `border-1.5 border-muted rounded`
- **N/A**: `border-1.5 border-muted rounded opacity-20` (not interactive)
- **Gerenciar (special)**: `bg-amber-500 rounded text-white` with ✓ (amber to indicate it covers domain-specific operations)

#### Select-All Behavior

- **Column (⬇)**: Toggles all checkboxes in that column for applicable resources only (skips N/A cells)
- **Row (→)**: Toggles all checkboxes in that row for applicable actions only (skips N/A cells)
- Icon states: Active (has selections) = `bg-blue-500/70 text-white`, Inactive = `bg-muted/10 text-muted`
- Toggle behavior: If any unchecked → check all. If all checked → uncheck all.

### Modal Header

- Title: "Gerenciar Permissões — {Group Name}"
- Subtitle: "X de Y permissões selecionadas" (global count)
- Close button (X)

### Modal Footer

- Left: Hint text "Dica: Clique no ícone → para selecionar toda a linha, ou ⬇ para toda a coluna"
- Right: "Cancelar" (outline) + "Salvar Permissões" (primary blue)

---

## Complete Permission Structure — All Modules

### Tab 1: 📦 Estoque (9 resources, 51 permissions)

| #   | Resource         | Code                    | Subtitle                              | Criar | Editar | Excluir | Exportar | Gerenciar | Importar | Listar | Ver |
| --- | ---------------- | ----------------------- | ------------------------------------- | :---: | :----: | :-----: | :------: | :-------: | :------: | :----: | :-: |
| 1   | Armazéns         | `stock.warehouses`      | zonas, bins, endereços, etiquetas     |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 2   | Categorias       | `stock.categories`      | —                                     |   ✓   |   ✓    |    ✓    |    ✓     |     —     |    ✓     |   ✓    |  ✓  |
| 3   | Fabricantes      | `stock.manufacturers`   | —                                     |   ✓   |   ✓    |    ✓    |    ✓     |     —     |    ✓     |   ✓    |  ✓  |
| 4   | Itens            | `stock.items`           | movimentações, localização            |   —   |   —    |    —    |    ✓     |     ✓     |    —     |   ✓    |  ✓  |
| 5   | Ordens de Compra | `stock.purchase-orders` | gerenciar: aprovar, cancelar          |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    —     |   ✓    |  ✓  |
| 6   | Produtos         | `stock.products`        | attachments, instruções de cuidado    |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    ✓     |   ✓    |  ✓  |
| 7   | Templates        | `stock.templates`       | —                                     |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 8   | Variantes        | `stock.variants`        | attachments                           |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    ✓     |   ✓    |  ✓  |
| 9   | Volumes          | `stock.volumes`         | gerenciar: fechar, entregar, romaneio |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    —     |   ✓    |  ✓  |

**"Gerenciar" scope:**

- Armazéns: Criar/editar/excluir zonas, configurar bins, bloquear/desbloquear, gerar etiquetas
- Itens: Registrar entrada/saída, transferir, transferência em lote
- Ordens de Compra: Aprovar, cancelar
- Produtos: Importação em massa, gerenciar attachments e instruções de cuidado
- Variantes: Importação em massa, gerenciar attachments
- Volumes: Fechar, reabrir, entregar, devolver, adicionar/remover itens, romaneio

**Consolidations:**

- `stock.zones.*`, `stock.bins.*`, `stock.locations.*` → `stock.warehouses.manage`
- `stock.product-attachments.*`, `stock.product-care-instructions.*` → `stock.products.manage`
- `stock.variant-attachments.*` → `stock.variants.manage`
- `stock.movements.list/read` → `stock.items.list`
- `stock.items.entry/exit/transfer` → `stock.items.manage`
- `stock.care.*` → `stock.products.read`
- `stock.tags.*` → Removed (not needed)
- `stock.suppliers.*` → Moved to Finance

### Tab 2: 💰 Financeiro (9 resources, 52 permissions)

| #   | Resource         | Code                    | Subtitle                                | Criar | Editar | Excluir | Exportar | Gerenciar | Importar | Listar | Ver |
| --- | ---------------- | ----------------------- | --------------------------------------- | :---: | :----: | :-----: | :------: | :-------: | :------: | :----: | :-: |
| 1   | Categorias       | `finance.categories`    | —                                       |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 2   | Centros de Custo | `finance.cost-centers`  | —                                       |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 3   | Consórcios       | `finance.consortia`     | gerenciar: pagar, contemplar            |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    —     |   ✓    |  ✓  |
| 4   | Contas Bancárias | `finance.bank-accounts` | —                                       |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 5   | Contratos        | `finance.contracts`     | —                                       |   ✓   |   ✓    |    ✓    |    ✓     |     —     |    —     |   ✓    |  ✓  |
| 6   | Empréstimos      | `finance.loans`         | gerenciar: pagar parcela                |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    —     |   ✓    |  ✓  |
| 7   | Fornecedores     | `finance.suppliers`     | vindo do módulo de estoque              |   ✓   |   ✓    |    ✓    |    ✓     |     —     |    ✓     |   ✓    |  ✓  |
| 8   | Lançamentos      | `finance.entries`       | gerenciar: pagar, cancelar, attachments |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    ✓     |   ✓    |  ✓  |
| 9   | Recorrências     | `finance.recurring`     | gerenciar: pausar, retomar, cancelar    |   ✓   |   ✓    |    —    |    —     |     ✓     |    —     |   ✓    |  ✓  |

**"Gerenciar" scope:**

- Consórcios: Pagar parcela, marcar como contemplado
- Empréstimos: Pagar parcela
- Lançamentos: Pagar, cancelar, gerenciar attachments
- Recorrências: Pausar, retomar, cancelar

**Consolidations:**

- `finance.attachments.*` → `finance.entries.manage`
- `finance.companies.read` → `finance.entries.read` (company context comes from entries)
- `finance.dashboard.view` → `finance.entries.read` (dashboard reads entry data)
- `finance.export.generate` → `finance.entries.export`

### Tab 3: 👥 Recursos Humanos (8 resources, 43 permissions)

| #   | Resource            | Code                | Subtitle                                | Criar | Editar | Excluir | Exportar | Gerenciar | Importar | Listar | Ver |
| --- | ------------------- | ------------------- | --------------------------------------- | :---: | :----: | :-----: | :------: | :-------: | :------: | :----: | :-: |
| 1   | Ausências           | `hr.absences`       | gerenciar: aprovar, cancelar            |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 2   | Cargos              | `hr.positions`      | —                                       |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 3   | Colaboradores       | `hr.employees`      | gerenciar: suspender, reativar, licença |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    ✓     |   ✓    |  ✓  |
| 4   | Departamentos       | `hr.departments`    | —                                       |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 5   | Escalas de Trabalho | `hr.work-schedules` | —                                       |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 6   | Férias              | `hr.vacations`      | gerenciar: aprovar                      |   ✓   |   ✓    |    —    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 7   | Folha de Pagamento  | `hr.payroll`        | gerenciar: bônus, descontos, processar  |   ✓   |   —    |    —    |    ✓     |     ✓     |    —     |   ✓    |  ✓  |
| 8   | Ponto               | `hr.time-control`   | controle de ponto, banco de horas       |   ✓   |   —    |    —    |    ✓     |     —     |    —     |   ✓    |  ✓  |

**"Gerenciar" scope:**

- Ausências: Aprovar, cancelar solicitações
- Colaboradores: Suspender, reativar, colocar em licença
- Férias: Aprovar solicitações
- Folha de Pagamento: Criar bônus/descontos, processar folha

**Consolidations:**

- `hr.bonuses.*`, `hr.deductions.*` → `hr.payroll.manage`
- `hr.time-bank.*` → `hr.time-control.read/list`
- `hr.overtime.*` → `hr.time-control.manage` (if needed later)
- `hr.fiscal-settings.*` → `hr.payroll.manage`
- `hr.stakeholders.*` → `hr.payroll.manage`
- `hr.payrolls.*` → `hr.payroll.*`
- `hr.vacation-periods.*` → `hr.vacations.*`
- `hr.employees.read.all/team`, `hr.employees.list.all/team` → `hr.employees.read/list` (scopes removed)

### Tab 4: 🛒 Vendas (3 resources, 19 permissions)

| #   | Resource  | Code               | Subtitle                            | Criar | Editar | Excluir | Exportar | Gerenciar | Importar | Listar | Ver |
| --- | --------- | ------------------ | ----------------------------------- | :---: | :----: | :-----: | :------: | :-------: | :------: | :----: | :-: |
| 1   | Clientes  | `sales.customers`  | —                                   |   ✓   |   ✓    |    ✓    |    ✓     |     —     |    ✓     |   ✓    |  ✓  |
| 2   | Pedidos   | `sales.orders`     | gerenciar: alterar status, cancelar |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    —     |   ✓    |  ✓  |
| 3   | Promoções | `sales.promotions` | —                                   |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |

**"Gerenciar" scope:**

- Pedidos: Alterar status, cancelar

**Consolidations:**

- `sales.reservations.*` → `sales.orders.manage`
- `sales.comments.*` → `sales.orders.update`

### Tab 5: 🏢 Administração (5 resources, 21 permissions)

Groups: RBAC (Grupos, Usuários) + Auditoria + Empresas + Sessões

| #   | Resource            | Code                      | Subtitle                                       | Criar | Editar | Excluir | Exportar | Gerenciar | Importar | Listar | Ver |
| --- | ------------------- | ------------------------- | ---------------------------------------------- | :---: | :----: | :-----: | :------: | :-------: | :------: | :----: | :-: |
| 1   | Auditoria: Logs     | `admin.audit-logs`        | gerenciar: comparar, histórico, rollback       |   —   |   —    |    —    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 2   | Empresas            | `admin.companies`         | endereços, CNAEs, fiscal, sócios, docs         |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 3   | Grupos de Permissão | `admin.permission-groups` | gerenciar: atribuir permissões                 |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 4   | Sessões             | `admin.sessions`          | gerenciar: revogar sessões                     |   —   |   —    |    —    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 5   | Usuários            | `admin.users`             | gerenciar: atribuir grupos, permissões diretas |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |

**"Gerenciar" scope:**

- Auditoria: Comparar versões, ver histórico, preview rollback
- Empresas: Gerenciar endereços, CNAEs, configurações fiscais, sócios, documentos, restaurar
- Grupos de Permissão: Atribuir/remover permissões do grupo
- Sessões: Revogar sessões de outros usuários
- Usuários: Atribuir/remover grupos, conceder permissões diretas

**Consolidations:**

- `rbac.permissions.*`, `rbac.groups.*` → `admin.permission-groups.*`
- `rbac.assignments.*`, `rbac.associations.*`, `rbac.user-groups.*`, `rbac.user-permissions.*` → `admin.users.manage`
- `audit.logs.*`, `audit.history.*`, `audit.compare.*`, `audit.rollback.*` → `admin.audit-logs.*`
- `core.users.*` → `admin.users.*`
- `core.sessions.*` → `admin.sessions.*`
- `admin.company-addresses.*`, `admin.company-cnaes.*`, `admin.company-fiscal-settings.*`, `admin.company-stakeholder.*` → `admin.companies.manage`

### Tab 6: 🔧 Ferramentas (7 resources, 38 permissions)

Groups: Agenda + Armazenamento + Email + Tarefas

| #   | Resource                | Code                    | Subtitle                                          | Criar | Editar | Excluir | Exportar | Gerenciar | Importar | Listar | Ver |
| --- | ----------------------- | ----------------------- | ------------------------------------------------- | :---: | :----: | :-----: | :------: | :-------: | :------: | :----: | :-: |
| 1   | Agenda: Eventos         | `tools.calendar-events` | gerenciar: compartilhar, participantes, lembretes |   ✓   |   ✓    |    ✓    |    ✓     |     ✓     |    —     |   ✓    |  ✓  |
| 2   | Armazenamento: Arquivos | `tools.storage-files`   | gerenciar: versões, compartilhar, download        |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 3   | Armazenamento: Pastas   | `tools.storage-folders` | gerenciar: compartilhar com usuário/grupo         |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 4   | Email: Contas           | `tools.email-accounts`  | gerenciar: compartilhar, sincronizar              |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 5   | Email: Mensagens        | `tools.email-messages`  | —                                                 |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 6   | Tarefas: Cartões        | `tools.task-cards`      | gerenciar: mover, atribuir, anexos, comentários   |   ✓   |   ✓    |    ✓    |    —     |     ✓     |    —     |   ✓    |  ✓  |
| 7   | Tarefas: Quadros        | `tools.task-boards`     | —                                                 |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |

**"Gerenciar" scope:**

- Agenda: Eventos: Compartilhar com usuários/equipes, convidar participantes, gerenciar lembretes, criar agendas de equipe
- Armazenamento: Arquivos: Gerenciar versões, compartilhar, restaurar versão
- Armazenamento: Pastas: Compartilhar com usuário/grupo
- Email: Contas: Compartilhar conta, sincronizar, testar conexão
- Tarefas: Cartões: Mover entre colunas, atribuir, gerenciar anexos, comentários, watchers

**Consolidations:**

- `calendar.events.*`, `calendar.participants.*`, `calendar.reminders.*` → `tools.calendar-events.*`
- `storage.interface.view`, `storage.user-folders.*`, `storage.filter-folders.*`, `storage.system-folders.*` → `tools.storage-folders.*`
- `storage.files.*`, `storage.versions.*`, `storage.stats.view`, `storage.security.manage` → `tools.storage-files.*`
- `email.accounts.*`, `email.sync.*` → `tools.email-accounts.*`
- `email.messages.*` → `tools.email-messages.*`
- `tasks.boards.*` → `tools.task-boards.*`
- `tasks.cards.*`, `tasks.comments.*`, `tasks.labels.*`, `tasks.custom-fields.*`, `tasks.attachments.*`, `tasks.watchers.*` → `tools.task-cards.*`

### Tab 7: ⚙️ Sistema (3 resources, 10 permissions)

| #   | Resource            | Code                     | Subtitle                                  | Criar | Editar | Excluir | Exportar | Gerenciar | Importar | Listar | Ver |
| --- | ------------------- | ------------------------ | ----------------------------------------- | :---: | :----: | :-----: | :------: | :-------: | :------: | :----: | :-: |
| 1   | Modelos de Etiqueta | `system.label-templates` | —                                         |   ✓   |   ✓    |    ✓    |    —     |     —     |    —     |   ✓    |  ✓  |
| 2   | Notificações        | `system.notifications`   | gerenciar: enviar, agendar                |   —   |   —    |    —    |    —     |     ✓     |    —     |   —    |  —  |
| 3   | Permissões Pessoais | `system.self`            | perfil, sessões, férias, ausências, ponto |   —   |   ✓    |    —    |    —     |     ✓     |    —     |   —    |  ✓  |

**"Gerenciar" scope:**

- Notificações: Enviar, broadcast, agendar notificações administrativas
- Permissões Pessoais: Configurar quais ações self-service os usuários podem realizar (atualizar perfil, solicitar férias, registrar ponto, etc.)

**Note:** `system.self.read` = user can view own profile/data. `system.self.update` = user can edit own profile. `system.self.manage` = full self-service (request vacations, absences, register time entries, etc.)

**Consolidations:**

- `core.label-templates.*` → `system.label-templates.*`
- `core.teams.*` → `admin.users.manage` (teams are an admin function)
- `notifications.*` → `system.notifications.manage`
- All `self.*` permissions → `system.self.*`

---

## Summary

| Tab | Module              | Resources | Permissions |
| --- | ------------------- | --------- | ----------- |
| 1   | 📦 Estoque          | 9         | 51          |
| 2   | 💰 Financeiro       | 9         | 52          |
| 3   | 👥 Recursos Humanos | 8         | 43          |
| 4   | 🛒 Vendas           | 3         | 19          |
| 5   | 🏢 Administração    | 5         | 21          |
| 6   | 🔧 Ferramentas      | 7         | 38          |
| 7   | ⚙️ Sistema          | 3         | 10          |
|     | **Total**           | **44**    | **~234**    |

Previous total: ~721 permissions. **Reduction: 67%.**

---

## Backend Changes Required

### 1. Update `permission-codes.ts`

- Replace ALL module sections with new permission codes
- New top-level structure: `STOCK`, `FINANCE`, `HR`, `SALES`, `ADMIN`, `TOOLS`, `SYSTEM`
- Maintain backward compatibility during migration (map old codes → new codes)

### 2. Update Seed

- Sync new permission codes to database
- Handle migration of existing group permissions (old code → new code mapping)
- Update `DEFAULT_USER_PERMISSIONS` to use new `system.self.*` codes

### 3. Update Controllers

- Remap all middleware permission checks to new codes
- Consolidated controllers now check parent resource permissions
- Example mappings:
  - Zone controllers → `stock.warehouses.manage`
  - Attachment controllers → parent resource `.manage`
  - Movement controller → `stock.items.list`
  - Task comments/labels/watchers → `tools.task-cards.manage`

### 4. Update Frontend Permission Guards

- Update all `hasPermission()` calls across all modules
- Update `PERMISSIONS` constants in frontend
- Update navigation menu permission checks

## Frontend Changes Required

### 1. New Component: `ManagePermissionsMatrix`

- Replace `ManagePermissionsModal` content with matrix UI
- Props: `groupId`, `open`, `onOpenChange`, `onSave`
- Internal state: `selectedPermissions: Set<string>`

### 2. Sub-components

- `ModuleTabList` — Vertical tab sidebar (7 tabs)
- `PermissionMatrix` — The checkbox grid table
- `SelectAllColumnButton` — ⬇ icon toggle
- `SelectAllRowButton` — → icon toggle

### 3. API Integration

- Use existing `rbacService.listAllPermissions()` to get available permissions
- Use existing `rbacService.listGroupPermissions(groupId)` to get current selections
- Save strategy: **full replace** — compute diff between current and desired, then remove stale + add new via `removePermissionFromGroup()` and `addPermissionsToGroupBulk()`

## Migration Strategy

1. Add new permission codes alongside old ones (both exist temporarily)
2. Create migration script to map existing group permissions: old code → new code
3. Update all controllers to use new codes
4. Update all frontend permission checks
5. Remove old permission codes from `permission-codes.ts`
6. Run seed to clean stale permissions from database
