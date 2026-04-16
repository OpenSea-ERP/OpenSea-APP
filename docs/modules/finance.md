# Module: Finance (Frontend)

## Overview

O módulo Financeiro é o centro de controle das finanças da empresa no OpenSea-APP. Ele oferece uma interface completa para gestão de contas a pagar e receber, fluxo de caixa, empréstimos, consórcios, contratos, contas bancárias, categorias, centros de custo e exportação contábil.

O módulo está organizado sob o route group `(dashboard)/(modules)/finance`. Todo acesso às seções é controlado por permissões RBAC granulares definidas no objeto `FINANCE_PERMISSIONS`.

**Dependências com outros módulos:**

- `stock/` — Os fornecedores cadastrados no módulo de estoque são reutilizados no wizard de contas a pagar via `useFinanceSuppliers()` (proxy sobre `suppliersService`)
- `sales/` — Os clientes cadastrados no módulo de vendas são reutilizados no wizard de contas a receber via `useFinanceCustomers()` (proxy sobre `customersService`)
- `admin/` — Empresas cadastradas no módulo Admin são compartilhadas com contas bancárias e centros de custo do módulo financeiro via `services/admin/companies.service.ts`
- `stock/` — Ordens de compra aprovadas criam entradas financeiras automaticamente via integração de backend (hook `CalendarSyncService`)

---

## Route Structure

### Route Tree

```
/finance                                        # Landing page — cards de navegação com contadores reais
/finance/payable                                # Lista de contas a pagar (PAYABLE)
/finance/payable/new                            # Nova conta a pagar (rota de página dedicada)
/finance/payable/[id]                           # Detalhe/edição de conta a pagar
/finance/payable/[id]/edit                      # Edição de conta a pagar
/finance/receivable                             # Lista de contas a receber (RECEIVABLE)
/finance/receivable/new                         # Nova conta a receber
/finance/receivable/[id]                        # Detalhe/edição de conta a receber
/finance/receivable/[id]/edit                   # Edição de conta a receber
/finance/overdue                                # Contas vencidas — a pagar e a receber em abas
/finance/cashflow                               # Fluxo de caixa por período com agrupamento dinâmico
/finance/bank-accounts                          # Lista de contas bancárias
/finance/bank-accounts/[id]                     # Detalhe de conta bancária
/finance/bank-accounts/[id]/edit                # Edição de conta bancária
/finance/categories                             # Lista de categorias financeiras (despesa/receita)
/finance/categories/[id]                        # Detalhe de categoria
/finance/categories/[id]/edit                   # Edição de categoria
/finance/cost-centers                           # Lista de centros de custo
/finance/cost-centers/new                       # Novo centro de custo
/finance/cost-centers/[id]                      # Detalhe de centro de custo
/finance/cost-centers/[id]/edit                 # Edição de centro de custo
/finance/companies                              # Empresas vinculadas ao módulo financeiro
/finance/companies/[id]                         # Detalhe de empresa
/finance/companies/[id]/edit                    # Edição de empresa
/finance/loans                                  # Lista de empréstimos
/finance/loans/new                              # Novo empréstimo
/finance/loans/[id]                             # Detalhe de empréstimo (parcelas, pagamentos)
/finance/loans/[id]/edit                        # Edição de empréstimo
/finance/consortia                              # Lista de consórcios
/finance/consortia/new                          # Novo consórcio
/finance/consortia/[id]                         # Detalhe de consórcio (parcelas, contemplação)
/finance/consortia/[id]/edit                    # Edição de consórcio
/finance/contracts                              # Lista de contratos com fornecedores
/finance/contracts/new                          # Novo contrato
/finance/contracts/[id]                         # Detalhe de contrato
/finance/export                                 # Exportação contábil (CSV / SPED)
```

### Layout Hierarchy

```
(dashboard)/layout.tsx              # Navbar principal + NavigationMenu
  └── (modules)/finance/page.tsx    # Landing page do Financeiro
  └── Páginas de entidades          # PageLayout > PageHeader > PageActionBar > PageBody
```

As páginas de listagem de lançamentos (`payable`, `receivable`), empréstimos e consórcios seguem o padrão `PageLayout / PageHeader / PageBody` com `PageActionBar` e `SearchBar`. As páginas de fluxo de caixa, exportação e vencidos utilizam layout customizado com botão de retorno e `div.container`.

---

## Page Structure

### Component Tree por Página

#### `/finance` — Landing Page

```
FinanceLandingPage
  ├── PageActionBar                   # Breadcrumb: Financeiro
  ├── PageHeroBanner                  # Título, descrição, ícone DollarSign
  │   ├── BotãoDashboard             # Navega para /finance/dashboard
  │   └── BotãoFluxoCaixa           # Navega para /finance/cashflow
  └── PageDashboardSections           # Seções de navegação com contadores
      ├── Seção "Lançamentos"
      │   ├── Card Contas a Pagar    # countKey: payable (PENDING)
      │   ├── Card Contas a Receber  # countKey: receivable (PENDING)
      │   └── Card Atrasados         # countKey: overdue (isOverdue=true)
      ├── Seção "Cadastros"
      │   ├── Card Contas Bancárias  # countKey: bankAccounts
      │   ├── Card Centros de Custo  # countKey: costCenters
      │   ├── Card Categorias        # sem contador
      │   └── Card Empresas          # sem contador (empresas sendo migradas para admin)
      ├── Seção "Crédito"
      │   ├── Card Empréstimos       # countKey: loans
      │   ├── Card Consórcios        # countKey: consortia
      │   └── Card Contratos         # countKey: contracts
      └── Seção "Relatórios"
          └── Card Exportação Contábil
```

Os contadores são carregados via um único endpoint consolidado `GET /v1/finance/overview` que retorna todas as contagens em uma só requisição. O service `financeDashboardService.getOverview()` é utilizado na montagem da página.

#### `/finance/payable` — Contas a Pagar

```
PayablePage
  ├── PageActionBar                   # Breadcrumb + botão "Nova Conta a Pagar"
  ├── Header                          # Título "Contas a Pagar"
  ├── SearchBar                       # Busca por descrição ou código
  ├── FilterToggle + ClearFilters     # Badge com contagem de filtros ativos
  ├── FilterPanel (colapsável)
  │   ├── Select Status
  │   ├── Select Categoria            # Somente categorias type=EXPENSE ou BOTH
  │   ├── Input Fornecedor
  │   ├── DatePicker Vencimento de
  │   └── DatePicker Vencimento até
  ├── Card (tabela)
  │   ├── Table                       # Colunas: Código, Descrição, Fornecedor, Valor, Vencimento, Status, Ações
  │   ├── Paginação customizada       # com seletor de itens por página (10/20/50/100)
  │   └── Empty state com CTA
  ├── PayableWizardModal              # Wizard em 5 etapas para criar conta a pagar
  ├── BaixaModal                      # Registro de pagamento com juros e multa
  └── VerifyActionPinModal            # Confirmação de exclusão por PIN
```

#### `/finance/receivable` — Contas a Receber

```
ReceivablePage
  ├── PageActionBar                   # Breadcrumb + botão "Nova Conta a Receber"
  ├── Header                          # Título "Contas a Receber"
  ├── SearchBar
  ├── FilterPanel (colapsável)
  │   ├── Select Status
  │   ├── Select Categoria            # Somente categorias type=REVENUE ou BOTH
  │   ├── Input Cliente
  │   ├── DatePicker Vencimento de
  │   └── DatePicker Vencimento até
  ├── Card (tabela)
  │   └── Table                       # Colunas: Código, Descrição, Cliente, Valor, Vencimento, Status, Ações
  ├── ReceivableWizardModal
  ├── BaixaModal
  └── VerifyActionPinModal
```

#### `/finance/overdue` — Contas Vencidas

```
OverduePage
  ├── Header customizado              # "Contas Vencidas" + botão voltar
  ├── Tabs                            # "A Pagar Vencidos" | "A Receber Vencidos"
  └── Card (tabela)
      └── Table                       # Colunas: Código, Descrição, Categoria, Fornecedor/Cliente,
                                      #          Valor, Vencimento, Dias em Atraso (com badge colorido por faixa), Status
```

A coluna "Dias em Atraso" usa código de cores: 1–7 dias (amarelo), 8–30 (laranja), 31–60 (vermelho claro), 60+ (vermelho escuro). Clique na linha navega para `/finance/{tipo}/{id}`.

#### `/finance/cashflow` — Fluxo de Caixa

```
CashflowPage
  ├── Header customizado              # "Fluxo de Caixa" + botão voltar
  ├── Card Filtros
  │   ├── Input Data Início           # Default: primeiro dia do mês atual
  │   ├── Input Data Fim              # Default: último dia do mês atual
  │   └── Select Agrupar por         # dia | semana | mês
  ├── Card Detalhamento por Período
  │   └── Tabela                      # Período, Entradas, Saídas, Fluxo Líquido, Saldo Acumulado
  └── Card Resumo do Período
      └── Grid 5 colunas              # Saldo Inicial, Total Entradas, Total Saídas, Fluxo Líquido, Saldo Final
```

#### `/finance/loans` — Empréstimos

```
LoansPage
  ├── PageActionBar                   # Breadcrumb + botão "Novo Empréstimo"
  ├── Header                          # "Empréstimos"
  ├── SearchBar                       # Busca por nome, contrato ou tipo
  ├── Select Status
  ├── Card (tabela)
  │   ├── TableSkeleton               # Skeleton durante carregamento
  │   ├── Table                       # Colunas: Nome, Contrato, Valor Principal, Saldo Devedor,
  │   │                               #          Taxa, Parcelas (pagas/total), Progresso (barra),
  │   │                               #          Status, Ações
  │   ├── LoanRowActions              # Menu contextual: Visualizar, Editar, Excluir
  │   ├── TablePágination             # Paginação simples com Anterior/Próxima
  │   └── EmptyState                  # Com CTA "Novo Empréstimo" se tiver permissão
  └── VerifyActionPinModal
```

A coluna Progresso usa `Progress` (shadcn) com cor dinâmica: ≥80% verde-esmeralda, ≥50% azul, ≥25% âmbar, <25% cinza.

#### `/finance/export` — Exportação Contábil

```
ExportPage
  ├── Header customizado              # "Exportação Contábil" + botão voltar
  ├── Alert de feedback               # Sucesso ou erro após exportação
  ├── Card Configurar Exportação
  │   ├── Input Data Início
  │   ├── Input Data Fim
  │   ├── Radio Formato               # CSV | SPED
  │   └── Botão Exportar
  └── Card informativo                # Explicação dos formatos CSV e SPED
```

---

## Types

Todos os tipos de finance estão em `src/types/finance/` com barrel re-export via `src/types/finance/index.ts`.

### finance-entry.types.ts

| Interface/Type                                             | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FinanceEntryType`                                         | `PAYABLE` \| `RECEIVABLE`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `FinanceEntryStatus`                                       | `PENDING`, `OVERDUE`, `PAID`, `RECEIVED`, `PARTIALLY_PAID`, `CANCELLED`, `SCHEDULED`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `FinanceEntryRecurrence`                                   | `SINGLE`, `RECURRING`, `INSTALLMENT`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `RecurrenceUnit`                                           | `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMIANNUAL`, `ANNUAL`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `PaymentMethod`                                            | `PIX`, `BOLETO`, `TRANSFER`, `CASH`, `CHECK`, `CARD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `FinanceAttachmentType`                                    | `BOLETO`, `PAYMENT_RECEIPT`, `CONTRACT`, `INVOICE`, `OTHER`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `PayableSubType`                                           | `BOLETO`, `NOTA_FISCAL`, `TRANSFERENCIA`, `CARTAO`, `OUTROS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `OverdueRange`                                             | `1-7`, `8-30`, `31-60`, `60+`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `FinanceEntry`                                             | Lançamento completo: `id`, `type`, `code`, `description`, `categoryId/Name`, `costCenterId/Name`, `bankAccountId/Name`, `supplierName`, `customerName`, `salesOrderId`, `expectedAmount`, `actualAmount`, `discount`, `interest`, `penalty`, `totalDue`, `remainingBalance`, `issueDate`, `dueDate`, `competenceDate`, `paymentDate`, `status`, `recurrenceType`, `recurrenceInterval`, `recurrenceUnit`, `totalInstallments`, `currentInstallment`, `parentEntryId`, `boletoBarcode`, `boletoDigitLine`, `isOverdue`, `tags`, `payments[]`, `attachments[]`, `childEntries[]` |
| `CostCenterAllocation`                                     | `costCenterId`, `percentage`, `amount?`, `costCenterName?` — para rateio de centro de custo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CreateFinanceEntryData`                                   | Dados de criação com campos opcionais para parcelamento, boleto, notas e tags                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `UpdateFinanceEntryData`                                   | `Partial<CreateFinanceEntryData>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `RegisterPaymentData`                                      | `bankAccountId?`, `amount`, `paidAt`, `method?`, `reference?`, `notes?`, `interest?`, `penalty?`                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `FinanceEntryPayment`                                      | Registro histórico de pagamento de um lançamento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `FinanceAttachment`                                        | Anexo de lançamento: `id`, `entryId`, `type`, `fileName`, `filePath`, `fileSize`, `mimeType`, `fileUrl?`                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `FinanceEntriesQuery`                                      | Filtros: `type`, `status`, `categoryId`, `costCenterId`, `bankAccountId`, `dueDateFrom`, `dueDateTo`, `isOverdue`, `customerName`, `supplierName`, `overdueRange`, `includeDeleted`                                                                                                                                                                                                                                                                                                                                                                                            |
| `ParseBoletoRequest` / `ParseBoletoResult`                 | Decodificação de código de barras de boleto via backend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ForecastQuery` / `ForecastDataPoint` / `ForecastResponse` | Projeção financeira por período e agrupamento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `FINANCE_ENTRY_STATUS_LABELS`                              | Mapa status → label PT-BR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `FINANCE_ENTRY_TYPE_LABELS`                                | `PAYABLE → "A Pagar"`, `RECEIVABLE → "A Receber"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `RECURRENCE_TYPE_LABELS`                                   | `SINGLE → "Única"`, `RECURRING → "Recorrente"`, `INSTALLMENT → "Parcelado"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `RECURRENCE_UNIT_LABELS`                                   | Diário → Anual em PT-BR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `PAYMENT_METHOD_LABELS`                                    | PIX, Boleto, Transferência, Dinheiro, Cheque, Cartão                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### bank-account.types.ts

| Interface/Type             | Descrição                                                                                                                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BankAccountType`          | `CHECKING`, `SAVINGS`, `SALARY`, `PAYMENT`, `INVESTMENT`, `DIGITAL`, `OTHER`                                                                                                                                                     |
| `BankAccountStatus`        | `ACTIVE`, `INACTIVE`, `CLOSED`                                                                                                                                                                                                   |
| `PixKeyType`               | `CPF`, `CNPJ`, `EMAIL`, `PHONE`, `RANDOM`                                                                                                                                                                                        |
| `BankAccount`              | `id`, `companyId?`, `name`, `bankCode`, `bankName?`, `agency`, `agencyDigit?`, `accountNumber`, `accountDigit?`, `accountType`, `status`, `pixKeyType?`, `pixKey?`, `currentBalance`, `balanceUpdatedAt?`, `color?`, `isDefault` |
| `CreateBankAccountData`    | Campos de criação (exceto status e balance — geridos pelo backend)                                                                                                                                                               |
| `UpdateBankAccountData`    | `Partial<Omit<CreateBankAccountData, 'companyId'>>`                                                                                                                                                                              |
| `BankAccountsQuery`        | Filtros: `search`, `companyId`, `accountType`, `status`                                                                                                                                                                          |
| `BANK_ACCOUNT_TYPE_LABELS` | Mapa tipo → label PT-BR                                                                                                                                                                                                          |

### finance-category.types.ts

| Interface/Type                 | Descrição                                                                                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FinanceCategoryType`          | `EXPENSE`, `REVENUE`, `BOTH`                                                                                                                                                              |
| `FinanceCategory`              | `id`, `name`, `slug`, `description?`, `iconUrl?`, `color?`, `type`, `parentId?`, `displayOrder`, `isActive`, `interestRate?`, `penaltyRate?`, `isSystem`, `childrenCount?`, `entryCount?` |
| `CreateFinanceCategoryData`    | Inclui campos de taxa de juros e multa (herdados automaticamente nos lançamentos da categoria)                                                                                            |
| `FINANCE_CATEGORY_TYPE_LABELS` | `EXPENSE → "Despesa"`, `REVENUE → "Receita"`, `BOTH → "Ambos"`                                                                                                                            |

### cost-center.types.ts

| Interface/Type         | Descrição                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `CostCenter`           | `id`, `companyId?`, `code`, `name`, `description?`, `isActive`, `monthlyBudget?`, `annualBudget?`, `parentId?`, `childrenCount?` |
| `CreateCostCenterData` | Inclui código obrigatório, orçamentos mensais/anuais opcionais e suporte a hierarquia (`parentId`)                               |
| `CostCentersQuery`     | Filtros: `search`, `companyId`, `isActive`, `includeDeleted`                                                                     |

### loan.types.ts

| Interface/Type                            | Descrição                                                                                                                                                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LoanType`                                | `PERSONAL`, `BUSINESS`, `WORKING_CAPITAL`, `EQUIPMENT`, `REAL_ESTATE`, `CREDIT_LINE`, `OTHER`                                                                                                                                                                                 |
| `LoanStatus`                              | `ACTIVE`, `PAID_OFF`, `DEFAULTED`, `RENEGOTIATED`, `CANCELLED`                                                                                                                                                                                                                |
| `Loan`                                    | `id`, `bankAccountId/Name`, `costCenterId/Name`, `name`, `type`, `contractNumber?`, `status`, `principalAmount`, `outstandingBalance`, `interestRate`, `interestType?`, `startDate`, `endDate?`, `totalInstallments`, `paidInstallments`, `installmentDay?`, `installments[]` |
| `LoanInstallment`                         | Parcela com `principalAmount`, `interestAmount`, `totalAmount`, `paidAmount?`, `status` (reusa `FinanceEntryStatus`)                                                                                                                                                          |
| `CreateLoanData`                          | Dados de criação com prazo e taxa de juros                                                                                                                                                                                                                                    |
| `PayLoanInstallmentData`                  | `bankAccountId?`, `paidAmount`, `paidAt`                                                                                                                                                                                                                                      |
| `LOAN_TYPE_LABELS` / `LOAN_STATUS_LABELS` | Mapas PT-BR                                                                                                                                                                                                                                                                   |

### consortium.types.ts

| Interface/Type             | Descrição                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ConsortiumStatus`         | `ACTIVE`, `CONTEMPLATED`, `WITHDRAWN`, `COMPLETED`, `CANCELLED`                                                                                                                                                                                                                                                                  |
| `Consortium`               | `id`, `bankAccountId/Name`, `costCenterId/Name`, `name`, `administrator`, `groupNumber?`, `quotaNumber?`, `contractNumber?`, `status`, `creditValue`, `monthlyPayment`, `totalInstallments`, `paidInstallments`, `isContemplated`, `contemplatedAt?`, `contemplationType?`, `startDate`, `endDate?`, `paymentDay?`, `payments[]` |
| `ConsortiumPayment`        | Parcela do consórcio com status reusando `FinanceEntryStatus`                                                                                                                                                                                                                                                                    |
| `CreateConsortiumData`     | Dados de criação com administradora, valor do crédito e parcelas                                                                                                                                                                                                                                                                 |
| `MarkContemplatedData`     | `contemplationType: 'BID'                                                                                                                                                                                                                                                                                                        | 'DRAW'`, `contemplatedAt` — registra contemplação por lance ou sorteio |
| `CONSORTIUM_STATUS_LABELS` | Mapas PT-BR                                                                                                                                                                                                                                                                                                                      |

### contract.types.ts

| Interface/Type                                        | Descrição                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ContractStatus`                                      | `DRAFT`, `ACTIVE`, `EXPIRED`, `RENEWED`, `CANCELLED`                                                                                                                                                                                                                                                                                                                                         |
| `PaymentFrequency`                                    | `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMIANNUAL`, `ANNUAL`                                                                                                                                                                                                                                                                                                                |
| `Contract`                                            | `id`, `tenantId`, `code`, `title`, `description?`, `status`, `companyId?`, `companyName`, `contactName?`, `contactEmail?`, `totalValue`, `paymentFrequency`, `paymentAmount`, `categoryId?`, `costCenterId?`, `bankAccountId?`, `startDate`, `endDate`, `autoRenew`, `renewalPeriodMonths?`, `alertDaysBefore`, `folderPath?`, `daysUntilExpiration`, `isActive`, `isCancelled`, `isExpired` |
| `CreateContractData`                                  | Campos de criação incluindo alertas e renovação automática                                                                                                                                                                                                                                                                                                                                   |
| `SupplierHistory`                                     | Histórico de contratos com totais por fornecedor (`contracts[]`, `totalContracts`, `totalPaymentsValue`, `totalPaymentsCount`)                                                                                                                                                                                                                                                               |
| `GenerateEntriesResult`                               | Resultado da geração de lançamentos a partir de contrato                                                                                                                                                                                                                                                                                                                                     |
| `CONTRACT_STATUS_LABELS` / `PAYMENT_FREQUENCY_LABELS` | Mapas PT-BR                                                                                                                                                                                                                                                                                                                                                                                  |

### dashboard.types.ts

| Interface/Type             | Descrição                                                                                                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FinanceDashboard`         | KPIs do painel: `totalPayable`, `totalReceivable`, `overduePayable`, `overdueReceivable`, `overduePayableCount`, `overdueReceivableCount`, `paidThisMonth`, `receivedThisMonth`, `upcomingPayable7Days`, `upcomingReceivable7Days`, `cashBalance`, `topOverdueReceivables[]`, `topOverduePayables[]` |
| `OverdueReceivableSummary` | `customerName`, `totalOverdue`, `count`, `oldestDueDate`                                                                                                                                                                                                                                             |
| `OverduePayableSummary`    | `supplierName`, `totalOverdue`, `count`, `oldestDueDate`                                                                                                                                                                                                                                             |
| `CashflowData`             | `period`, `inflow`, `outflow`, `netFlow`, `cumulativeBalance`                                                                                                                                                                                                                                        |
| `CashflowResponse`         | `data: CashflowData[]` + `summary` (totalInflow, totalOutflow, netFlow, openingBalance, closingBalance)                                                                                                                                                                                              |

### receivable.types.ts

| Interface/Type              | Descrição                                                                         |
| --------------------------- | --------------------------------------------------------------------------------- |
| `ReceivableSubType`         | `VENDA`, `SERVICO`, `ALUGUEL`, `OUTROS` — subtipo para wizard de contas a receber |
| `RECEIVABLE_SUBTYPE_LABELS` | Mapa PT-BR                                                                        |

### dashboard.types.ts (Overview)

| Interface/Type                   | Descrição                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FinanceOverview`                | Contagens consolidadas da landing page: `entries` (`payable`, `receivable`, `overdue`), `entities` (`bankAccounts`, `costCenters`, `categories`, `loans`, `consortia`, `contracts`) |
| `FinanceOverviewEntryTypeCounts` | `{ pending: number; total: number }` — contadores por tipo de lançamento                                                                                                            |
| `FinanceOverviewEntityCounts`    | `{ total: number }` — contador por entidade cadastral                                                                                                                               |

### Sincronização com Backend

| Arquivo                     | Backend Schema                  | Sincronizado? |
| --------------------------- | ------------------------------- | ------------- |
| `finance-entry.types.ts`    | `finance-entry.schema.ts`       | Sim           |
| `bank-account.types.ts`     | `bank-account.schema.ts`        | Sim           |
| `finance-category.types.ts` | `finance-category.schema.ts`    | Sim           |
| `cost-center.types.ts`      | `cost-center.schema.ts`         | Sim           |
| `loan.types.ts`             | `loan.schema.ts`                | Sim           |
| `consortium.types.ts`       | `consortium.schema.ts`          | Sim           |
| `contract.types.ts`         | `contract.schema.ts`            | Sim           |
| `dashboard.types.ts`        | endpoints de dashboard/cashflow | Sim           |
| `receivable.types.ts`       | Subtipo usado somente no wizard | Frontend-only |

---

## Hooks

Todos os hooks de finance estão em `src/hooks/finance/` com barrel via `src/hooks/finance/index.ts`.

### Hooks de Lançamentos (`use-finance-entries.ts`)

| Hook                         | Query Key                     | Endpoint                                | Notas                                                             |
| ---------------------------- | ----------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `useFinanceEntries(params?)` | `['finance-entries', params]` | `GET /v1/finance-entries`               | Suporta filtros compostos; usado em payable, receivable e overdue |
| `useFinanceEntry(id)`        | `['finance-entries', id]`     | `GET /v1/finance-entries/:id`           | Ativado quando `id` presente                                      |
| `useCreateFinanceEntry()`    | —                             | `POST /v1/finance-entries`              | Invalida `['finance-entries']`                                    |
| `useUpdateFinanceEntry()`    | —                             | `PATCH /v1/finance-entries/:id`         | Invalida lista e item                                             |
| `useDeleteFinanceEntry()`    | —                             | `DELETE /v1/finance-entries/:id`        | Invalida lista                                                    |
| `useCancelFinanceEntry()`    | —                             | `PATCH /v1/finance-entries/:id/cancel`  | Invalida lista e item                                             |
| `useRegisterPayment()`       | —                             | `POST /v1/finance-entries/:id/payments` | Invalida lista e item da entrada                                  |
| `useCheckOverdue()`          | —                             | `POST /v1/finance/check-overdue`        | Mutation administrativa; invalida lista                           |
| `useParseBoleto()`           | —                             | `POST /v1/finance/parse-boleto`         | Sem cache; decodifica código de barras                            |
| `financeEntryKeys`           | —                             | —                                       | Constante exportada para invalidação externa                      |

### Hooks de Contas Bancárias (`use-bank-accounts.ts`)

| Hook                       | Query Key                   | Endpoint                               | Notas                 |
| -------------------------- | --------------------------- | -------------------------------------- | --------------------- |
| `useBankAccounts(params?)` | `['bank-accounts', params]` | `GET /v1/finance/bank-accounts`        | —                     |
| `useBankAccount(id)`       | `['bank-accounts', id]`     | `GET /v1/finance/bank-accounts/:id`    | —                     |
| `useCreateBankAccount()`   | —                           | `POST /v1/finance/bank-accounts`       | Invalida lista        |
| `useUpdateBankAccount()`   | —                           | `PATCH /v1/finance/bank-accounts/:id`  | Invalida lista e item |
| `useDeleteBankAccount()`   | —                           | `DELETE /v1/finance/bank-accounts/:id` | Invalida lista        |

### Hooks de Categorias (`use-finance-categories.ts`)

| Hook                            | Query Key                        | Endpoint                            | Notas                                               |
| ------------------------------- | -------------------------------- | ----------------------------------- | --------------------------------------------------- |
| `useFinanceCategories(params?)` | `['finance-categories', params]` | `GET /v1/finance/categories`        | Usado nos filtros de payable/receivable e no wizard |
| `useFinanceCategory(id)`        | `['finance-categories', id]`     | `GET /v1/finance/categories/:id`    | —                                                   |
| `useCreateFinanceCategory()`    | —                                | `POST /v1/finance/categories`       | Invalida lista                                      |
| `useUpdateFinanceCategory()`    | —                                | `PATCH /v1/finance/categories/:id`  | Invalida lista e item                               |
| `useDeleteFinanceCategory()`    | —                                | `DELETE /v1/finance/categories/:id` | Invalida lista                                      |

### Hooks de Centros de Custo (`use-cost-centers.ts`)

| Hook                      | Query Key                  | Endpoint                              | Notas                 |
| ------------------------- | -------------------------- | ------------------------------------- | --------------------- |
| `useCostCenters(params?)` | `['cost-centers', params]` | `GET /v1/finance/cost-centers`        | —                     |
| `useCostCenter(id)`       | `['cost-centers', id]`     | `GET /v1/finance/cost-centers/:id`    | —                     |
| `useCreateCostCenter()`   | —                          | `POST /v1/finance/cost-centers`       | Invalida lista        |
| `useUpdateCostCenter()`   | —                          | `PATCH /v1/finance/cost-centers/:id`  | Invalida lista e item |
| `useDeleteCostCenter()`   | —                          | `DELETE /v1/finance/cost-centers/:id` | Invalida lista        |

### Hooks de Empréstimos (`use-loans.ts`)

| Hook                      | Query Key           | Endpoint                         | Notas                               |
| ------------------------- | ------------------- | -------------------------------- | ----------------------------------- |
| `useLoans(params?)`       | `['loans', params]` | `GET /v1/finance/loans`          | —                                   |
| `useLoan(id)`             | `['loans', id]`     | `GET /v1/finance/loans/:id`      | —                                   |
| `useCreateLoan()`         | —                   | `POST /v1/finance/loans`         | Invalida lista                      |
| `useUpdateLoan()`         | —                   | `PATCH /v1/finance/loans/:id`    | Invalida lista e item               |
| `useDeleteLoan()`         | —                   | `DELETE /v1/finance/loans/:id`   | Invalida lista                      |
| `usePayLoanInstallment()` | —                   | `POST /v1/finance/loans/:id/pay` | Invalida lista e item do empréstimo |

### Hooks de Consórcios (`use-consortia.ts`)

| Hook                            | Query Key               | Endpoint                                      | Notas                              |
| ------------------------------- | ----------------------- | --------------------------------------------- | ---------------------------------- |
| `useConsortia(params?)`         | `['consortia', params]` | `GET /v1/finance/consortia`                   | —                                  |
| `useConsortium(id)`             | `['consortia', id]`     | `GET /v1/finance/consortia/:id`               | —                                  |
| `useCreateConsortium()`         | —                       | `POST /v1/finance/consortia`                  | Invalida lista                     |
| `useUpdateConsortium()`         | —                       | `PATCH /v1/finance/consortia/:id`             | Invalida lista e item              |
| `useDeleteConsortium()`         | —                       | `DELETE /v1/finance/consortia/:id`            | Invalida lista                     |
| `usePayConsortiumInstallment()` | —                       | `POST /v1/finance/consortia/:id/pay`          | Invalida lista e item do consórcio |
| `useMarkContemplated()`         | —                       | `PATCH /v1/finance/consortia/:id/contemplate` | Invalida lista e item              |

### Hooks de Contratos (`use-contracts.ts`)

| Hook                           | Query Key                                                   | Endpoint                                          | Notas                                                |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `useContracts(params?)`        | `['contracts', params]`                                     | `GET /v1/finance/contracts`                       | —                                                    |
| `useContract(id)`              | `['contracts', id]`                                         | `GET /v1/finance/contracts/:id`                   | —                                                    |
| `useCreateContract()`          | —                                                           | `POST /v1/finance/contracts`                      | Invalida lista                                       |
| `useUpdateContract()`          | —                                                           | `PATCH /v1/finance/contracts/:id`                 | Invalida lista e item                                |
| `useDeleteContract()`          | —                                                           | `DELETE /v1/finance/contracts/:id`                | Invalida lista                                       |
| `useGenerateContractEntries()` | —                                                           | `POST /v1/finance/contracts/:id/generate-entries` | Invalida lista de contratos                          |
| `useSupplierHistory(params)`   | `['contracts', 'supplier-history', companyId, companyName]` | `GET /v1/finance/contracts/supplier-history`      | Ativado quando `companyId` ou `companyName` presente |

### Hooks de Dashboard e Relatórios (`use-finance-dashboard.ts`)

| Hook                         | Query Key                      | Endpoint                             | Notas                                            |
| ---------------------------- | ------------------------------ | ------------------------------------ | ------------------------------------------------ |
| `useFinanceDashboard()`      | `['finance-dashboard']`        | `GET /v1/finance/dashboard`          | KPIs do painel                                   |
| `useFinanceForecast(params)` | `['finance-forecast', params]` | `GET /v1/finance/forecast`           | Ativado quando `startDate` e `endDate` presentes |
| `useFinanceCashflow(params)` | `['finance-cashflow', params]` | `GET /v1/finance/cashflow`           | Ativado quando `startDate` e `endDate` presentes |
| `useExportAccounting()`      | —                              | `POST /v1/finance/export-accounting` | Mutation que retorna `Blob` para download        |

### Hooks Auxiliares

| Hook                                  | Arquivo                   | Propósito                                                                                                                                                                            |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useFinanceNotificationPreferences()` | `use-notifications.ts`    | Preferências de notificação do módulo financeiro (renomeado de `useNotificationPreferences` para evitar conflito com hook de sales).                                                 |
| `useBrasilApiBanks()`                 | `use-brasil-api-banks.ts` | Lista bancos da BrasilAPI. Query key: `['brasilapi-banks']`. Cache de 24h. Usado no formulário de conta bancária para autocomplete de código/nome do banco.                          |
| `useFinanceSuppliers(params?)`        | `use-suppliers.ts`        | Proxy sobre `suppliersService` do módulo stock. Query key: `['finance-suppliers', params]`. Filtro client-side por nome. Evita conflito de nomes com `useSuppliers` do módulo stock. |
| `useCreateFinanceSupplier()`          | `use-suppliers.ts`        | Cria fornecedor inline no wizard de payable. Invalida `['finance-suppliers']` e `['suppliers']` simultaneamente.                                                                     |
| `useFinanceCustomers(params?)`        | `use-customers.ts`        | Proxy sobre `customersService` do módulo sales. Query key: `['finance-customers', params]`. Filtro client-side por nome.                                                             |
| `useCreateFinanceCustomer()`          | `use-customers.ts`        | Cria cliente inline no wizard de receivable. Invalida `['finance-customers']` e `['customers']` simultaneamente.                                                                     |

---

## Components

Todos os componentes específicos do módulo estão em `src/components/finance/`.

### Wizard de Contas a Pagar (`PayableWizardModal`)

Modal em 5 etapas para criação de conta a pagar. Etapas orquestradas pelo componente `PayableWizardModal` com estado `WizardData` centralizado.

| Etapa | Componente               | Descrição                                                                                                                                                                           |
| ----- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `WizardStepType`         | Seleção do subtipo: Boleto, Nota Fiscal, Transferência, Cartão, Outros                                                                                                              |
| 2     | `WizardStepData`         | Dados principais: descrição, fornecedor (com criação inline), categoria, centro de custo (com rateio), conta bancária, valor, datas (emissão, vencimento, competência), notas, tags |
| 3     | `WizardStepInstallments` | Tipo de recorrência: Única, Parcelado; se parcelado: número de parcelas e preview das datas                                                                                         |
| 4     | `WizardStepAttachment`   | Anexo opcional (upload de arquivo) com tipo de documento                                                                                                                            |
| 5     | `WizardStepConfirmation` | Resumo dos dados antes de criar; botão "Criar" chama `useCreateFinanceEntry()`                                                                                                      |

**Props:** `{ open: boolean, onOpenChange: (open: boolean) => void, onCreated: () => void }`

### Wizard de Contas a Receber (`ReceivableWizardModal`)

Modal em 5 etapas análogo ao `PayableWizardModal`, porém com:

- Etapa 1 (`WizardStepTypeReceivable`): subtipo de receita (Venda, Serviço, Aluguel, Outros)
- Etapa 2 (`WizardStepDataReceivable`): cliente no lugar de fornecedor; categorias filtradas por type=REVENUE/BOTH

### Modal de Baixa (`BaixaModal`)

Modal de registro de pagamento ou recebimento de um lançamento financeiro.

**Props:** `{ open, onOpenChange, entry: FinanceEntry, categoryInterestRate?: number, categoryPenaltyRate?: number }`

**Funcionalidades:**

- Calcula automaticamente juros e multa com base nos dias de atraso e nas taxas da categoria
- Permite selecionar conta bancária, método de pagamento, valor, data e referência
- Chama `useRegisterPayment()` ao confirmar

### Formulários Inline (`inline-*.tsx`)

Componentes para criação de entidades sem sair do wizard:

| Componente              | Entidade criada            | Usado em                                  |
| ----------------------- | -------------------------- | ----------------------------------------- |
| `InlineSupplierForm`    | Fornecedor (stock)         | WizardStepData (payable)                  |
| `InlineCustomerForm`    | Cliente (sales)            | WizardStepDataReceivable                  |
| `InlineCategoryForm`    | Categoria financeira       | WizardStepData e WizardStepDataReceivable |
| `InlineCostCenterForm`  | Centro de custo            | WizardStepData                            |
| `InlineBankAccountForm` | Conta bancária             | WizardStepData                            |
| `InlineCreateModal`     | Wrapper genérico de dialog | Envolve todos os formulários inline acima |

### Componentes Auxiliares

| Componente             | Responsabilidade                                                                                              | Usado em               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `CostCenterAllocation` | Rateio percentual de um lançamento entre múltiplos centros de custo; valida que a soma dos percentuais é 100% | WizardStepData         |
| `InstallmentPreview`   | Visualização das datas e valores de cada parcela antes de criar                                               | WizardStepInstallments |

---

## Permissions

Todas as permissões do módulo estão declaradas no objeto `FINANCE_PERMISSIONS` em `src/config/rbac/permission-codes.ts`.

| Grupo         | Código                                                        | Descrição                            |
| ------------- | ------------------------------------------------------------- | ------------------------------------ |
| Companies     | `finance.companies.create/read/update/delete/list/manage`     | CRUD de empresas vinculadas          |
| Cost Centers  | `finance.cost-centers.create/read/update/delete/list/manage`  | CRUD de centros de custo             |
| Bank Accounts | `finance.bank-accounts.create/read/update/delete/list/manage` | CRUD de contas bancárias             |
| Categories    | `finance.categories.create/read/update/delete/list/manage`    | CRUD de categorias financeiras       |
| Entries       | `finance.entries.create/read/update/delete/list`              | CRUD de lançamentos                  |
| Entries       | `finance.entries.pay`                                         | Registrar pagamento/recebimento      |
| Entries       | `finance.entries.cancel`                                      | Cancelar lançamento                  |
| Entries       | `finance.entries.manage`                                      | Permissão ampla (inclui todas acima) |
| Loans         | `finance.loans.create/read/update/delete/list/pay/manage`     | CRUD e pagamento de empréstimos      |
| Consortia     | `finance.consortia.create/read/update/delete/list/pay/manage` | CRUD e pagamento de consórcios       |
| Contracts     | `finance.contracts.create/read/update/delete/list/manage`     | CRUD de contratos                    |
| Dashboard     | `finance.dashboard.view`                                      | Acesso ao painel de KPIs             |
| Export        | `finance.export.generate`                                     | Gerar exportação contábil            |

As páginas de lista verificam individualmente `canCreate`, `canView`, `canEdit` e `canDelete` antes de exibir botões e menus de ação. A permissão ausente oculta o elemento correspondente (não redireciona).

---

## API Integration

O módulo se comunica com o backend exclusivamente via services em `src/services/finance/`.

| Service                    | Arquivo                         | Operações                                                                                                                   |
| -------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `financeEntriesService`    | `finance-entries.service.ts`    | `list`, `get`, `create`, `update`, `delete`, `cancel`, `registerPayment`, `checkOverdue`, `parseBoleto`, `uploadAttachment` |
| `bankAccountsService`      | `bank-accounts.service.ts`      | `list`, `get`, `create`, `update`, `delete`                                                                                 |
| `financeCategoriesService` | `finance-categories.service.ts` | `list`, `get`, `create`, `update`, `delete`                                                                                 |
| `costCentersService`       | `cost-centers.service.ts`       | `list`, `get`, `create`, `update`, `delete`                                                                                 |
| `loansService`             | `loans.service.ts`              | `list`, `get`, `create`, `update`, `delete`, `registerPayment`                                                              |
| `consortiaService`         | `consortia.service.ts`          | `list`, `get`, `create`, `update`, `delete`, `registerPayment`, `markContemplated`                                          |
| `contractsService`         | `contracts.service.ts`          | `list`, `get`, `create`, `update`, `delete`, `generateEntries`, `getSupplierHistory`                                        |
| `financeDashboardService`  | `dashboard.service.ts`          | `getOverview`, `getDashboard`, `getForecast`, `getCashflow`, `exportAccounting`, `getDreInteractive`                        |

Todos os services utilizam `apiClient` de `src/lib/api-client.ts`, que injeta automaticamente o JWT de tenant em cada requisição.

O `exportAccounting` retorna um `Blob` que deve ser tratado pelo chamador para disparo de download via URL temporária.

---

## State Management

- **Contextos:** Nenhum contexto específico do módulo financeiro. Utiliza `TenantContext` para o tenant atual e `AuthContext` para permissões.
- **URL State:** As páginas de lista de lançamentos (`payable`, `receivable`) utilizam `useState` local para filtros — não há sincronização via query params. A página de fluxo de caixa também usa `useState` local para datas e agrupamento.
- **React Query Keys:** Definidos como constantes `QUERY_KEYS` dentro de cada arquivo de hook, exportadas quando necessário para invalidação externa.
- **Estado de wizard:** `PayableWizardModal` e `ReceivableWizardModal` gerenciam o estado de todas as etapas com um único objeto `WizardData` via `useState`, passado como prop para cada etapa.

---

## User Flows

### Flow 1: Criar uma Conta a Pagar por Boleto

1. Usuário acessa `/finance/payable`
2. Clica em "Nova Conta a Pagar" — `setWizardOpen(true)`
3. `PayableWizardModal` abre na Etapa 1 — seleciona "Boleto"
4. Etapa 2: preenche descrição, seleciona fornecedor (ou cria um novo inline), seleciona categoria, define valor, datas de emissão e vencimento; cola o código de barras — `useParseBoleto()` decodifica automaticamente
5. Etapa 3: mantém "Única" (pagamento simples)
6. Etapa 4: anexa o arquivo do boleto com tipo "BOLETO"
7. Etapa 5: revisa e confirma — `useCreateFinanceEntry()` cria o lançamento
8. Toast de sucesso; lista é atualizada via `refetch()`

### Flow 2: Registrar Pagamento de uma Conta Vencida

1. Usuário acessa `/finance/payable`
2. Filtra por status "Vencido"
3. Clica em "Registrar Pagamento" no menu de ações da linha
4. `BaixaModal` abre com os dados do lançamento e taxas da categoria pré-preenchidas
5. Sistema calcula automaticamente juros e multa com base nos dias em atraso
6. Usuário confirma o valor final, seleciona método PIX e conta bancária
7. `useRegisterPayment()` registra o pagamento; cache é invalidado
8. Status do lançamento muda para `PAID`

### Flow 3: Criar um Empréstimo e Registrar Parcelas

1. Usuário acessa `/finance/loans`
2. Clica em "Novo Empréstimo" — navega para `/finance/loans/new`
3. Preenche dados: nome, tipo, conta bancária, centro de custo, valor principal, taxa de juros, número de parcelas e dia de vencimento
4. Submit chama `useCreateLoan()` — parcelas são geradas automaticamente pelo backend
5. Retorna para lista; na linha do empréstimo, a barra de progresso mostra 0/N parcelas
6. Para pagar uma parcela, navega para o detalhe e chama `usePayLoanInstallment()`

### Flow 4: Exportar Dados para Contabilidade

1. Usuário acessa `/finance/export`
2. Define período (data início e data fim)
3. Seleciona formato: "CSV" para uso em planilhas ou "SPED" para sistemas contábeis brasileiros
4. Clica em "Exportar" — `useExportAccounting()` dispara `POST /v1/finance/export-accounting`
5. Backend retorna `Blob` com o arquivo gerado
6. Feedback de sucesso ou erro é exibido na página

### Flow 5: Consultar Fluxo de Caixa do Mês

1. Usuário acessa `/finance/cashflow`
2. Período padrão é o mês corrente (calculado no mount)
3. Seleciona agrupamento "Semana" para visão semanal
4. `useFinanceCashflow()` busca dados e renderiza a tabela de detalhamento
5. Resumo ao final mostra saldo inicial, total de entradas, total de saídas e saldo final

### Flow 6: Marcar Contemplação de Consórcio

1. Usuário acessa `/finance/consortia/[id]`
2. Clica em "Marcar Contemplado"
3. Seleciona o tipo de contemplação: "Lance" (BID) ou "Sorteio" (DRAW) e a data
4. `useMarkContemplated()` chama o backend; status muda para `CONTEMPLATED` e `isContemplated` passa a `true`
5. Lista é atualizada; a cobertura do crédito fica disponível para uso

### Flow 7: Consultar DFC + drill-down de categoria

1. Usuário acessa `/finance/reports/dfc`
2. Seleciona exercício no seletor; `useDfcAnnual(year)` dispara
3. KPIs mostram totais operacional/investimento/financiamento + variação líquida
4. Gráfico 12 meses stacked usa barras translúcidas para meses negativos
5. Tabela de categorias aparece ordenada por |net|; cada linha mostra chip colorido da atividade
6. Clique em uma linha abre `Sheet` lateral (drawer) com lançamentos pagos dessa categoria no ano, via `useFinanceEntries({ categoryId, dueDateFrom, dueDateTo })`
7. Drawer lista data + descrição + fornecedor/cliente + valor signed (verde entrada, rose saída)

### Flow 8: Travar/liberar período contábil

1. Admin acessa `/finance/settings/period-locks` (requer `FINANCE.PERIOD_LOCKS.ACCESS`)
2. Seleciona exercício; grid 12 meses mostra quais estão abertos/fechados
3. Clique em mês aberto → `Dialog` com campo opcional de motivo
4. Envia via `useCreatePeriodLock()`; mês passa a ficar marcado com ícone `Lock` + cor rose
5. Tentativas de criar/editar/excluir lançamentos nesse mês (na API) retornam 400 com mensagem clara
6. Para liberar: clique no mês travado → `VerifyActionPinModal` exige PIN → `useReleasePeriodLock()`
7. Histórico da página lista toda a trilha (quem travou, quando, motivo, quando liberou)

### Flow 9: Recorrência com 3-way end + preview

1. Usuário abre wizard em `/finance/recurring/new` ou edita em `/finance/recurring/[id]/edit`
2. Seção "Término" mostra 3 botões (Nunca / Em uma data / Após N ocorrências) estilo Google Calendar
3. Selecionar "Em uma data" abre DatePicker; "Após N" mostra input numérico (default 12)
4. Card violeta "Próximas 5 ocorrências" aparece abaixo com descrição em pt-BR ("A cada 2 meses, começando em 15/03/2026, até 31/12/2026") + 5 datas absolutas (ex.: "qua, 15 mar 2026") e relativas ("em 3 dias")
5. Ao salvar, o backend persiste `endDate` OU `totalOccurrences` OU nenhum (conforme modo)

### Flow 10: Conciliação com bulk actions + balance widget

1. Usuário importa OFX; modal mostra lista 100% de transações com FITID + créditos/débitos + net flow antes de confirmar
2. Na página `/finance/reconciliation/[id]`, o Summary Card agora inclui "Confronto de saldos" (OFX × razão conciliado × diferença rose até zerar)
3. Cada linha tem checkbox; selecionar várias ativa `BulkToolbar` sticky no topo
4. Toolbar oferece "Criar lançamentos (N)" / "Ignorar (N)" / limpar — dispara mutations em paralelo via `Promise.all`
5. Empty state da listagem mostra 2 CTAs: "Importar OFX" (se IMPORT perm) e "Conectar via Open Finance" → `/finance/bank-connections`

---

## Audit History

| Data       | Dimensão                 | Score   | Relatório                                                                                                                                                                            |
| ---------- | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-03-10 | Documentação inicial     | —       | Criação da documentação completa do módulo finance (frontend)                                                                                                                        |
| 2026-03-10 | Auditoria consolidada    | 7.8/10  | 12 dimensões auditadas (`docs/audits/2026-03-10-finance-consolidated.md`)                                                                                                            |
| 2026-03-11 | Correções de auditoria   | ~9.0/10 | RBAC em 63 controllers, overview endpoint, union types, aria-labels (22 tabelas), PT-BR acentos (~90 correções), TransactionManager, generateNextCode atômico, ADRs, date validation |
| 2026-03-11 | Companies reorganization | —       | Empresas migradas de HR/Finance para Admin (`/v1/admin/companies`). Finance consome via `services/admin/companies.service.ts` com `admin.companies.*` permissions                    |
