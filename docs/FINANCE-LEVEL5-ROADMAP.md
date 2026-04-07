# Finance Level 5 — "Financial Co-Pilot" Roadmap

> **Objetivo:** Elevar o módulo financeiro de Level 4+ (9.0) para Level 5 (9.5+).
> **Escopo:** 13 features organizadas em 4 ondas por complexidade e dependência.

---

## Visão Geral

```
Onda 1 (Quick Wins)     → 1-2 dias cada  → +0.15 na nota
Onda 2 (Core Features)  → 2-3 dias cada  → +0.20 na nota
Onda 3 (Differentiators) → 3-5 dias cada → +0.10 na nota
Onda 4 (Game Changers)  → 5-10 dias cada → +0.10 na nota
```

**Meta: 9.0 → 9.55**

---

## Onda 1 — Quick Wins (1-2 dias cada)

### F1. DRE Drill-Down Interativo

**Complexidade:** Baixa | **Impacto:** Alto | **Estimativa:** 1 dia

**O que existe:**

- API: `get-dre-interactive.ts` — retorna árvore hierárquica com `categoryId`, valores por período
- APP: `dre-interactive-table.tsx` — tabela com collapse por nível

**O que falta:**

- Ao clicar numa linha da DRE, abrir painel lateral ou modal com os lançamentos que compõem aquele valor
- Filtrar entries por `categoryId` + período + status PAID/RECEIVED

**Implementação:**

- **API:** Novo endpoint `GET /v1/finance/entries?categoryId=X&startDate=Y&endDate=Z&status=PAID,RECEIVED` — JÁ EXISTE no `list-finance-entries`, apenas precisa ser chamado
- **APP:**
  1. Adicionar `onClick` nas linhas da DRE table
  2. Criar `DreEntryDrawer` — Sheet/Drawer lateral com lista de entries
  3. Chamar `useFinanceEntriesInfinite({ categoryId, startDate, endDate, status: ['PAID','RECEIVED'] })`
  4. Mostrar: descrição, valor, data, fornecedor/cliente

**Arquivos afetados:**

- `OpenSea-APP/src/components/finance/reports/dre-interactive-table.tsx` (add onClick)
- `OpenSea-APP/src/components/finance/reports/dre-entry-drawer.tsx` (novo)

**Riscos:** Nenhum — usa endpoints existentes.

---

### F2. Detecção de Duplicidades

**Complexidade:** Baixa | **Impacto:** Alto | **Estimativa:** 1 dia

**O que existe:** Nada — zero detecção.

**Implementação:**

- **API:** Criar use case `detect-duplicate-entry.ts`
  - Input: `{ tenantId, supplierName?, customerName?, expectedAmount, dueDate, description }`
  - Lógica: Buscar entries com MESMO valor ± 1% E MESMO fornecedor/cliente E dueDate ±3 dias
  - Score: valor exato +50, mesmo fornecedor +30, data ±1 dia +20
  - Threshold: ≥ 70 = provável duplicata
  - Retornar array de `{ entryId, score, matchReasons[] }`
- **API:** Endpoint `POST /v1/finance/entries/check-duplicate` — chamado ANTES de salvar
- **APP:**
  1. No payable/receivable wizard, no step de confirmação, chamar check-duplicate
  2. Se encontrar duplicatas, mostrar warning amarelo com lista das entries similares
  3. Botão "Criar mesmo assim" vs "Cancelar"

**Arquivos afetados:**

- `OpenSea-API/src/use-cases/finance/entries/detect-duplicate-entry.ts` (novo)
- `OpenSea-API/src/http/controllers/finance/entries/v1-check-duplicate.controller.ts` (novo)
- `OpenSea-APP/src/components/finance/payable-step-confirmation.tsx` (add warning)
- `OpenSea-APP/src/components/finance/receivable-step-confirmation.tsx` (add warning)
- `OpenSea-APP/src/hooks/finance/use-check-duplicate.ts` (novo)

**Riscos:** Performance — query com LIKE em supplierName pode ser lenta. Mitigar com index em (tenantId, expectedAmount, dueDate).

---

### F3. Parcelamento Automático no Wizard

**Complexidade:** Baixa | **Impacto:** Médio | **Estimativa:** 1 dia

**O que existe:**

- API: `create-finance-entry.ts` JÁ suporta `recurrenceType: 'INSTALLMENT'` com `totalInstallments`, `recurrenceUnit`, `recurrenceInterval`
- APP: Wizard NÃO expõe essa opção

**Implementação:**

- **APP apenas** — o backend já funciona:
  1. No `payable-step-details.tsx` e `receivable-step-details.tsx`:
     - Adicionar toggle "Parcelar" (Switch)
     - Quando ativo, mostrar: Número de parcelas (select 2-48), Intervalo (Mensal/Quinzenal/Semanal)
     - Preview: "12x de R$ 500,00 — primeira em 15/04/2026"
  2. No submit do wizard, mapear para `recurrenceType: 'INSTALLMENT'`

**Arquivos afetados:**

- `OpenSea-APP/src/components/finance/payable-step-details.tsx` (add installment UI)
- `OpenSea-APP/src/components/finance/receivable-step-details.tsx` (add installment UI)
- `OpenSea-APP/src/components/finance/payable-wizard-modal.tsx` (pass installment data)
- `OpenSea-APP/src/components/finance/receivable-wizard-modal.tsx` (pass installment data)

**Riscos:** Nenhum — backend pronto.

---

### F4. Dashboard Fornecedor/Cliente

**Complexidade:** Baixa-Média | **Impacto:** Alto | **Estimativa:** 1.5 dias

**O que existe:**

- Entries têm `supplierName`/`customerName` e `supplierId`/`customerId`
- Nenhuma visualização agregada por fornecedor/cliente

**Implementação:**

- **API:** Novo endpoint `GET /v1/finance/entries/supplier-summary?supplierId=X` ou `?supplierName=X`
  - Retorna: `{ totalPaid, totalPending, totalOverdue, entryCount, avgAmount, firstEntry, lastEntry, monthlyTrend[] }`
  - Agrega entries por supplierName (case-insensitive) ou supplierId
- **APP:**
  1. Criar `SupplierSummaryDrawer` — abre ao clicar no nome do fornecedor em qualquer lugar
  2. Mostra: KPI cards (total, média, contagem), gráfico de tendência mensal, últimos lançamentos
  3. Integrar nas páginas de detail de payable/receivable

**Arquivos afetados:**

- `OpenSea-API/src/use-cases/finance/entries/get-supplier-summary.ts` (novo)
- `OpenSea-API/src/http/controllers/finance/entries/v1-get-supplier-summary.controller.ts` (novo)
- `OpenSea-APP/src/components/finance/supplier-summary-drawer.tsx` (novo)
- `OpenSea-APP/src/hooks/finance/use-supplier-summary.ts` (novo)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/(entities)/payable/[id]/page.tsx` (integrar)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/(entities)/receivable/[id]/page.tsx` (integrar)

**Riscos:** Aggregation pode ser lenta em tenants com muitas entries. Considerar materializar ou cachear.

---

### F5. Fluxo de Caixa Realizado vs Projetado

**Complexidade:** Média | **Impacto:** Alto | **Estimativa:** 2 dias

**O que existe:**

- API: `get-cashflow.ts` — cashflow realizado com groupBy
- API: `get-predictive-cashflow.ts` — previsão com weighted moving average
- APP: `cashflow-chart.tsx` — gráfico de barras inflow/outflow

**O que falta:**

- Overlay visual comparando previsão anterior com realizado
- Persistir previsões para comparação futura

**Implementação:**

- **API:**
  1. Novo model `CashflowSnapshot` — salva previsão diária: `{ tenantId, date, predictedInflow, predictedOutflow, createdAt }`
  2. O cron de forecast (daily) salva snapshot automático
  3. Novo endpoint `GET /v1/finance/dashboard/cashflow-accuracy` — retorna realizado vs predito por período
- **APP:**
  1. No cashflow chart, adicionar linha tracejada "Projetado" sobre as barras "Realizado"
  2. Card de acurácia: "Precisão da previsão: 87%" com tooltip explicativo
  3. Toggle para mostrar/esconder overlay

**Arquivos afetados:**

- `OpenSea-API/prisma/schema.prisma` (novo model CashflowSnapshot)
- `OpenSea-API/src/use-cases/finance/dashboard/get-cashflow-accuracy.ts` (novo)
- `OpenSea-API/src/services/finance/finance-scheduler.ts` (add snapshot job)
- `OpenSea-APP/src/components/finance/analytics/cashflow-chart.tsx` (add overlay)
- `OpenSea-APP/src/hooks/finance/use-cashflow-accuracy.ts` (novo)

**Riscos:** Snapshot table pode crescer. Limitar a 365 dias + auto-purge.

---

## Onda 2 — Core Features (2-3 dias cada)

### F6. Atlas Conversacional (Linguagem Natural)

**Complexidade:** Média | **Impacto:** Muito Alto | **Estimativa:** 3 dias

**O que existe:**

- Atlas AI com 13 ferramentas financeiras (query + action)
- Tool-based: o frontend manda tool call, Atlas executa

**O que falta:**

- Interface de chat natural: "Quanto gastei com aluguel nos últimos 3 meses?"
- Parser de intent que mapeia frase → sequência de tool calls

**Implementação:**

- **API:**
  1. Novo endpoint `POST /v1/ai/finance-query` — recebe `{ query: string }` em linguagem natural
  2. Usa o LLM (Gemini/Claude) para decompor a query em tool calls
  3. Executa as tools internamente e formata resposta em texto
  4. Prompt template com exemplos: "Quanto gastei com X" → `finance_list_entries({ categoryName: X, type: PAYABLE, status: PAID })`
- **APP:**
  1. Criar `FinanceChatWidget` — widget flutuante no dashboard finance
  2. Input de texto + histórico de perguntas/respostas
  3. Sugestões rápidas: "Resumo do mês", "Contas vencidas", "Previsão de caixa"

**Arquivos afetados:**

- `OpenSea-API/src/http/controllers/ai/v1-finance-query.controller.ts` (novo)
- `OpenSea-API/src/use-cases/ai/finance-natural-query.ts` (novo)
- `OpenSea-APP/src/components/finance/finance-chat-widget.tsx` (novo)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/page.tsx` (integrar widget)

**Dependências:** Requer provider de LLM configurado (Atlas já tem).

---

### F7. Régua de Cobrança Visual

**Complexidade:** Média | **Impacto:** Alto | **Estimativa:** 2 dias

**O que existe:**

- API: Escalation engine completa com steps, templates, customer score
- APP: `escalation-config-modal.tsx` — config de regras
- Sem visualização de EXECUÇÃO das escalações

**Implementação:**

- **API:** Novo endpoint `GET /v1/finance/escalations/timeline?entryId=X`
  - Retorna: `{ steps: [{ type, sentAt, channel, status, nextStep, daysUntilNext }] }`
- **APP:**
  1. Criar `EscalationTimeline` — componente visual tipo timeline vertical
  2. Cada step: ícone (email/whatsapp/formal), data, status (sent/pending/failed), preview da mensagem
  3. Mostrar no detail page de entries overdue
  4. Botão "Executar próximo passo" manual

**Arquivos afetados:**

- `OpenSea-API/src/use-cases/finance/escalations/get-escalation-timeline.ts` (novo)
- `OpenSea-API/src/http/controllers/finance/escalations/v1-get-timeline.controller.ts` (novo)
- `OpenSea-APP/src/components/finance/escalation-timeline.tsx` (novo)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/(entities)/payable/[id]/page.tsx` (integrar)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/(entities)/receivable/[id]/page.tsx` (integrar)

**Riscos:** Nenhum — dados já existem na tabela OverdueAction.

---

### F8. Split de Pagamento

**Complexidade:** Média | **Impacto:** Médio | **Estimativa:** 2 dias

**O que existe:**

- Baixa (payment registration) existe mas é 1:1 — um pagamento para uma entry
- Entries suportam `paidAmount` parcial

**Implementação:**

- **API:**
  1. Novo endpoint `POST /v1/finance/entries/split-payment`
  2. Input: `{ paymentAmount, bankAccountId, paymentDate, entryAllocations: [{ entryId, amount }] }`
  3. Valida que sum(allocations) = paymentAmount
  4. Para cada entry: registra pagamento parcial ou total
  5. Gera FinanceEntryPayment record para cada alocação
- **APP:**
  1. Criar `SplitPaymentModal` — wizard de 2 steps
  2. Step 1: Selecionar entries (checkbox na listagem) + valor total do pagamento
  3. Step 2: Distribuir valor entre entries (auto-split proporcional ou manual)
  4. Integrar via SelectionToolbar na listagem de payable

**Arquivos afetados:**

- `OpenSea-API/src/use-cases/finance/entries/split-payment.ts` (novo)
- `OpenSea-API/src/http/controllers/finance/entries/v1-split-payment.controller.ts` (novo)
- `OpenSea-APP/src/components/finance/split-payment-modal.tsx` (novo)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/(entities)/payable/page.tsx` (add toolbar action)

**Riscos:** Concorrência — dois splits simultâneos no mesmo entry. Usar transaction + otimistic lock.

---

## Onda 3 — Differentiators (3-5 dias cada)

### F9. Consolidação Multi-Empresa

**Complexidade:** Alta | **Impacto:** Médio | **Estimativa:** 4 dias

**O que existe:**

- Model `Company` com `tenantId` — suporta múltiplas empresas
- Entries são tenant-scoped, NÃO company-scoped
- DRE e Balanço existem mas são consolidados automaticamente (sem filtro por empresa)

**Implementação:**

- **API:**
  1. Adicionar campo opcional `companyId` no model FinanceEntry (migration)
  2. Atualizar create/update entry para aceitar companyId
  3. Criar endpoint `GET /v1/finance/dashboard/dre-consolidated`
     - Aceita `companyIds[]` como filtro
     - Retorna DRE individual por empresa + consolidado
     - Eliminação de transações intercompany (mesmo tenant, empresas diferentes)
  4. Criar endpoint `GET /v1/finance/dashboard/balance-consolidated`
- **APP:**
  1. Adicionar filtro de empresa no wizard de criação de entries
  2. Na DRE page, adicionar seletor multi-empresa com toggle "Consolidado"
  3. Criar `ConsolidatedDreTable` com colunas por empresa + total

**Arquivos afetados:**

- `OpenSea-API/prisma/schema.prisma` (add companyId to FinanceEntry)
- `OpenSea-API/src/use-cases/finance/dashboard/get-dre-consolidated.ts` (novo)
- `OpenSea-API/src/use-cases/finance/entries/create-finance-entry.ts` (add companyId)
- `OpenSea-APP/src/components/finance/reports/consolidated-dre-table.tsx` (novo)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/reports/page.tsx` (add company filter)

**Riscos:**

- Migration precisa de `companyId` nullable (backwards-compatible)
- Eliminação intercompany é complexa — implementar v1 simples (flag manual)

---

### F10. SPED EFD-Contribuições

**Complexidade:** Alta | **Impacto:** Médio | **Estimativa:** 3 dias

**O que existe:**

- Export SPED ECD (contabilidade) funcional
- Tax retentions com IRRF/ISS/INSS/PIS/COFINS/CSLL

**Implementação:**

- **API:**
  1. Criar `export-sped-efd.ts` — gera arquivo EFD layout conforme manual da RFB
  2. Blocos obrigatórios: 0 (Abertura), A (Serviços), C (Mercadorias), D (Transporte), F (Outros), M (Apuração PIS/COFINS), 1 (Complementos), 9 (Controle)
  3. Registro M210 (PIS) e M610 (COFINS) — usar dados das retenções
  4. Validar CNPJ/CPF, regime tributário, período fiscal
  5. Endpoint: `GET /v1/finance/export/sped-efd?year=2026&month=3`
- **APP:**
  1. Na página de export, adicionar opção "EFD-Contribuições"
  2. Wizard com: empresa, período, regime tributário
  3. Download do arquivo .txt formatado

**Arquivos afetados:**

- `OpenSea-API/src/use-cases/finance/export/export-sped-efd.ts` (novo)
- `OpenSea-API/src/http/controllers/finance/export/v1-export-sped-efd.controller.ts` (novo)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/reports/export/page.tsx` (add option)

**Riscos:** Layout EFD é rígido — erros de formatação causam rejeição pela SEFAZ. Testar com validador público da RFB.

---

### F11. Financial Health Score

**Complexidade:** Média | **Impacto:** Muito Alto | **Estimativa:** 3 dias

**O que existe:**

- Dashboard KPIs, anomaly detection, predictive cashflow
- Customer score (0-100) para escalação

**Implementação:**

- **API:** Criar `calculate-financial-health.ts`
  - **5 dimensões** (20 pts cada, total 100):
    1. **Liquidez** (20pts): (Saldo contas + A receber 30d) / (A pagar 30d) → ratio > 1.5 = 20pts
    2. **Inadimplência** (20pts): % entries overdue vs total → < 5% = 20pts
    3. **Previsibilidade** (20pts): Acurácia do forecast vs realizado → > 90% = 20pts
    4. **Diversificação** (20pts): Nenhum fornecedor > 30% do total → balanced = 20pts
    5. **Crescimento** (20pts): Receita mês atual vs mês anterior → crescendo = 20pts
  - Retorna: `{ score, dimensions[], tips[], trend }`
  - Tips são sugestões contextuais em português: "Concentração alta no fornecedor X — considere diversificar"
  - Endpoint: `GET /v1/finance/dashboard/health-score`
- **APP:**
  1. Criar `HealthScoreWidget` — gauge circular com score 0-100
  2. Cores: 0-40 rose, 41-70 amber, 71-100 emerald
  3. Breakdown das 5 dimensões com barra de progresso
  4. Card de dicas com ícones
  5. Integrar no dashboard principal como primeiro widget

**Arquivos afetados:**

- `OpenSea-API/src/use-cases/finance/dashboard/calculate-financial-health.ts` (novo)
- `OpenSea-API/src/http/controllers/finance/dashboard/v1-get-health-score.controller.ts` (novo)
- `OpenSea-APP/src/components/finance/dashboard/health-score-widget.tsx` (novo)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/page.tsx` (add widget)

**Riscos:** Nenhum significativo — usa dados já disponíveis.

---

## Onda 4 — Game Changers (5-10 dias)

### F12. Conciliação Bancária Automática Contínua

**Complexidade:** Alta | **Impacto:** Muito Alto | **Estimativa:** 5 dias

**O que existe:**

- Bank connections via Pluggy
- Auto-match algorithm (score-based)
- Cron job sync every 4h
- Manual reconciliation UI

**O que falta:**

- Match automático SEM intervenção humana (quando score ≥ 95)
- Notificação para matches com score 70-94 (precisa review)
- Dashboard de reconciliation status em tempo real

**Implementação:**

- **API:**
  1. Estender `sync-bank-transactions` para chamar auto-match após sync
  2. Entries com score ≥ 95: auto-reconcile (marcar como PAID, criar baixa)
  3. Entries com score 70-94: criar `ReconciliationSuggestion` para review
  4. Entries com score < 70: ignorar (manual)
  5. Novo model `ReconciliationSuggestion` com status PENDING/ACCEPTED/REJECTED
  6. Endpoint: `GET /v1/finance/reconciliation/suggestions` + `POST .../accept` + `POST .../reject`
- **APP:**
  1. Criar `ReconciliationSuggestionsPanel` — lista de sugestões pendentes
  2. Cada sugestão: transaction info, entry info, score, accept/reject buttons
  3. Badge no menu Finance com count de sugestões pendentes
  4. Widget no dashboard com status de reconciliação

**Arquivos afetados:**

- `OpenSea-API/prisma/schema.prisma` (new ReconciliationSuggestion model)
- `OpenSea-API/src/use-cases/finance/reconciliation/auto-reconcile.ts` (novo)
- `OpenSea-API/src/services/finance/finance-scheduler.ts` (wire auto-reconcile after sync)
- `OpenSea-APP/src/components/finance/reconciliation-suggestions-panel.tsx` (novo)
- `OpenSea-APP/src/app/(dashboard)/(modules)/finance/reconciliation/page.tsx` (add panel)

**Riscos:**

- Auto-reconcile com score ≥ 95 pode errar em edge cases. Manter audit trail completo.
- Rollback: permitir desfazer auto-reconcile nos primeiros 24h.

---

### F13. Portal do Cliente

**Complexidade:** Alta | **Impacto:** Alto | **Estimativa:** 5 dias

**O que existe:**

- Payment links com página pública (`/pay/[slug]`)
- Portal do contador (`/accountant/[token]`)

**Implementação:**

- **API:**
  1. Novo model `CustomerPortalAccess` — `{ tenantId, customerId, token, expiresAt, permissions }`
  2. Endpoint `POST /v1/finance/customer-portal/invite` — gera token + envia email/WhatsApp
  3. Endpoints públicos `GET /v1/public/customer-portal/:token/...`:
     - `/invoices` — lista faturas do cliente (entries RECEIVABLE com customerId)
     - `/invoices/:id` — detalhe da fatura
     - `/payments` — histórico de pagamentos
     - `/pay/:entryId` — gera PIX/boleto para pagar
  4. Rate limiting e CORS restrito
- **APP:**
  1. Criar `/customer-portal/[token]/page.tsx` — layout público (sem sidebar)
  2. Tabs: "Faturas Pendentes", "Histórico", "Dados"
  3. Cada fatura: valor, vencimento, status, botão "Pagar" (abre PIX/boleto)
  4. Design clean e mobile-first
  5. Branding do tenant (logo, cores)

**Arquivos afetados:**

- `OpenSea-API/prisma/schema.prisma` (new CustomerPortalAccess model)
- `OpenSea-API/src/http/controllers/public/customer-portal/` (novo — 5+ controllers)
- `OpenSea-API/src/use-cases/finance/customer-portal/` (novo — 4+ use cases)
- `OpenSea-APP/src/app/customer-portal/[token]/page.tsx` (novo)
- `OpenSea-APP/src/app/customer-portal/[token]/layout.tsx` (novo)
- `OpenSea-APP/src/components/finance/invite-customer-portal-modal.tsx` (novo)

**Riscos:**

- Segurança: tokens devem ser criptograficamente seguros + expiráveis
- LGPD: dados pessoais do cliente expostos — apenas mostrar o mínimo

---

## Análise de Compatibilidade e Conflitos

### Dependências entre Features

```
F1 (DRE Drill-Down) ────── independente
F2 (Duplicidade) ────────── independente
F3 (Parcelamento) ───────── independente
F4 (Dashboard Fornecedor) ─ independente
F5 (Realizado vs Projetado) ─── depende do scheduler (já existe)
F6 (Atlas Conversacional) ──── depende do Atlas AI (já existe)
F7 (Régua Visual) ──────────── depende das escalations (já existe)
F8 (Split Payment) ─────────── independente
F9 (Multi-Empresa) ─────────── ⚠️ MIGRATION — add companyId to FinanceEntry
F10 (SPED EFD) ──────────────── depende de F9 (companyId para identificar empresa)
F11 (Health Score) ──────────── depende de F5 (accuracy data)
F12 (Reconciliação Contínua) ── depende do sync scheduler (já existe)
F13 (Portal Cliente) ─────────── independente (padrão accountant portal)
```

### Grafo de Dependências

```
F1, F2, F3, F4, F6, F7, F8, F13 → podem rodar em paralelo
F5 → precisa estar pronto antes de F11
F9 → precisa estar pronto antes de F10
F12 → pode rodar em paralelo (usa infra existente)
```

### Conflitos Potenciais

| Conflito                      | Features                                                                                          | Mitigação                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Schema migration**          | F5 (CashflowSnapshot), F9 (companyId), F12 (ReconciliationSuggestion), F13 (CustomerPortalAccess) | Executar migrations sequencialmente, nunca em paralelo. Testar com `prisma migrate dev` antes de push.                           |
| **FinanceEntry model**        | F2 (duplicate check), F3 (installments), F8 (split), F9 (companyId)                               | Todos modificam ou consultam FinanceEntry. F3 não altera model. F2 e F8 são novos endpoints. F9 é campo novo. Sem conflito real. |
| **Dashboard page**            | F5 (accuracy widget), F6 (chat widget), F11 (health score)                                        | Todos adicionam widgets ao dashboard. Organizar em grid com prioridade: Health Score > Chat > Accuracy.                          |
| **Payable/Receivable wizard** | F2 (duplicate warning), F3 (installment UI)                                                       | Ambos modificam o wizard — F2 no step confirmação, F3 no step details. Sem overlap se implementados em steps diferentes.         |
| **Scheduler jobs**            | F5 (snapshot), F12 (auto-reconcile)                                                               | Adicionar ao FinanceScheduler existente. Evitar rodarem no mesmo horário.                                                        |
| **Público routes**            | F13 (customer-portal)                                                                             | Mesmo padrão de `/accountant/[token]` — sem conflito. Separar em route group.                                                    |

### Padrões a Seguir

| Padrão                     | Aplicação                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **Clean Architecture**     | Novos use cases em `src/use-cases/finance/`, controllers em `src/http/controllers/finance/` |
| **Repository Pattern**     | Novos repos para CashflowSnapshot, ReconciliationSuggestion, CustomerPortalAccess           |
| **NavigationWizardDialog** | Qualquer novo wizard (split payment)                                                        |
| **CollapsibleSection**     | Novos settings sections                                                                     |
| **useInfiniteQuery**       | Todas as listagens (sugestões, faturas portal, entries drill-down)                          |
| **translateError**         | Todos os novos catch blocks                                                                 |
| **VerifyActionPinModal**   | Qualquer ação destrutiva (reject suggestion, delete portal access)                          |
| **toolbarStart**           | Filtros em qualquer nova listagem dentro de EntityGrid                                      |
| **Teal para fiscal**       | Manter teal para fiscal/contábil, violet para finance core                                  |
| **Portuguese accents**     | TODOS os textos visíveis ao usuário                                                         |

---

## Ordem de Execução Recomendada

```
Semana 1 (Onda 1):
  ├── F1 DRE Drill-Down ........... 1 dia
  ├── F2 Duplicidade .............. 1 dia    ← pode paralelo com F1
  ├── F3 Parcelamento ............. 1 dia    ← pode paralelo com F1
  └── F4 Dashboard Fornecedor ..... 1.5 dia

Semana 2 (Onda 1 + Onda 2):
  ├── F5 Realizado vs Projetado ... 2 dias
  ├── F7 Régua Visual ............. 2 dias   ← pode paralelo com F5
  └── F8 Split Payment ............ 2 dias   ← pode paralelo

Semana 3 (Onda 2 + Onda 3):
  ├── F6 Atlas Conversacional ..... 3 dias
  ├── F11 Health Score ............ 3 dias   ← após F5 (precisa accuracy)
  └── F9 Multi-Empresa ............ 4 dias (início)

Semana 4 (Onda 3 + Onda 4):
  ├── F9 Multi-Empresa ............ (conclusão)
  ├── F10 SPED EFD ................ 3 dias   ← após F9
  └── F12 Reconciliação Contínua .. 5 dias (início)

Semana 5 (Onda 4):
  ├── F12 Reconciliação Contínua .. (conclusão)
  └── F13 Portal Cliente .......... 5 dias
```

**Total estimado: ~35 dias úteis de desenvolvimento**

---

## Métricas de Sucesso

| Feature                    | KPI                                           |
| -------------------------- | --------------------------------------------- |
| F1 DRE Drill-Down          | Clicks por sessão na DRE > 3                  |
| F2 Duplicidade             | Entries duplicadas prevenidas / mês           |
| F3 Parcelamento            | % entries criadas como parcelamento           |
| F4 Dashboard Fornecedor    | Tempo médio para encontrar info do fornecedor |
| F5 Realizado vs Projetado  | Acurácia da previsão ≥ 85%                    |
| F6 Atlas Conversacional    | Queries / usuário / dia                       |
| F7 Régua Visual            | Redução em contas vencidas > 30 dias          |
| F8 Split Payment           | Uso em > 10% das baixas                       |
| F9 Multi-Empresa           | Tenants usando consolidação                   |
| F10 SPED EFD               | Exports gerados sem erro / mês                |
| F11 Health Score           | Melhoria média do score ao longo de 90 dias   |
| F12 Reconciliação Contínua | % entries auto-reconciliadas                  |
| F13 Portal Cliente         | Pagamentos via portal / total pagamentos      |
