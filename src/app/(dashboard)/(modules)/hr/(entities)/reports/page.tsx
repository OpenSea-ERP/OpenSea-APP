/**
 * OpenSea OS - HR Reports Page
 * Página de relatórios e exportações do módulo de RH
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Header } from '@/components/layout/header';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '../../_shared/constants/hr-permissions';
import { hrReportsService } from '@/services/hr';
import { toast } from 'sonner';
import {
  Users,
  UserX,
  DollarSign,
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

// =============================================================================
// CONSTANTS
// =============================================================================

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
] as const;

const EMPLOYEE_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'ON_LEAVE', label: 'Afastado' },
  { value: 'TERMINATED', label: 'Desligado' },
] as const;

const ABSENCE_TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'SICK_LEAVE', label: 'Licença Médica' },
  { value: 'PERSONAL', label: 'Pessoal' },
  { value: 'VACATION', label: 'Férias' },
  { value: 'MATERNITY', label: 'Licença Maternidade' },
  { value: 'PATERNITY', label: 'Licença Paternidade' },
  { value: 'BEREAVEMENT', label: 'Falecimento' },
  { value: 'OTHER', label: 'Outro' },
] as const;

const ABSENCE_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'REJECTED', label: 'Rejeitado' },
  { value: 'CANCELLED', label: 'Cancelado' },
] as const;

// =============================================================================
// HELPERS
// =============================================================================

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

// =============================================================================
// PAGE
// =============================================================================

export default function HRReportsPage() {
  const { hasPermission } = usePermissions();

  const canViewReports = hasPermission(HR_PERMISSIONS.REPORTS.VIEW);
  const canExport = hasPermission(HR_PERMISSIONS.REPORTS.EXPORT);

  // CSV export permissions also check specific entity permissions
  const canExportEmployees =
    canExport || hasPermission(HR_PERMISSIONS.EMPLOYEES.EXPORT);
  const canExportPayroll =
    canExport || hasPermission(HR_PERMISSIONS.PAYROLL.EXPORT);

  // ============================================================================
  // EMPLOYEES EXPORT STATE
  // ============================================================================

  const [employeesStatus, setEmployeesStatus] = useState('__all__');
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // ============================================================================
  // ABSENCES EXPORT STATE
  // ============================================================================

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [absencesStartDate, setAbsencesStartDate] = useState(
    formatDateForInput(thirtyDaysAgo)
  );
  const [absencesEndDate, setAbsencesEndDate] = useState(
    formatDateForInput(today)
  );
  const [absencesType, setAbsencesType] = useState('__all__');
  const [absencesStatus, setAbsencesStatus] = useState('__all__');
  const [absencesLoading, setAbsencesLoading] = useState(false);

  // ============================================================================
  // PAYROLL EXPORT STATE
  // ============================================================================

  const [payrollMonth, setPayrollMonth] = useState(String(getCurrentMonth()));
  const [payrollYear, setPayrollYear] = useState(String(getCurrentYear()));
  const [payrollLoading, setPayrollLoading] = useState(false);

  // ============================================================================
  // COMPLIANCE REPORTS STATE
  // ============================================================================

  const [raisYear, setRaisYear] = useState(String(getCurrentYear()));
  const [raisLoading, setRaisLoading] = useState(false);

  const [dirfYear, setDirfYear] = useState(String(getCurrentYear()));
  const [dirfLoading, setDirfLoading] = useState(false);

  const [sefipYear, setSefipYear] = useState(String(getCurrentYear()));
  const [sefipMonth, setSefipMonth] = useState(String(getCurrentMonth()));
  const [sefipLoading, setSefipLoading] = useState(false);

  const [cagedYear, setCagedYear] = useState(String(getCurrentYear()));
  const [cagedMonth, setCagedMonth] = useState(String(getCurrentMonth()));
  const [cagedLoading, setCagedLoading] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExportEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const status =
        employeesStatus === '__all__' ? undefined : employeesStatus;
      await hrReportsService.exportEmployees({
        status,
      });
      toast.success('Exportação de funcionários concluída');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao exportar funcionários'
      );
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleExportAbsences = async () => {
    if (!absencesStartDate || !absencesEndDate) {
      toast.error('Data de início e fim são obrigatórias');
      return;
    }
    setAbsencesLoading(true);
    try {
      const type = absencesType === '__all__' ? undefined : absencesType;
      const status = absencesStatus === '__all__' ? undefined : absencesStatus;
      await hrReportsService.exportAbsences({
        startDate: absencesStartDate,
        endDate: absencesEndDate,
        type,
        status,
      });
      toast.success('Exportação de ausências concluída');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao exportar ausências'
      );
    } finally {
      setAbsencesLoading(false);
    }
  };

  const handleExportPayroll = async () => {
    setPayrollLoading(true);
    try {
      await hrReportsService.exportPayroll({
        referenceMonth: Number(payrollMonth),
        referenceYear: Number(payrollYear),
      });
      toast.success('Exportação da folha de pagamento concluída');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao exportar folha de pagamento'
      );
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleGenerateRais = async () => {
    setRaisLoading(true);
    try {
      const result = await hrReportsService.generateRais({
        year: Number(raisYear),
      });
      toast.success(
        result.message ||
          `RAIS ${raisYear} gerada com sucesso${result.recordCount ? ` (${result.recordCount} registros)` : ''}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao gerar RAIS'
      );
    } finally {
      setRaisLoading(false);
    }
  };

  const handleGenerateDirf = async () => {
    setDirfLoading(true);
    try {
      const result = await hrReportsService.generateDirf({
        year: Number(dirfYear),
      });
      toast.success(
        result.message ||
          `DIRF ${dirfYear} gerada com sucesso${result.recordCount ? ` (${result.recordCount} registros)` : ''}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao gerar DIRF'
      );
    } finally {
      setDirfLoading(false);
    }
  };

  const handleGenerateSefip = async () => {
    setSefipLoading(true);
    try {
      const monthLabel = MONTHS.find(m => m.value === sefipMonth)?.label;
      const result = await hrReportsService.generateSefip({
        year: Number(sefipYear),
        month: Number(sefipMonth),
      });
      toast.success(
        result.message ||
          `SEFIP de ${monthLabel}/${sefipYear} gerado com sucesso${result.recordCount ? ` (${result.recordCount} registros)` : ''}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao gerar SEFIP'
      );
    } finally {
      setSefipLoading(false);
    }
  };

  const handleGenerateCaged = async () => {
    setCagedLoading(true);
    try {
      const monthLabel = MONTHS.find(m => m.value === cagedMonth)?.label;
      const result = await hrReportsService.generateCaged({
        year: Number(cagedYear),
        month: Number(cagedMonth),
      });
      toast.success(
        result.message ||
          `CAGED de ${monthLabel}/${cagedYear} gerado com sucesso${result.recordCount ? ` (${result.recordCount} registros)` : ''}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao gerar CAGED'
      );
    } finally {
      setCagedLoading(false);
    }
  };

  // ============================================================================
  // YEAR OPTIONS
  // ============================================================================

  const currentYear = getCurrentYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) =>
    String(currentYear - i)
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (
    !canViewReports &&
    !canExport &&
    !canExportEmployees &&
    !canExportPayroll
  ) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Relatórios', href: '/hr/reports' },
            ]}
          />
          <Header
            title="Relatórios"
            description="Você não possui permissão para acessar os relatórios"
          />
        </PageHeader>
      </PageLayout>
    );
  }

  return (
    <PageLayout data-testid="hr-reports-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Relatórios', href: '/hr/reports' },
          ]}
        />
        <Header
          title="Relatórios"
          description="Exportações de dados e obrigações legais do módulo de Recursos Humanos"
        />
      </PageHeader>

      <PageBody>
        {/* ================================================================
            SECTION 1: CSV EXPORTS
            ================================================================ */}
        {(canExportEmployees || canExport) && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Exportações</h2>
                <p className="text-sm text-muted-foreground">
                  Exporte dados em formato CSV para análise externa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Employees CSV */}
              {canExportEmployees && (
                <Card className="bg-white/5 py-0 overflow-hidden">
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-linear-to-br from-blue-500 to-cyan-600">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          Funcionários
                        </CardTitle>
                        <CardDescription>
                          Exportar lista de funcionários com filtros
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Status
                      </Label>
                      <Select
                        value={employeesStatus}
                        onValueChange={setEmployeesStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_STATUS_OPTIONS.map(opt => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value || '__all__'}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="pb-5">
                    <Button
                      size="sm"
                      className="h-9 px-3 w-full"
                      onClick={handleExportEmployees}
                      disabled={employeesLoading}
                    >
                      {employeesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Exportar CSV
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Absences CSV */}
              {(canExport || canViewReports) && (
                <Card className="bg-white/5 py-0 overflow-hidden">
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-linear-to-br from-amber-500 to-orange-600">
                        <UserX className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Ausências</CardTitle>
                        <CardDescription>
                          Exportar registro de ausências por período
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Data Início
                        </Label>
                        <Input
                          type="date"
                          value={absencesStartDate}
                          onChange={e => setAbsencesStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Data Fim
                        </Label>
                        <Input
                          type="date"
                          value={absencesEndDate}
                          onChange={e => setAbsencesEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Tipo
                      </Label>
                      <Select
                        value={absencesType}
                        onValueChange={setAbsencesType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          {ABSENCE_TYPE_OPTIONS.map(opt => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value || '__all__'}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Status
                      </Label>
                      <Select
                        value={absencesStatus}
                        onValueChange={setAbsencesStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          {ABSENCE_STATUS_OPTIONS.map(opt => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value || '__all__'}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="pb-5">
                    <Button
                      size="sm"
                      className="h-9 px-3 w-full"
                      onClick={handleExportAbsences}
                      disabled={absencesLoading}
                    >
                      {absencesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Exportar CSV
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Payroll CSV */}
              {canExportPayroll && (
                <Card className="bg-white/5 py-0 overflow-hidden">
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          Folha de Pagamento
                        </CardTitle>
                        <CardDescription>
                          Exportar dados da folha de pagamento
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Mês
                        </Label>
                        <Select
                          value={payrollMonth}
                          onValueChange={setPayrollMonth}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map(m => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Ano
                        </Label>
                        <Select
                          value={payrollYear}
                          onValueChange={setPayrollYear}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map(y => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pb-5">
                    <Button
                      size="sm"
                      className="h-9 px-3 w-full"
                      onClick={handleExportPayroll}
                      disabled={payrollLoading}
                    >
                      {payrollLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Exportar CSV
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* ================================================================
            SECTION 2: COMPLIANCE REPORTS
            ================================================================ */}
        {(canExport || canViewReports) && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
                <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Obrigações Legais</h2>
                <p className="text-sm text-muted-foreground">
                  Relatórios de conformidade trabalhista brasileira
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* RAIS */}
              <Card className="bg-white/5 py-0 overflow-hidden">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-linear-to-br from-violet-500 to-purple-600">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">RAIS</CardTitle>
                      <CardDescription className="text-xs">
                        Relação Anual de Informações Sociais
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ano</Label>
                    <Select value={raisYear} onValueChange={setRaisYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(y => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="pb-5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 w-full"
                    onClick={handleGenerateRais}
                    disabled={raisLoading}
                  >
                    {raisLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Gerar Relatório
                  </Button>
                </CardFooter>
              </Card>

              {/* DIRF */}
              <Card className="bg-white/5 py-0 overflow-hidden">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-linear-to-br from-sky-500 to-blue-600">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">DIRF</CardTitle>
                      <CardDescription className="text-xs">
                        Declaração do Imposto de Renda Retido na Fonte
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ano</Label>
                    <Select value={dirfYear} onValueChange={setDirfYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(y => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="pb-5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 w-full"
                    onClick={handleGenerateDirf}
                    disabled={dirfLoading}
                  >
                    {dirfLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Gerar Relatório
                  </Button>
                </CardFooter>
              </Card>

              {/* SEFIP */}
              <Card className="bg-white/5 py-0 overflow-hidden">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-linear-to-br from-teal-500 to-emerald-600">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">SEFIP</CardTitle>
                      <CardDescription className="text-xs">
                        Sistema de Recolhimento do FGTS e Informações à
                        Previdência Social
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Mês
                      </Label>
                      <Select value={sefipMonth} onValueChange={setSefipMonth}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(m => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Ano
                      </Label>
                      <Select value={sefipYear} onValueChange={setSefipYear}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map(y => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 w-full"
                    onClick={handleGenerateSefip}
                    disabled={sefipLoading}
                  >
                    {sefipLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Gerar Relatório
                  </Button>
                </CardFooter>
              </Card>

              {/* CAGED */}
              <Card className="bg-white/5 py-0 overflow-hidden">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-linear-to-br from-rose-500 to-pink-600">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">CAGED</CardTitle>
                      <CardDescription className="text-xs">
                        Cadastro Geral de Empregados e Desempregados
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Mês
                      </Label>
                      <Select value={cagedMonth} onValueChange={setCagedMonth}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(m => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Ano
                      </Label>
                      <Select value={cagedYear} onValueChange={setCagedYear}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map(y => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 w-full"
                    onClick={handleGenerateCaged}
                    disabled={cagedLoading}
                  >
                    {cagedLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Gerar Relatório
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>
        )}
      </PageBody>
    </PageLayout>
  );
}
