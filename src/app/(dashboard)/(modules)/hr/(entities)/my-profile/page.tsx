/**
 * Employee Self-Service Portal - My Profile Page
 * Página de autoatendimento para o funcionário ver seus dados de RH
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import {
  dependantsService,
  employeesService,
  payrollService,
  timeBankService,
  timeControlService,
  vacationsService,
} from '@/services/hr';
import { storageFilesService } from '@/services/storage/files.service';
import type { Employee, EmployeeDependant, TimeEntry, VacationPeriod } from '@/types/hr';
import type { Payroll } from '@/types/hr';
import type { TimeBank } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  Hash,
  Heart,
  LogIn,
  LogOut,
  PalmtreeIcon,
  Timer,
  User,
  UserCircle,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSalary(salary: number | null | undefined): string {
  if (!salary) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(salary);
}

function formatCPF(cpf: string): string {
  if (!cpf) return '-';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function getCompanyTime(hireDate: string): string {
  const hire = new Date(hireDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - hire.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  if (years > 0) {
    return months > 0 ? `${years} anos e ${months} meses` : `${years} anos`;
  }
  if (months > 0) return `${months} meses`;
  return `${diffDays} dias`;
}

function getContractTypeLabel(ct: string): string {
  const labels: Record<string, string> = {
    CLT: 'CLT',
    PJ: 'Pessoa Jurídica',
    INTERN: 'Estagiário',
    TEMPORARY: 'Temporário',
    APPRENTICE: 'Aprendiz',
  };
  return labels[ct] || ct;
}

function getWorkRegimeLabel(wr: string): string {
  const labels: Record<string, string> = {
    FULL_TIME: 'Tempo Integral',
    PART_TIME: 'Meio Período',
    HOURLY: 'Por Hora',
    SHIFT: 'Turnos',
    FLEXIBLE: 'Flexível',
  };
  return labels[wr] || wr;
}

function getStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    ON_LEAVE: 'Em Licença',
    TERMINATED: 'Desligado',
  };
  return labels[status || ''] || status || 'Não definido';
}

function getStatusVariant(status?: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success' as const;
    case 'INACTIVE':
      return 'secondary' as const;
    case 'ON_LEAVE':
      return 'warning' as const;
    case 'TERMINATED':
      return 'destructive' as const;
    default:
      return 'default' as const;
  }
}

function getEntryTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CLOCK_IN: 'Entrada',
    CLOCK_OUT: 'Saída',
    BREAK_START: 'Início Intervalo',
    BREAK_END: 'Fim Intervalo',
    OVERTIME_START: 'Início Hora Extra',
    OVERTIME_END: 'Fim Hora Extra',
  };
  return labels[type] || type;
}

function getEntryTypeIcon(type: string) {
  switch (type) {
    case 'CLOCK_IN':
      return <LogIn className="h-4 w-4 text-emerald-500" />;
    case 'CLOCK_OUT':
      return <LogOut className="h-4 w-4 text-rose-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getVacationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    AVAILABLE: 'Disponível',
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
    EXPIRED: 'Expirada',
    SOLD: 'Vendida',
  };
  return labels[status] || status;
}

function getVacationStatusVariant(status: string) {
  switch (status) {
    case 'AVAILABLE':
      return 'success' as const;
    case 'SCHEDULED':
      return 'default' as const;
    case 'IN_PROGRESS':
      return 'warning' as const;
    case 'COMPLETED':
      return 'secondary' as const;
    case 'EXPIRED':
      return 'destructive' as const;
    case 'SOLD':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
}

function getRelationshipLabel(rel: string): string {
  const labels: Record<string, string> = {
    SPOUSE: 'Cônjuge',
    CHILD: 'Filho(a)',
    STEPCHILD: 'Enteado(a)',
    PARENT: 'Pai/Mãe',
    OTHER: 'Outro',
  };
  return labels[rel] || rel;
}

function getPayrollStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho',
    PROCESSING: 'Processando',
    CALCULATED: 'Calculada',
    APPROVED: 'Aprovada',
    PAID: 'Paga',
    CANCELLED: 'Cancelada',
  };
  return labels[status] || status;
}

function getPayrollStatusVariant(status: string) {
  switch (status) {
    case 'PAID':
      return 'success' as const;
    case 'APPROVED':
      return 'default' as const;
    case 'CALCULATED':
      return 'secondary' as const;
    case 'CANCELLED':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('summary');

  // Fetch employee record linked to the current user
  const {
    data: employee,
    isLoading: isLoadingEmployee,
    error: employeeError,
  } = useQuery<Employee>({
    queryKey: ['my-employee', user?.id],
    queryFn: async () => {
      const response = await employeesService.getEmployeeByUserId(user!.id);
      return response.employee;
    },
    enabled: !!user?.id,
  });

  // Photo URL resolver
  const photoDisplayUrl = useMemo(() => {
    if (!employee?.photoUrl) return null;
    const match = employee.photoUrl.match(
      /\/v1\/storage\/files\/([^/]+)\/serve/
    );
    if (!match) return null;
    return storageFilesService.getServeUrl(match[1]);
  }, [employee?.photoUrl]);

  // Time entries (last 30 days)
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { data: timeEntriesData, isLoading: isLoadingTimeEntries } = useQuery({
    queryKey: ['my-time-entries', employee?.id, thirtyDaysAgo],
    queryFn: async () => {
      const response = await timeControlService.listTimeEntries({
        employeeId: employee!.id,
        startDate: thirtyDaysAgo,
        endDate: today,
        perPage: 200,
      });
      return response.timeEntries;
    },
    enabled: !!employee?.id && activeTab === 'time',
  });

  // Worked hours calculation (current month)
  const monthStart = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const { data: workedHoursData } = useQuery({
    queryKey: ['my-worked-hours', employee?.id, monthStart],
    queryFn: async () => {
      const response = await timeControlService.calculateWorkedHours({
        employeeId: employee!.id,
        startDate: monthStart,
        endDate: today,
      });
      return response;
    },
    enabled: !!employee?.id && activeTab === 'time',
  });

  // Time bank balance
  const currentYear = new Date().getFullYear();
  const { data: timeBankData } = useQuery({
    queryKey: ['my-time-bank', employee?.id, currentYear],
    queryFn: async () => {
      const response = await timeBankService.getByEmployee(
        employee!.id,
        currentYear
      );
      return response.timeBank;
    },
    enabled: !!employee?.id && activeTab === 'time',
  });

  // Vacation periods
  const { data: vacationPeriodsData, isLoading: isLoadingVacations } =
    useQuery({
      queryKey: ['my-vacations', employee?.id],
      queryFn: async () => {
        const response = await vacationsService.list({
          employeeId: employee!.id,
          perPage: 50,
        });
        return response.vacationPeriods;
      },
      enabled: !!employee?.id && activeTab === 'vacations',
    });

  // Vacation balance
  const { data: vacationBalanceData } = useQuery({
    queryKey: ['my-vacation-balance', employee?.id],
    queryFn: async () => {
      return await vacationsService.getVacationBalance(employee!.id);
    },
    enabled: !!employee?.id && activeTab === 'vacations',
  });

  // Payrolls
  const { data: payrollsData, isLoading: isLoadingPayrolls } = useQuery({
    queryKey: ['my-payrolls', employee?.id],
    queryFn: async () => {
      const response = await payrollService.list({ perPage: 50 });
      return response.payrolls;
    },
    enabled: !!employee?.id && activeTab === 'payslips',
  });

  // Dependants
  const { data: dependantsData, isLoading: isLoadingDependants } = useQuery({
    queryKey: ['my-dependants', employee?.id],
    queryFn: async () => {
      const response = await dependantsService.list(employee!.id);
      return response.dependants;
    },
    enabled: !!employee?.id && activeTab === 'dependants',
  });

  // ============================================================================
  // TODAY'S PUNCHES
  // ============================================================================

  const todayPunches = useMemo(() => {
    if (!timeEntriesData) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    return timeEntriesData.filter((entry: TimeEntry) =>
      entry.timestamp.startsWith(todayStr)
    );
  }, [timeEntriesData]);

  // ============================================================================
  // LOADING
  // ============================================================================

  if (isLoadingEmployee) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Meu Perfil' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // No employee linked to user
  if (employeeError || !employee) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Meu Perfil' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Perfil não encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              Seu usuário ainda não está vinculado a um registro de funcionário.
              Entre em contato com o departamento de RH.
            </p>
            <Button onClick={() => router.push('/hr')}>
              Voltar para Recursos Humanos
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Meu Perfil' },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {photoDisplayUrl ? (
              <img
                src={photoDisplayUrl}
                alt={employee.fullName}
                className="h-14 w-14 rounded-xl shrink-0 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-violet-500 to-violet-600">
                <UserCircle className="h-7 w-7 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {employee.fullName}
                </h1>
                <Badge variant={getStatusVariant(employee.status)}>
                  {getStatusLabel(employee.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                {employee.position?.name && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {employee.position.name}
                  </span>
                )}
                {employee.department?.name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {employee.department.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Admissão: {formatDate(employee.hireDate)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4 p-2 h-12">
            <TabsTrigger value="summary" className="gap-2">
              <User className="h-4 w-4 hidden sm:inline" />
              <span>Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="gap-2">
              <Timer className="h-4 w-4 hidden sm:inline" />
              <span>Ponto</span>
            </TabsTrigger>
            <TabsTrigger value="vacations" className="gap-2">
              <PalmtreeIcon className="h-4 w-4 hidden sm:inline" />
              <span>Férias</span>
            </TabsTrigger>
            <TabsTrigger value="payslips" className="gap-2">
              <FileText className="h-4 w-4 hidden sm:inline" />
              <span>Holerites</span>
            </TabsTrigger>
            <TabsTrigger value="dependants" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              <span>Dependentes</span>
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* TAB: Resumo */}
          {/* ============================================================ */}
          <TabsContent value="summary" className="flex flex-col gap-6">
            {/* Informações Pessoais */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Informações Pessoais
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <InfoField
                  label="Nome Completo"
                  value={employee.fullName}
                  icon={<User className="h-4 w-4" />}
                />
                {employee.socialName && (
                  <InfoField
                    label="Nome Social"
                    value={employee.socialName}
                    icon={<User className="h-4 w-4" />}
                  />
                )}
                <InfoField
                  label="Matrícula"
                  value={employee.registrationNumber}
                  icon={<Hash className="h-4 w-4" />}
                />
                <InfoField
                  label="CPF"
                  value={formatCPF(employee.cpf)}
                  icon={<CreditCard className="h-4 w-4" />}
                />
                <InfoField
                  label="Data de Nascimento"
                  value={formatDate(employee.birthDate)}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <InfoField
                  label="Estado Civil"
                  value={employee.maritalStatus}
                />
                {employee.email && (
                  <InfoField label="E-mail Corporativo" value={employee.email} />
                )}
                {employee.phone && (
                  <InfoField label="Telefone" value={employee.phone} />
                )}
              </div>
            </Card>

            {/* Informações Profissionais */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Informações Profissionais
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <InfoField
                  label="Cargo"
                  value={employee.position?.name}
                  icon={<Briefcase className="h-4 w-4" />}
                />
                <InfoField
                  label="Departamento"
                  value={employee.department?.name}
                  icon={<Building2 className="h-4 w-4" />}
                />
                <InfoField
                  label="Empresa"
                  value={
                    employee.company?.tradeName ||
                    employee.company?.legalName ||
                    null
                  }
                />
                <InfoField
                  label="Data de Admissão"
                  value={formatDate(employee.hireDate)}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <InfoField
                  label="Tempo de Empresa"
                  value={getCompanyTime(employee.hireDate)}
                  icon={<Clock className="h-4 w-4" />}
                />
                <InfoField
                  label="Tipo de Contrato"
                  value={getContractTypeLabel(employee.contractType)}
                  icon={<FileText className="h-4 w-4" />}
                />
                <InfoField
                  label="Regime de Trabalho"
                  value={getWorkRegimeLabel(employee.workRegime)}
                />
                <InfoField
                  label="Horas Semanais"
                  value={`${employee.weeklyHours}h`}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>
            </Card>

            {/* Endereço */}
            {employee.address && (
              <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                <h3 className="text-lg uppercase font-semibold mb-4">
                  Endereço
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <InfoField
                    label="Logradouro"
                    value={`${employee.address}${employee.addressNumber ? `, ${employee.addressNumber}` : ''}`}
                  />
                  {employee.complement && (
                    <InfoField
                      label="Complemento"
                      value={employee.complement}
                    />
                  )}
                  <InfoField label="Bairro" value={employee.neighborhood} />
                  <InfoField
                    label="Cidade/UF"
                    value={
                      employee.city && employee.state
                        ? `${employee.city} - ${employee.state}`
                        : employee.city || employee.state
                    }
                  />
                  <InfoField label="CEP" value={employee.zipCode} />
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Ponto */}
          {/* ============================================================ */}
          <TabsContent value="time" className="flex flex-col gap-6">
            {/* Resumo Mensal */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Horas Trabalhadas (mês)
                    </p>
                    <p className="text-lg font-semibold">
                      {workedHoursData
                        ? `${workedHoursData.totalWorkedHours.toFixed(1)}h`
                        : '-'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <Timer className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Horas Extras (mês)
                    </p>
                    <p className="text-lg font-semibold">
                      {workedHoursData
                        ? `${workedHoursData.totalOvertimeHours.toFixed(1)}h`
                        : '-'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                    <CalendarDays className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Horas Líquidas (mês)
                    </p>
                    <p className="text-lg font-semibold">
                      {workedHoursData
                        ? `${workedHoursData.totalNetHours.toFixed(1)}h`
                        : '-'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <Timer className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Banco de Horas
                    </p>
                    <p className="text-lg font-semibold">
                      {timeBankData ? `${timeBankData.balance.toFixed(1)}h` : '-'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Registros de Hoje */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Registros de Hoje
              </h3>
              {todayPunches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum registro de ponto hoje</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {todayPunches.map((entry: TimeEntry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white dark:bg-slate-800/60 border-border"
                    >
                      {getEntryTypeIcon(entry.entryType)}
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {getEntryTypeLabel(entry.entryType)}
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(entry.timestamp).toLocaleTimeString(
                            'pt-BR',
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Últimos 30 dias */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Últimos 30 Dias
              </h3>
              {isLoadingTimeEntries ? (
                <GridLoading count={5} layout="list" size="sm" />
              ) : !timeEntriesData || timeEntriesData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum registro encontrado nos últimos 30 dias</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Data/Hora</th>
                        <th className="pb-2 font-medium">Tipo</th>
                        <th className="pb-2 font-medium">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {timeEntriesData
                        .slice()
                        .sort(
                          (a: TimeEntry, b: TimeEntry) =>
                            new Date(b.timestamp).getTime() -
                            new Date(a.timestamp).getTime()
                        )
                        .slice(0, 50)
                        .map((entry: TimeEntry) => (
                          <tr key={entry.id} className="hover:bg-muted/50">
                            <td className="py-2.5">
                              {formatDateTime(entry.timestamp)}
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                {getEntryTypeIcon(entry.entryType)}
                                {getEntryTypeLabel(entry.entryType)}
                              </div>
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {entry.notes || '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Férias */}
          {/* ============================================================ */}
          <TabsContent value="vacations" className="flex flex-col gap-6">
            {/* Saldo de Férias */}
            {vacationBalanceData && (
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <PalmtreeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Dias Disponíveis
                      </p>
                      <p className="text-lg font-semibold">
                        {vacationBalanceData.totalAvailableDays} dias
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                      <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Dias Usufruídos
                      </p>
                      <p className="text-lg font-semibold">
                        {vacationBalanceData.totalUsedDays} dias
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Dias Vendidos
                      </p>
                      <p className="text-lg font-semibold">
                        {vacationBalanceData.totalSoldDays} dias
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Períodos de Férias */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Períodos de Férias
              </h3>
              {isLoadingVacations ? (
                <GridLoading count={3} layout="list" size="sm" />
              ) : !vacationPeriodsData || vacationPeriodsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PalmtreeIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum período de férias registrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vacationPeriodsData.map((period: VacationPeriod) => (
                    <div
                      key={period.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-white dark:bg-slate-800/60 border-border gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={getVacationStatusVariant(period.status)}
                          >
                            {getVacationStatusLabel(period.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Aquisitivo: {formatDate(period.acquisitionStart)} a{' '}
                          {formatDate(period.acquisitionEnd)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Concessivo: {formatDate(period.concessionStart)} a{' '}
                          {formatDate(period.concessionEnd)}
                        </p>
                        {period.scheduledStart && period.scheduledEnd && (
                          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                            Agendada: {formatDate(period.scheduledStart)} a{' '}
                            {formatDate(period.scheduledEnd)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm shrink-0">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Total</p>
                          <p className="font-semibold">{period.totalDays}d</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Usados</p>
                          <p className="font-semibold">{period.usedDays}d</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">
                            Restantes
                          </p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {period.remainingDays}d
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Holerites */}
          {/* ============================================================ */}
          <TabsContent value="payslips" className="flex flex-col gap-6">
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Folhas de Pagamento
              </h3>
              {isLoadingPayrolls ? (
                <GridLoading count={3} layout="list" size="sm" />
              ) : !payrollsData || payrollsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma folha de pagamento disponível</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payrollsData
                    .slice()
                    .sort(
                      (a: Payroll, b: Payroll) =>
                        b.referenceYear * 100 +
                        b.referenceMonth -
                        (a.referenceYear * 100 + a.referenceMonth)
                    )
                    .map((payroll: Payroll) => (
                      <div
                        key={payroll.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-white dark:bg-slate-800/60 border-border gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                            <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {MONTH_NAMES[payroll.referenceMonth - 1]}{' '}
                              {payroll.referenceYear}
                            </p>
                            <Badge
                              variant={getPayrollStatusVariant(payroll.status)}
                              className="mt-0.5"
                            >
                              {getPayrollStatusLabel(payroll.status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-6 text-sm shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Bruto
                            </p>
                            <p className="font-medium">
                              {formatSalary(payroll.totalGross)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Descontos
                            </p>
                            <p className="font-medium text-rose-600 dark:text-rose-400">
                              {formatSalary(payroll.totalDeductions)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Líquido
                            </p>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatSalary(payroll.totalNet)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Dependentes */}
          {/* ============================================================ */}
          <TabsContent value="dependants" className="flex flex-col gap-6">
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Dependentes
              </h3>
              {isLoadingDependants ? (
                <GridLoading count={3} layout="list" size="sm" />
              ) : !dependantsData || dependantsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dependente cadastrado</p>
                  <p className="text-xs mt-1">
                    Entre em contato com o RH para cadastrar seus dependentes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dependantsData.map((dep: EmployeeDependant) => (
                    <div
                      key={dep.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-white dark:bg-slate-800/60 border-border gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                          <Heart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <p className="font-medium">{dep.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getRelationshipLabel(dep.relationship)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Nascimento
                          </p>
                          <p>{formatDate(dep.birthDate)}</p>
                        </div>
                        <div className="flex gap-2">
                          {dep.isIrrfDependant && (
                            <Badge variant="outline" className="text-xs">
                              IRRF
                            </Badge>
                          )}
                          {dep.isSalarioFamilia && (
                            <Badge variant="outline" className="text-xs">
                              Salário Família
                            </Badge>
                          )}
                          {dep.hasDisability && (
                            <Badge variant="outline" className="text-xs">
                              PcD
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
