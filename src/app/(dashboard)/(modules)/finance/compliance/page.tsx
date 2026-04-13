/**
 * OpenSea OS - Compliance Fiscal
 *
 * Página unificada de compliance fiscal com 3 seções:
 * 1. Simples Nacional — Status do enquadramento
 * 2. Calendário Fiscal — Obrigações tributárias mensais
 * 3. Exportações — Download SPED ECD
 */

'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Receipt,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useSimplesNacional,
  useTaxCalendar,
  useGenerateDarfs,
  usePayObligation,
  useExportSpedEcd,
} from '@/hooks/finance/use-compliance';
import { cn } from '@/lib/utils';
import type {
  TaxObligation,
  TaxObligationStatus,
  SimplesNacionalStatus,
} from '@/types/finance';
import {
  TAX_OBLIGATION_STATUS_LABELS,
  COMPLIANCE_TAX_TYPE_LABELS,
} from '@/types/finance';

// =============================================================================
// CONSTANTS
// =============================================================================

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusBadgeClasses(status: TaxObligationStatus): string {
  const colors: Record<TaxObligationStatus, string> = {
    PENDING:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    PAID: 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    OVERDUE:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    CANCELLED:
      'border-slate-300 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400',
  };
  return colors[status] ?? colors.PENDING;
}

function getTaxTypeBadgeClasses(taxType: string): string {
  const colors: Record<string, string> = {
    IRRF: 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
    ISS: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    INSS: 'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
    PIS: 'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
    COFINS:
      'border-purple-600/25 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/8 text-purple-700 dark:text-purple-300',
    CSLL: 'border-indigo-600/25 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-700 dark:text-indigo-300',
    IRPJ: 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
    ICMS: 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    IPI: 'border-orange-600/25 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/8 text-orange-700 dark:text-orange-300',
    FGTS: 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  };
  return (
    colors[taxType] ??
    'border-slate-300 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400'
  );
}

function getSimplesStatusConfig(status: SimplesNacionalStatus) {
  const configs = {
    OK: {
      icon: ShieldCheck,
      borderColor: 'border-emerald-200 dark:border-emerald-500/20',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-500/5',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressColor:
        '[--progress-fill:theme(--color-emerald-500)] [--progress-bg:theme(--color-emerald-200)] dark:[--progress-bg:theme(--color-emerald-900)]',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      label: 'Dentro do limite',
    },
    WARNING: {
      icon: ShieldAlert,
      borderColor: 'border-amber-200 dark:border-amber-500/20',
      bgColor: 'bg-amber-50/50 dark:bg-amber-500/5',
      iconColor: 'text-amber-600 dark:text-amber-400',
      progressColor:
        '[--progress-fill:theme(--color-amber-500)] [--progress-bg:theme(--color-amber-200)] dark:[--progress-bg:theme(--color-amber-900)]',
      textColor: 'text-amber-700 dark:text-amber-300',
      label: 'Atenção',
    },
    EXCEEDED: {
      icon: AlertTriangle,
      borderColor: 'border-rose-200 dark:border-rose-500/20',
      bgColor: 'bg-rose-50/50 dark:bg-rose-500/5',
      iconColor: 'text-rose-600 dark:text-rose-400',
      progressColor:
        '[--progress-fill:theme(--color-rose-500)] [--progress-bg:theme(--color-rose-200)] dark:[--progress-bg:theme(--color-rose-900)]',
      textColor: 'text-rose-700 dark:text-rose-300',
      label: 'Limite excedido',
    },
  };
  return configs[status] ?? configs.OK;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function CompliancePage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="list" size="md" gap="gap-4" />}
    >
      <CompliancePageContent />
    </Suspense>
  );
}

function CompliancePageContent() {
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(FINANCE_PERMISSIONS.FISCAL.ACCESS);
  const canExport = hasPermission(FINANCE_PERMISSIONS.FISCAL.EXPORT);
  const canAdmin = hasPermission(FINANCE_PERMISSIONS.FISCAL.ADMIN);

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const now = new Date();
  const [simplesYear, setSimplesYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [spedYear, setSpedYear] = useState(now.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [payTargetId, setPayTargetId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  const simplesQuery = useSimplesNacional(simplesYear);
  const calendarQuery = useTaxCalendar(calendarYear, calendarMonth);

  // ---------------------------------------------------------------------------
  // MUTATIONS
  // ---------------------------------------------------------------------------

  const generateDarfsMutation = useGenerateDarfs();
  const payMutation = usePayObligation();
  const exportSpedMutation = useExportSpedEcd();

  // ---------------------------------------------------------------------------
  // FILTERED OBLIGATIONS
  // ---------------------------------------------------------------------------

  const obligations = useMemo(() => {
    const raw = calendarQuery.data?.obligations ?? [];
    if (!searchQuery.trim()) return raw;
    const q = searchQuery.toLowerCase();
    return raw.filter(
      o =>
        o.taxType.toLowerCase().includes(q) ||
        (COMPLIANCE_TAX_TYPE_LABELS[o.taxType] ?? '')
          .toLowerCase()
          .includes(q) ||
        (TAX_OBLIGATION_STATUS_LABELS[o.status] ?? '')
          .toLowerCase()
          .includes(q) ||
        formatCurrency(o.amount).includes(q)
    );
  }, [calendarQuery.data, searchQuery]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handlePrevMonth = useCallback(() => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  }, [calendarMonth]);

  const handleNextMonth = useCallback(() => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  }, [calendarMonth]);

  const handleGenerateDarfs = useCallback(async () => {
    try {
      const result = await generateDarfsMutation.mutateAsync({
        month: calendarMonth,
        year: calendarYear,
      });
      toast.success(`${result.generated} DARF(s) gerada(s) com sucesso.`);
    } catch {
      toast.error('Erro ao gerar DARFs.');
    }
  }, [calendarMonth, calendarYear, generateDarfsMutation]);

  const handlePayConfirm = useCallback(async () => {
    if (!payTargetId) return;
    try {
      await payMutation.mutateAsync(payTargetId);
      setPayTargetId(null);
      toast.success('Obrigação marcada como paga.');
    } catch {
      toast.error('Erro ao marcar obrigação como paga.');
    }
  }, [payTargetId, payMutation]);

  const handleExportSped = useCallback(async () => {
    try {
      const result = await exportSpedMutation.mutateAsync(spedYear);
      // Trigger download
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename || `SPED-ECD-${spedYear}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Arquivo SPED ECD exportado com sucesso.');
    } catch {
      toast.error('Erro ao exportar SPED ECD.');
    }
  }, [spedYear, exportSpedMutation]);

  // ---------------------------------------------------------------------------
  // SUMMARY COUNTS
  // ---------------------------------------------------------------------------

  const allObligations = calendarQuery.data?.obligations ?? [];
  const pendingCount = allObligations.filter(
    o => o.status === 'PENDING'
  ).length;
  const paidCount = allObligations.filter(o => o.status === 'PAID').length;
  const overdueCount = allObligations.filter(
    o => o.status === 'OVERDUE'
  ).length;
  const totalAmount = allObligations
    .filter(o => o.status === 'PENDING' || o.status === 'OVERDUE')
    .reduce((sum, o) => sum + o.amount, 0);

  // ---------------------------------------------------------------------------
  // YEAR OPTIONS
  // ---------------------------------------------------------------------------

  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));
  }, []);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (!canAccess) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Compliance', href: '/finance/compliance' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Você não possui permissão para acessar esta página.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const simplesData = simplesQuery.data?.validation;
  const simplesConfig = simplesData
    ? getSimplesStatusConfig(simplesData.status)
    : null;
  const SimplesIcon = simplesConfig?.icon ?? Shield;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Compliance', href: '/finance/compliance' },
          ]}
        />

        <Header
          title="Compliance Fiscal"
          description="Acompanhe obrigações fiscais, regime tributário e exportações contábeis"
        />
      </PageHeader>

      <PageBody>
        {/* ================================================================= */}
        {/* SECTION 1: Simples Nacional Status Card                           */}
        {/* ================================================================= */}

        <Card
          className={cn(
            'overflow-hidden border',
            simplesConfig?.borderColor ?? 'border-border',
            simplesConfig?.bgColor ?? ''
          )}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl',
                    simplesConfig?.bgColor ?? 'bg-slate-100 dark:bg-slate-800'
                  )}
                >
                  <SimplesIcon
                    className={cn(
                      'h-5 w-5',
                      simplesConfig?.iconColor ?? 'text-muted-foreground'
                    )}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Simples Nacional
                  </h2>
                  {simplesData && (
                    <p className="text-sm text-muted-foreground">
                      Regime: {simplesData.regime}
                    </p>
                  )}
                </div>
              </div>

              {/* Year selector */}
              <Select
                value={String(simplesYear)}
                onValueChange={v => setSimplesYear(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
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

            {/* Content */}
            {simplesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : simplesQuery.error ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Erro ao carregar dados do Simples Nacional.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => simplesQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : simplesData ? (
              <div className="space-y-4">
                {/* Revenue bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Faturamento anual
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(simplesData.annualRevenue)} /{' '}
                      {formatCurrency(simplesData.limit)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(simplesData.percentUsed, 100)}
                    className={cn('h-3', simplesConfig?.progressColor)}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        simplesConfig?.textColor
                      )}
                    >
                      {simplesData.percentUsed.toFixed(1)}% utilizado
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
                        simplesData.status === 'OK'
                          ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                          : simplesData.status === 'WARNING'
                            ? 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300'
                            : 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300'
                      )}
                    >
                      {simplesConfig?.label}
                    </span>
                  </div>
                </div>

                {/* Message */}
                {simplesData.message && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {simplesData.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Nenhum dado disponível.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ================================================================= */}
        {/* SECTION 2: Calendario Fiscal (Tax Calendar)                       */}
        {/* ================================================================= */}

        <Card className="overflow-hidden border border-border">
          <div className="p-6">
            {/* Header with month nav */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/8">
                  <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Calendário Fiscal
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Obrigações tributárias do período
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={handleGenerateDarfs}
                    disabled={generateDarfsMutation.isPending}
                  >
                    {generateDarfsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Receipt className="h-4 w-4 mr-1.5" />
                    )}
                    Gerar DARFs
                  </Button>
                )}

                {/* Month navigator */}
                <div className="flex items-center gap-1 border rounded-lg p-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 min-w-[130px] text-center">
                    {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300">
                {paidCount} pago{paidCount !== 1 ? 's' : ''}
              </span>
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300">
                  {overdueCount} vencido{overdueCount !== 1 ? 's' : ''}
                </span>
              )}
              {totalAmount > 0 && (
                <span className="text-sm text-muted-foreground ml-auto">
                  Total a pagar: {formatCurrency(totalAmount)}
                </span>
              )}
            </div>

            {/* Search */}
            <SearchBar
              placeholder="Buscar obrigações por tipo, status ou valor..."
              value={searchQuery}
              onSearch={setSearchQuery}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="sm"
            />

            {/* Obligations list */}
            <div className="mt-4">
              {calendarQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : calendarQuery.error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Erro ao carregar calendário fiscal.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => calendarQuery.refetch()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : obligations.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Nenhuma obrigação encontrada para esta busca.'
                      : 'Nenhuma obrigação fiscal para este período.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-[1fr_100px_110px_120px_100px_100px] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Tipo</span>
                    <span>Referência</span>
                    <span>Vencimento</span>
                    <span className="text-right">Valor</span>
                    <span className="text-center">Status</span>
                    <span className="text-right">Ações</span>
                  </div>

                  {/* Obligation rows */}
                  {obligations.map(obligation => (
                    <ObligationRow
                      key={obligation.id}
                      obligation={obligation}
                      canAdmin={canAdmin}
                      onPay={id => setPayTargetId(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ================================================================= */}
        {/* SECTION 3: Exportações                                            */}
        {/* ================================================================= */}

        {canExport && (
          <Card className="overflow-hidden border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/8">
                    <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Exportações
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Exporte arquivos contábeis obrigatórios
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Select
                    value={String(spedYear)}
                    onValueChange={v => setSpedYear(Number(v))}
                  >
                    <SelectTrigger className="w-[120px]">
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

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={handleExportSped}
                    disabled={exportSpedMutation.isPending}
                  >
                    {exportSpedMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Download className="h-4 w-4 mr-1.5" />
                    )}
                    Exportar SPED ECD
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ================================================================= */}
        {/* PIN MODAL: Marcar como Pago                                       */}
        {/* ================================================================= */}

        <VerifyActionPinModal
          isOpen={!!payTargetId}
          onClose={() => setPayTargetId(null)}
          onSuccess={handlePayConfirm}
          title="Marcar como Pago"
          description="Digite seu PIN de Ação para confirmar o pagamento desta obrigação tributária."
        />
      </PageBody>
    </PageLayout>
  );
}

// =============================================================================
// OBLIGATION ROW COMPONENT
// =============================================================================

interface ObligationRowProps {
  obligation: TaxObligation;
  canAdmin: boolean;
  onPay: (id: string) => void;
}

function ObligationRow({ obligation, canAdmin, onPay }: ObligationRowProps) {
  const taxLabel =
    COMPLIANCE_TAX_TYPE_LABELS[obligation.taxType] ?? obligation.taxType;
  const statusLabel = TAX_OBLIGATION_STATUS_LABELS[obligation.status];
  const refLabel = `${String(obligation.referenceMonth).padStart(2, '0')}/${obligation.referenceYear}`;
  const isPendingOrOverdue =
    obligation.status === 'PENDING' || obligation.status === 'OVERDUE';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_110px_120px_100px_100px] gap-3 items-center px-4 py-3 rounded-lg border border-border bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
      {/* Tax type */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border shrink-0',
            getTaxTypeBadgeClasses(obligation.taxType)
          )}
        >
          {taxLabel}
        </span>
        {obligation.darfCode && (
          <span className="text-xs text-muted-foreground">
            DARF: {obligation.darfCode}
          </span>
        )}
      </div>

      {/* Reference */}
      <span className="text-sm text-gray-700 dark:text-gray-300">
        <span className="sm:hidden text-xs text-muted-foreground mr-1">
          Ref:
        </span>
        {refLabel}
      </span>

      {/* Due date */}
      <span
        className={cn(
          'text-sm',
          obligation.status === 'OVERDUE'
            ? 'text-rose-600 dark:text-rose-400 font-medium'
            : 'text-gray-700 dark:text-gray-300'
        )}
      >
        <span className="sm:hidden text-xs text-muted-foreground mr-1">
          Venc:
        </span>
        {formatDate(obligation.dueDate)}
      </span>

      {/* Amount */}
      <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white text-right">
        {formatCurrency(obligation.amount)}
      </span>

      {/* Status badge */}
      <div className="flex justify-center">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border',
            getStatusBadgeClasses(obligation.status)
          )}
        >
          {obligation.status === 'PAID' && <CheckCircle2 className="h-3 w-3" />}
          {obligation.status === 'OVERDUE' && <XCircle className="h-3 w-3" />}
          {statusLabel}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        {canAdmin && isPendingOrOverdue && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onPay(obligation.id)}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pagar
          </Button>
        )}
        {obligation.status === 'PAID' && obligation.paidAt && (
          <span className="text-xs text-muted-foreground">
            {formatDate(obligation.paidAt)}
          </span>
        )}
      </div>
    </div>
  );
}
