# Module: HR (Frontend)

## Overview

O módulo de Recursos Humanos é o núcleo de gestão de pessoas do OpenSea-APP. Ele cobre o ciclo completo do funcionário: da admissão ao desligamento, passando por estrutura organizacional (empresas, departamentos, cargos), controle de jornada (ponto, banco de horas, horas extras), gestão de ausências (férias, afastamentos, atestados) e departamento pessoal (folha de pagamento, bonificações, deduções).

O módulo está organizado sob o route group `(dashboard)/(modules)/hr` e integra-se ao route group `(dashboard)/(actions)/import` para importação em lote via planilha.

**Dependências com outros módulos:**

- `admin/` — Vinculação de funcionários a usuários do sistema, grupos de permissão
- `finance/` — Folha de pagamento gera lançamentos financeiros; payroll integration via CalendarSyncService
- `storage/` — FileManager embutido nas páginas de detalhe de funcionários e empresas para gestão de documentos
- `calendar/` — Ausências aprovadas criam eventos no calendário via CalendarSyncService

---

## Route Structure

### Route Tree

```
/hr                                                 # Landing page — painel de navegação com contadores reais
/hr/overview                                        # Visão Geral — dashboard analítico (KPIs + gráficos Recharts)

# Cadastros
/hr/companies                                       # Lista de empresas (somente leitura — CRUD migrado para /admin/companies)
/hr/companies/[id]                                  # Detalhe de empresa (somente leitura)
/hr/departments                                     # Lista de departamentos
/hr/departments/[id]                                # Detalhe de departamento
/hr/departments/[id]/edit                           # Edição de departamento
/hr/positions                                       # Lista de cargos
/hr/positions/[id]                                  # Detalhe de cargo (faixa salarial, funcionários)
/hr/positions/[id]/edit                             # Edição de cargo
/hr/employees                                       # Lista de funcionários
/hr/employees/[id]                                  # Detalhe de funcionário (abas: Detalhes, Documentos)
/hr/employees/[id]/edit                             # Edição completa do funcionário

# Gestão de Tempo
/hr/work-schedules                                  # Lista de escalas de trabalho
/hr/work-schedules/[id]                             # Detalhe da escala (horários por dia, horas semanais)
/hr/work-schedules/[id]/edit                        # Edição da escala
/hr/time-control                                    # Controle de ponto — lista de registros com clock-in/clock-out
/hr/time-bank                                       # Banco de horas — saldos por funcionário e ano
/hr/time-bank/[id]                                  # Detalhe do banco de horas de um funcionário
/hr/overtime                                        # Lista de horas extras (pendentes e aprovadas)
/hr/overtime/[id]                                   # Detalhe de uma hora extra

# Férias e Ausências
/hr/vacations                                       # Lista de períodos aquisitivos de férias
/hr/vacations/[id]                                  # Detalhe do período (saldo, programação, dias vendidos)
/hr/absences                                        # Lista de ausências e afastamentos
/hr/absences/[id]                                   # Detalhe da ausência (aprovação, rejeição, documentos)

# Departamento Pessoal
/hr/payroll                                         # Lista de folhas de pagamento
/hr/payroll/[id]                                    # Detalhe da folha (itens, bruto, líquido, status)
/hr/bonuses                                         # Lista de bonificações
/hr/bonuses/[id]                                    # Detalhe de bonificação
/hr/deductions                                      # Lista de deduções
/hr/deductions/[id]                                 # Detalhe de dedução

# Importação
/import/hr/employees                                # Importação de funcionários (planilha CSV/XLSX)
/import/hr/departments                              # Importação de departamentos
/import/hr/positions                                # Importação de cargos
/import/admin/companies                             # Importação de empresas (migrado para Admin)
```

### Layout Hierarchy

```
(dashboard)/layout.tsx             # Navbar principal + NavigationMenu
  └── (modules)/hr/layout.tsx      # Herda do dashboard (sem layout próprio)
      ├── hr/page.tsx              # Landing page — 4 seções com cards
      ├── hr/overview/page.tsx     # Dashboard analítico
      └── hr/(entities)/*/page.tsx # Páginas de entidade — PageLayout > PageHeader > PageBody
```

Todas as páginas de entidade utilizam o padrão `PageLayout / PageHeader / PageBody` com `PageActionBar` para breadcrumbs e botões de ação.

---

## Page Structure

### Component Tree por Página

#### `/hr` — Landing Page

```
HRLandingPage
  ├── PageActionBar                 # Breadcrumb: "Recursos Humanos"
  ├── PageHeroBanner                # Título, descrição, botão "Visão Geral"
  └── PageDashboardSections         # 4 seções de cards:
      ├── "Cadastros"               # Empresas, Departamentos, Cargos e Funções, Funcionários
      ├── "Gestão de Tempo"         # Escalas de Trabalho, Controle de Ponto, Banco de Horas, Horas Extras
      ├── "Férias e Ausências"      # Férias, Ausências
      └── "Departamento Pessoal"    # Folha de Pagamento, Bonificações, Deduções
```

Os contadores dos cards (Empresas, Departamentos, Cargos, Funcionários) são carregados via `Promise.allSettled()` paralelo na montagem da página, consultando diretamente os services com `perPage: 1`.

#### `/hr/overview` — Dashboard Analítico

```
HROverviewPage
  ├── PageActionBar                 # Breadcrumb: "RH > Visão Geral"
  ├── Header                        # Título e descrição da página
  ├── Grid de KPI Cards (4 cards)
  │   ├── StatCard "Funcionários Ativos"
  │   ├── StatCard "Horas Extras Pendentes"
  │   ├── StatCard "Ausências Ativas"
  │   └── StatCard "Folha do Mês" (valor líquido)
  ├── Row 1: Gráficos de Headcount
  │   ├── ChartCard "Funcionários por Departamento" (BarChart horizontal — Recharts)
  │   └── ChartCard "Tipos de Contrato" (PieChart donut — Recharts)
  ├── Row 2: Tendências Temporais
  │   ├── ChartCard "Folha de Pagamento (6 meses)" (BarChart — Bruto vs Líquido)
  │   └── ChartCard "Horas Extras (6 meses)" (LineChart — Horas e Registros)
  └── Row 3: Gestão de Pessoal
      ├── ChartCard "Ausências por Tipo" (BarChart por categoria)
      └── ChartCard "Bonificações vs Deduções (6 meses)" (BarChart agrupado)
```

Os dados são agregados pelo hook `useHRAnalytics()` via `Promise.allSettled()` em 6 endpoints paralelos. A agregação é feita inteiramente no cliente (front-end) — não há endpoint dedicado de analytics no back-end.

#### `/hr/employees/[id]` — Detalhe de Funcionário

```
EmployeeDetailPage
  ├── PageHeader
  │   ├── PageActionBar             # Breadcrumb + botões: Excluir, Imprimir Etiqueta, Editar
  │   └── Identity Card             # Foto (hover revela upload/remover), nome, matrícula, status, datas
  └── PageBody
      └── Tabs (2 abas)
          ├── "Detalhes"
          │   ├── Card "Informações Pessoais"    # Foto com upload inline, nome, CPF, status
          │   ├── Card "Informações Profissionais" # Cargo, departamento, empresa, admissão, tempo de casa, salário
          │   ├── Card "Informações Contratuais"  # Tipo de contrato, regime, horas semanais, desligamento
          │   └── Card "Usuário do Sistema"       # Vínculo com usuário (exibe email/nome ou botão "Criar Usuário")
          └── "Documentos"
              └── FileManager (entityType="employee", entityId)
```

A funcionalidade de "Criar Usuário" abre um `Dialog` com formulário de email, senha e seleção de grupo de permissão. A foto aceita upload com recorte via `PhotoUploadDialog` (multipart para `POST /v1/hr/employees/:id/photo`).

#### `/hr/companies/[id]` — Detalhe de Empresa (somente leitura)

> **Nota:** O CRUD completo de empresas foi migrado para `/admin/companies`. A visualização em HR é somente leitura.

```
CompanyDetailPage (read-only)
  ├── PageHeader
  │   ├── PageActionBar             # Breadcrumb (sem botões de edição/exclusão)
  │   └── Identity Card             # Ícone, razão social, nome fantasia, status, datas
  └── PageBody
      └── Dados cadastrais da empresa (somente leitura)
```

Para CRUD completo com edição, abas de subrecursos e importação, ver `/admin/companies/[id]`.

---

## Types

Todos os tipos de HR estão em `src/types/hr/` com barrel re-export via `src/types/hr/index.ts`.

### employee.types.ts

| Interface/Type              | Descrição                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ContractType`              | `'CLT' \| 'PJ' \| 'INTERN' \| 'TEMPORARY' \| 'APPRENTICE'`                                                                                                              |
| `WorkRegime`                | `'FULL_TIME' \| 'PART_TIME' \| 'HOURLY' \| 'SHIFT' \| 'FLEXIBLE'`                                                                                                       |
| `EmergencyContactInfo`      | `{ name?, phone?, relationship? }` — contato de emergência estruturado                                                                                                  |
| `HealthCondition`           | `{ description, requiresAttention }` — condição de saúde registrada                                                                                                     |
| `Employee`                  | Entidade completa: dados pessoais, profissionais, documentos (RG, PIS, CTPS, título de eleitor, documento militar), contato, endereço, dados bancários, foto, metadados |
| `CreateEmployeeData`        | Criação com campos obrigatórios: `registrationNumber`, `fullName`, `cpf`, `hireDate`, `baseSalary`, `contractType`, `workRegime`, `weeklyHours`                         |
| `UpdateEmployeeData`        | Atualização parcial (todos os campos opcionais)                                                                                                                         |
| `EmployeeLabelData`         | Dados completos para impressão de etiqueta (funcionário + departamento + cargo + empresa + tenant)                                                                      |
| `EmployeeLabelDataResponse` | `{ labelData: EmployeeLabelData[] }`                                                                                                                                    |

### department.types.ts

| Interface/Type         | Descrição                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Department`           | Departamento com hierarquia: `parentId` (sub-departamento), `managerId`, `_count` (posições e funcionários), relações expandidas |
| `CreateDepartmentData` | Campos obrigatórios: `name`, `code`, `companyId`                                                                                 |
| `UpdateDepartmentData` | Atualização parcial                                                                                                              |
| `Position`             | Cargo com faixa salarial (`minSalary`, `maxSalary`, `baseSalary`), `level`, vínculo com departamento, `_count` de funcionários   |
| `CreatePositionData`   | Campos obrigatórios: `name`, `code`                                                                                              |
| `UpdatePositionData`   | Atualização parcial                                                                                                              |

### company.types.ts (migrado para `src/types/admin/company.types.ts`)

> **Nota:** Os tipos de empresa foram migrados para o módulo Admin. Importar via `import type { Company } from '@/types/admin'`.

| Interface/Type                            | Descrição                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `CompanyStatus`                           | `'ACTIVE' \| 'INACTIVE' \| 'SUSPENDED'`                                                           |
| `TaxRegime`                               | `'SIMPLES' \| 'LUCRO_PRESUMIDO' \| 'LUCRO_REAL' \| 'IMUNE_ISENTA' \| 'OUTROS'`                    |
| `Company`                                 | Empresa com dados fiscais (CNPJ, IE, IM, regime tributário), contato, logo, pendências e relações |
| `CreateCompanyData` / `UpdateCompanyData` | CRUD da empresa principal                                                                         |
| `CompanyAddressType`                      | `'FISCAL' \| 'DELIVERY' \| 'BILLING' \| 'OTHER'`                                                  |
| `CompanyAddress`                          | Endereço com código IBGE, marcação de principal (`isPrimary`)                                     |
| `CompanyCnae`                             | CNAE com código, descrição e marcação de primário                                                 |
| `CompanyFiscalSettings`                   | Configurações NF-e/NFC-e: ambiente, série, último número, certificado A1/A3, CSC para NFC-e       |
| `CompanyStakeholder`                      | Sócio/representante legal com datas de entrada/saída e fonte (API CNPJ ou manual)                 |

### work-schedule.types.ts

| Interface/Type           | Descrição                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `WorkSchedule`           | Escala com horários por dia da semana (`{day}Start`, `{day}End` em formato HH:mm), `breakDuration` em minutos, `weeklyHours` calculado |
| `CreateWorkScheduleData` | Horários de segunda a domingo (todos opcionais para turnos parciais)                                                                   |
| `UpdateWorkScheduleData` | `Partial<CreateWorkScheduleData>`                                                                                                      |

### time-entry.types.ts

| Interface/Type        | Descrição                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| `TimeEntryType`       | `'CLOCK_IN' \| 'CLOCK_OUT' \| 'BREAK_START' \| 'BREAK_END' \| 'OVERTIME_START' \| 'OVERTIME_END'`         |
| `TimeEntry`           | Registro de ponto com geolocalização opcional (`latitude`, `longitude`) e endereço IP                     |
| `ClockInOutData`      | Dados para bater ponto: `employeeId`, `timestamp?`, `latitude?`, `longitude?`, `notes?`                   |
| `WorkedHoursResponse` | Resposta do cálculo de horas: `dailyBreakdown[]` com `workedHours`, `breakHours`, `overtimeHours` por dia |

### time-bank.types.ts

| Interface/Type            | Descrição                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `TimeBank`                | Banco de horas: `balance` (total em horas), `year`, indicadores `hasPositiveBalance` e `hasNegativeBalance` |
| `CreditDebitTimeBankData` | Crédito ou débito: `employeeId`, `hours`, `year?`                                                           |
| `AdjustTimeBankData`      | Ajuste de saldo: `employeeId`, `newBalance`, `year?`                                                        |

### overtime.types.ts

| Interface/Type        | Descrição                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Overtime`            | Hora extra com `date`, `hours`, `reason`, `approved` (null = pendente, true = aprovado, false = rejeitado), `approvedBy` |
| `CreateOvertimeData`  | `employeeId`, `date`, `hours`, `reason`                                                                                  |
| `ApproveOvertimeData` | `{ addToTimeBank?: boolean }` — ao aprovar, pode creditar no banco de horas                                              |

### vacation-period.types.ts

| Interface/Type         | Descrição                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `VacationStatus`       | `'PENDING' \| 'AVAILABLE' \| 'SCHEDULED' \| 'IN_PROGRESS' \| 'COMPLETED' \| 'EXPIRED' \| 'SOLD'`                   |
| `VacationPeriod`       | Período aquisitivo com datas de aquisição/concessão, totais (`totalDays`, `usedDays`, `soldDays`, `remainingDays`) |
| `ScheduleVacationData` | Agendamento: `startDate`, `endDate`, `days`                                                                        |
| `SellVacationDaysData` | Venda de dias: `{ daysToSell: number }`                                                                            |
| `VacationBalance`      | Saldo consolidado por funcionário com todos os períodos (`VacationBalancePeriod[]`)                                |

### absence.types.ts

| Interface/Type               | Descrição                                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AbsenceType`                | 11 tipos: `VACATION`, `SICK_LEAVE`, `PERSONAL_LEAVE`, `MATERNITY_LEAVE`, `PATERNITY_LEAVE`, `BEREAVEMENT_LEAVE`, `WEDDING_LEAVE`, `MEDICAL_APPOINTMENT`, `JURY_DUTY`, `UNPAID_LEAVE`, `OTHER` |
| `AbsenceStatus`              | `'PENDING' \| 'APPROVED' \| 'REJECTED' \| 'CANCELLED' \| 'IN_PROGRESS' \| 'COMPLETED'`                                                                                                        |
| `Absence`                    | Ausência com `cid` (para atestados médicos), `documentUrl`, `isPaid`, campos de aprovação/rejeição                                                                                            |
| `RequestVacationAbsenceData` | Requisição de férias vinculada a um `vacationPeriodId`                                                                                                                                        |
| `RequestSickLeaveData`       | Atestado médico: exige `cid` e `reason` obrigatórios                                                                                                                                          |
| `RejectAbsenceData`          | `{ reason: string }` — motivo de rejeição obrigatório                                                                                                                                         |

### payroll.types.ts

| Interface/Type      | Descrição                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PayrollStatus`     | `'DRAFT' \| 'PROCESSING' \| 'CALCULATED' \| 'APPROVED' \| 'PAID' \| 'CANCELLED'`                                                                                                                                               |
| `PayrollItemType`   | 23 tipos de verbas: salário base, horas extras, adicional noturno, insalubridade, periculosidade, bônus, comissão, férias, 13º, PLR, VT, VR, plano de saúde/dental, INSS, IRRF, FGTS, contribuição sindical, deduções diversas |
| `Payroll`           | Folha de pagamento referenciada por mês/ano com totais (`totalGross`, `totalDeductions`, `totalNet`) e rastreabilidade (processedBy, approvedBy, paidBy)                                                                       |
| `PayrollItem`       | Item da folha vinculado a funcionário, com flag `isDeduction` e referência opcional (`referenceId`, `referenceType`)                                                                                                           |
| `CreatePayrollData` | `{ referenceMonth: number, referenceYear: number }`                                                                                                                                                                            |

### bonus.types.ts e deduction.types.ts

| Interface/Type        | Descrição                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Bonus`               | Bonificação avulsa: `name`, `amount`, `reason`, `date`, `isPaid`                                                |
| `CreateBonusData`     | Campos obrigatórios: `employeeId`, `name`, `amount`, `reason`, `date`                                           |
| `Deduction`           | Dedução com suporte a parcelamento (`installments`, `currentInstallment`), flag `isRecurring` e `isApplied`     |
| `CreateDeductionData` | Campos obrigatórios: `employeeId`, `name`, `amount`, `reason`, `date`; opcionais: `isRecurring`, `installments` |

### Sincronização com Backend

| Arquivo                    | Backend Schema              | Sincronizado?                         |
| -------------------------- | --------------------------- | ------------------------------------- |
| `employee.types.ts`        | `employee.schema.ts`        | Sim                                   |
| `department.types.ts`      | `department.schema.ts`      | Sim                                   |
| `company.types.ts`         | `company.schema.ts`         | Sim (migrado para `src/types/admin/`) |
| `work-schedule.types.ts`   | `work-schedule.schema.ts`   | Sim                                   |
| `time-entry.types.ts`      | `time-entry.schema.ts`      | Sim                                   |
| `time-bank.types.ts`       | `time-bank.schema.ts`       | Sim                                   |
| `overtime.types.ts`        | `overtime.schema.ts`        | Sim                                   |
| `vacation-period.types.ts` | `vacation-period.schema.ts` | Sim                                   |
| `absence.types.ts`         | `absence.schema.ts`         | Sim                                   |
| `payroll.types.ts`         | `payroll.schema.ts`         | Sim                                   |
| `bonus.types.ts`           | `bonus.schema.ts`           | Sim                                   |
| `deduction.types.ts`       | `deduction.schema.ts`       | Sim                                   |

---

## Hooks

O módulo de HR não possui um diretório `src/hooks/hr/`. Os hooks são implementados diretamente nos componentes de página com `useQuery` e `useMutation` do TanStack Query, consumindo os services de `src/services/hr/`. Há dois hooks compartilhados externos ao módulo:

### Hooks Globais Relacionados ao HR

| Hook                  | Arquivo                                                              | Propósito                                                             | Query Key                          |
| --------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `useEmployeeMap(ids)` | `src/hooks/use-employee-map.ts`                                      | Resolve IDs de funcionários para nomes de exibição via endpoint batch | `['employees', 'label-data', ids]` |
| `useHRAnalytics()`    | `src/app/(dashboard)/(modules)/hr/_shared/hooks/use-hr-analytics.ts` | Agrega dados de 6 endpoints em paralelo para o dashboard analítico    | `['hr', 'analytics']`              |

**`useEmployeeMap(employeeIds: string[])`**

- Deduplica os IDs antes de buscar (usa `Set + sort`)
- Chama `employeesService.getLabelData(uniqueIds)` — endpoint de batch para evitar N+1
- `staleTime: 5 min` — nomes de funcionários raramente mudam durante uma sessão
- Retorna `{ employeeMap: Map<id, fullName>, getName(id), isLoading }`

**`useHRAnalytics()`**

- Chama 6 services em `Promise.allSettled()`: employees, overtime, absences, payrolls, bonuses, deductions (todos com `perPage: 100`)
- Toda a agregação é feita no cliente (sem endpoint analytics dedicado no back-end)
- `staleTime: 5 min`, `refetchOnWindowFocus: false`
- Retorna `HRAnalyticsData` com KPIs e séries temporais dos últimos 6 meses

---

## Components

### Componentes Compartilhados (`_shared/components/`)

| Componente           | Responsabilidade                                                                                  | Usado em                                      |
| -------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `HRSelectionToolbar` | Barra de seleção em lote: exibe contagem, botões de exclusão e exportação para itens selecionados | Listas de funcionários, departamentos, cargos |

O `HRSelectionToolbar` utiliza `useSelectionContext()` do core e delega para o `SelectionToolbar` genérico. Só é renderizado quando há itens selecionados (`selectedIds.length === 0` retorna `null`).

### Componentes de Empresa (migrados para Admin)

> **Nota:** Os componentes de empresa com CRUD completo foram migrados para o módulo Admin em `admin/(entities)/companies/`. O módulo HR mantém apenas uma visualização somente leitura de empresas.

### Componentes de Funcionário

| Modal                   | Responsabilidade                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `CreateModal`           | Criação de novo funcionário com dados obrigatórios (matrícula, CPF, admissão, salário, contrato) |
| `EditModal`             | Edição completa do funcionário                                                                   |
| `ViewModal`             | Visualização rápida                                                                              |
| `DeleteConfirmModal`    | Confirmação de exclusão com soft delete                                                          |
| `DuplicateConfirmModal` | Confirmação de duplicação                                                                        |

A página de detalhe (`[id]/page.tsx`) gerencia inline:

- Upload de foto com recorte (`PhotoUploadDialog` + crop coordinates enviados ao backend)
- Criação de usuário do sistema vinculado ao funcionário (Dialog com email, senha, grupo de permissão)
- FileManager para documentos do funcionário

### Componentes de Ausências, Férias, Horas Extras e Folha

| Módulo           | Modais disponíveis                                                                     |
| ---------------- | -------------------------------------------------------------------------------------- |
| `absences`       | `ViewModal`, `RequestSickLeaveModal`, `RejectModal`                                    |
| `vacations`      | `ViewModal`, `CreateModal`, `ScheduleModal`, `SellDaysModal`                           |
| `overtime`       | `ViewModal`, `CreateModal`, `ApproveModal`                                             |
| `time-control`   | `ClockInModal`, `ClockOutModal`, `CalculateHoursModal`, `ViewEntryModal`               |
| `time-bank`      | `ViewModal`, `CreditModal`, `DebitModal`, `AdjustModal`                                |
| `payroll`        | `ViewModal`, `CreateModal`                                                             |
| `bonuses`        | `ViewModal`, `CreateModal`, `DeleteConfirmModal`                                       |
| `deductions`     | `ViewModal`, `CreateModal`, `DeleteConfirmModal`                                       |
| `departments`    | `ViewModal`, `CreateModal`, `EditModal`, `DeleteConfirmModal`, `DuplicateConfirmModal` |
| `positions`      | `ViewModal`, `EditModal`, `CreateModal`, `DeleteConfirmModal`, `DuplicateConfirmModal` |
| `work-schedules` | `ViewModal`, `CreateModal`, `EditModal`, `DeleteConfirmModal`, `DuplicateConfirmModal` |

---

## API Integration

O módulo se comunica com o backend exclusivamente via services em `src/services/hr/`. Todos os services utilizam `apiClient` de `src/lib/api-client.ts`, que injeta automaticamente o JWT de tenant em cada requisição.

### Services e Endpoints

| Service                | Arquivo                               | Base Path                 | Operações Principais                                                                       |
| ---------------------- | ------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| `employeesService`     | `employees.service.ts`                | `/v1/hr/employees`        | CRUD + upload de foto (multipart) + create-user + link-user + unlink-user + label-data     |
| `companiesService`     | `services/admin/companies.service.ts` | `/v1/admin/companies`     | CRUD migrado para Admin; HR consome via `hr.companies.read` (somente leitura)              |
| `departmentsService`   | `departments.service.ts`              | `/v1/hr/departments`      | CRUD com populate=company                                                                  |
| `positionsService`     | `positions.service.ts`                | `/v1/hr/positions`        | CRUD                                                                                       |
| `workSchedulesService` | `work-schedules.service.ts`           | `/v1/hr/work-schedules`   | CRUD                                                                                       |
| `timeControlService`   | `time-control.service.ts`             | `/v1/hr/time-control`     | clock-in, clock-out, calculate-hours, list entries                                         |
| `timeBankService`      | `time-bank.service.ts`                | `/v1/hr/time-bank`        | credit, debit, adjust, getByEmployee, list                                                 |
| `overtimeService`      | `overtime.service.ts`                 | `/v1/hr/overtime`         | create, approve, get, list                                                                 |
| `vacationsService`     | `vacations.service.ts`                | `/v1/hr/vacation-periods` | create, schedule, start, complete, sellDays, cancelSchedule, get, list, getVacationBalance |
| `absencesService`      | `absences.service.ts`                 | `/v1/hr/absences`         | requestVacation, requestSickLeave, approve, reject, cancel, get, list                      |
| `payrollService`       | `payroll.service.ts`                  | `/v1/hr/payrolls`         | create, calculate, approve, pay, cancel, get, list                                         |
| `bonusesService`       | `bonuses.service.ts`                  | `/v1/hr/bonuses`          | create, get, list, delete                                                                  |
| `deductionsService`    | `deductions.service.ts`               | `/v1/hr/deductions`       | create, get, list, delete                                                                  |

#### Detalhes de Endpoints Relevantes

**Funcionários — Endpoints especiais:**

- `POST /v1/hr/employees-with-user` — Cria funcionário e usuário do sistema em uma única operação
- `POST /v1/hr/employees/:id/create-user` — Cria usuário vinculado a funcionário já existente
- `POST /v1/hr/employees/:id/link-user` — Vincula usuário existente ao funcionário
- `POST /v1/hr/employees/:id/unlink-user` — Desvincula usuário do funcionário
- `POST /v1/hr/employees/:id/photo` — Upload de foto com dados de recorte (multipart: `file`, `cropX`, `cropY`, `cropWidth`, `cropHeight`)
- `DELETE /v1/hr/employees/:id/photo` — Remove a foto do funcionário
- `POST /v1/hr/employees/label-data` — Busca batch de dados para etiquetas (`{ employeeIds: string[] }`)
- `GET /v1/hr/employees/by-user/:userId` — Busca funcionário pelo ID do usuário do sistema
- `GET /v1/hr/employees/:id?populate=department,position,company` — Detalhe com relações expandidas

**Empresas — Migrado para Admin:**

- CRUD completo e sub-recursos agora em `/v1/admin/companies` (ver módulo Admin)
- HR mantém apenas `GET /v1/hr/companies` e `GET /v1/hr/companies/:id` (somente leitura)

**Férias:**

- `PATCH /v1/hr/vacation-periods/:id/schedule` — Agenda o início das férias
- `PATCH /v1/hr/vacation-periods/:id/start` — Inicia as férias
- `PATCH /v1/hr/vacation-periods/:id/complete` — Conclui as férias com `daysUsed`
- `PATCH /v1/hr/vacation-periods/:id/sell` — Vende dias de férias (`daysToSell`)
- `PATCH /v1/hr/vacation-periods/:id/cancel-schedule` — Cancela o agendamento
- `GET /v1/hr/employees/:id/vacation-balance` — Saldo consolidado de férias do funcionário

**Banco de Horas:**

- `POST /v1/hr/time-bank/credit` — Credita horas
- `POST /v1/hr/time-bank/debit` — Debita horas
- `POST /v1/hr/time-bank/adjust` — Ajuste manual de saldo para um valor específico
- `GET /v1/hr/time-bank/:employeeId?year=YYYY` — Saldo por funcionário e ano

**Folha de Pagamento — Ciclo de vida:**

- `POST /v1/hr/payrolls` — Cria folha (`referenceMonth`, `referenceYear`)
- `POST /v1/hr/payrolls/:id/calculate` — Calcula verbas e deduções (gera `PayrollItem[]`)
- `POST /v1/hr/payrolls/:id/approve` — Aprova a folha calculada
- `POST /v1/hr/payrolls/:id/pay` — Marca como paga
- `POST /v1/hr/payrolls/:id/cancel` — Cancela

---

## State Management

- **Contextos:** O módulo não possui contextos próprios. Utiliza `TenantContext` para o tenant atual e `AuthContext` para permissões via `usePermissions()`.
- **URL State:** As páginas de lista usam query params para filtros simples (ex: `?companyId=` na lista de departamentos e funcionários, para navegação da página de detalhe de empresa).
- **React Query Keys:** Definidos localmente em cada página, seguindo o padrão `['employees', id]`, `['companies', id]`, `['companies', id, 'addresses']` etc.
- **useState local:** Cada página de detalhe gerencia a aba ativa (`activeTab`) e estados de modais localmente.
- **Print Queue:** A página de detalhe do funcionário integra-se ao `usePrintQueue()` do core para adicionar funcionários à fila de impressão de etiquetas (`entityType: 'employee'`).

---

## Import/Export

O módulo oferece importação em lote via planilha CSV ou XLSX para as 4 entidades principais de cadastro, acessível em `/import/hr/`:

| Entidade      | Rota                      | Componente Base                                                             |
| ------------- | ------------------------- | --------------------------------------------------------------------------- |
| Funcionários  | `/import/hr/employees`    | `EntityImportPage` (entityType="employees")                                 |
| Departamentos | `/import/hr/departments`  | `EntityImportPage` (entityType="departments") + rotas `config/` e `sheets/` |
| Cargos        | `/import/hr/positions`    | `EntityImportPage` (entityType="positions") + rotas `config/` e `sheets/`   |
| Empresas      | `/import/admin/companies` | `EntityImportPage` (entityType="companies") — migrado para Admin            |

Todas as importações utilizam o componente genérico `EntityImportPage` do módulo de importações compartilhado em `(dashboard)/(actions)/import/_shared/`. O fluxo padrão é: Upload de arquivo → Configuração de campos (mapeamento de colunas) → Execução com barra de progresso.

---

## User Flows

### Flow 1: Admitir um Novo Funcionário

1. Usuário acessa `/hr/employees`
2. Clica em "Novo Funcionário" — `CreateModal` abre
3. Preenche matrícula, nome completo, CPF, data de admissão, salário base, tipo de contrato e regime de trabalho (campos obrigatórios)
4. Opcionalmente seleciona empresa, departamento, cargo e supervisor
5. Submit chama `POST /v1/hr/employees`
6. Toast de sucesso; usuário é redirecionado para `/hr/employees/[id]`
7. Na página de detalhe, clica em "Criar Usuário" para dar acesso ao sistema
8. Preenche email, senha e seleciona grupo de permissão
9. Submit chama `POST /v1/hr/employees/:id/create-user`
10. Funcionário aparece vinculado ao usuário do sistema

### Flow 2: Registrar e Aprovar Hora Extra

1. Usuário acessa `/hr/overtime`
2. Clica em "Nova Hora Extra" — `CreateModal` abre com seletor de funcionário, data e quantidade de horas
3. Submit chama `POST /v1/hr/overtime`
4. Hora extra criada com `approved: null` (pendente)
5. Aprovador acessa a lista, filtra por pendentes e abre a hora extra
6. Clica em "Aprovar" — `ApproveModal` pergunta se deve creditar no banco de horas
7. Submit chama `POST /v1/hr/overtime/:id/approve` com `{ addToTimeBank: true }`
8. Se `addToTimeBank: true`, o backend chama `POST /v1/hr/time-bank/credit` automaticamente
9. Hora extra aparece como aprovada; banco de horas do funcionário é atualizado

### Flow 3: Agendar e Aprovar Férias

1. Gestor acessa `/hr/vacations`
2. Clica em "Nova Período" — `CreateModal` define datas de aquisição e concessão para um funcionário
3. Submit chama `POST /v1/hr/vacation-periods` — período criado com status `PENDING`
4. Período muda para `AVAILABLE` após validação
5. Gestor abre o período e clica em "Agendar" — `ScheduleModal` pede `startDate`, `endDate` e `days`
6. Submit chama `PATCH /v1/hr/vacation-periods/:id/schedule` — status muda para `SCHEDULED`
7. Na data de início, chama `PATCH /v1/hr/vacation-periods/:id/start` — status muda para `IN_PROGRESS`
8. Ao retorno, chama `PATCH /v1/hr/vacation-periods/:id/complete` com `daysUsed`
9. Status muda para `COMPLETED`; `usedDays` e `remainingDays` atualizados

### Flow 4: Processar Folha de Pagamento

1. Usuário acessa `/hr/payroll`
2. Clica em "Nova Folha" — `CreateModal` pede mês e ano de referência
3. Submit chama `POST /v1/hr/payrolls` — folha criada com status `DRAFT`
4. Na página de detalhe, clica em "Calcular" — chama `POST /v1/hr/payrolls/:id/calculate`
5. Backend gera `PayrollItem[]` com todas as verbas e deduções; status muda para `CALCULATED`
6. Usuário revisa os itens calculados; clica em "Aprovar" — chama `POST /v1/hr/payrolls/:id/approve`
7. Status muda para `APPROVED`; botão "Pagar" fica disponível
8. Após pagamento, clica em "Marcar como Paga" — chama `POST /v1/hr/payrolls/:id/pay`
9. Status muda para `PAID`; rastreabilidade salva (`paidBy`, `paidAt`)

### Flow 5: Consultar Visão Geral do RH

1. Usuário acessa `/hr/overview`
2. `useHRAnalytics()` dispara `Promise.allSettled()` com 6 requisições paralelas
3. Enquanto carrega, KPI cards e gráficos exibem `Skeleton`
4. Após resolução, dados são agregados no cliente:
   - KPIs calculados (total de ativos, pendências, ausências ativas, folha do mês)
   - Série temporal dos últimos 6 meses para folha, horas extras e bonificações/deduções
   - Distribuições por departamento, tipo de contrato e tipo de ausência
5. Gráficos Recharts renderizam com tooltips em PT-BR e cores por índice

---

## Audit History

| Data       | Dimensão             | Score | Relatório                                                |
| ---------- | -------------------- | ----- | -------------------------------------------------------- |
| 2026-03-10 | Documentação inicial | —     | Criação da documentação completa do módulo HR (frontend) |
