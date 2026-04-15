'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Header } from '@/components/layout/header';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  Users,
  Clock,
  UserX,
  DollarSign,
  LayoutDashboard,
  ClipboardCheck,
  ShieldAlert,
  Cake,
  CalendarClock,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Umbrella,
} from 'lucide-react';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHRAnalytics } from '../_shared/hooks/use-hr-analytics';
import type {
  ComplianceAlert,
  BirthdayEmployee,
  ProbationEnding,
} from '../_shared/hooks/use-hr-analytics';
import { CHART_COLORS, CHART_COLOR_SCALE } from '@/lib/chart-colors';
import React from 'react';

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  isLoading?: boolean;
  href?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtitle,
  isLoading,
  href,
}: StatCardProps) {
  const content = (
    <Card
      className={href ? 'transition-shadow hover:shadow-md cursor-pointer' : ''}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-3xl font-bold mt-1">{value}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// ============================================================================
// CHART CARD
// ============================================================================

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

function ChartCard({ title, children, isLoading, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[280px] w-full" /> : children}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ERROR BOUNDARY WIDGET WRAPPER
// ============================================================================

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {this.props.fallbackMessage ?? 'Erro ao carregar widget'}
            </div>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// CURRENCY FORMATTER
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTooltipCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  isCurrency?: boolean;
  isPercent?: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
  isCurrency,
  isPercent,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}:{' '}
          {isCurrency
            ? formatTooltipCurrency(entry.value)
            : isPercent
              ? `${entry.value}%`
              : entry.value}
        </p>
      ))}
    </div>
  );
}

// ============================================================================
// COMPLIANCE ALERTS WIDGET
// ============================================================================

function ComplianceAlertsWidget({
  alerts,
  isLoading,
}: {
  alerts: ComplianceAlert[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-base font-semibold">
            Alertas de Compliance
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum alerta de compliance
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Todos os itens estão em conformidade
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {alerts.map(alert => (
              <Link
                key={alert.id}
                href={alert.link}
                className={`block rounded-lg border p-3 transition-colors hover:bg-accent ${
                  alert.severity === 'critical'
                    ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5'
                    : 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg ${
                      alert.severity === 'critical'
                        ? 'bg-rose-100 dark:bg-rose-500/20'
                        : 'bg-amber-100 dark:bg-amber-500/20'
                    }`}
                  >
                    {alert.type === 'medical_exam_expiring' ? (
                      <Stethoscope
                        className={`h-4 w-4 ${
                          alert.severity === 'critical'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      />
                    ) : (
                      <Umbrella
                        className={`h-4 w-4 ${
                          alert.severity === 'critical'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {alert.employeeName}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        alert.severity === 'critical'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {alert.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {alert.detail}
                    </p>
                  </div>
                  {alert.severity === 'critical' && (
                    <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 mt-1" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// BIRTHDAYS WIDGET
// ============================================================================

function BirthdaysWidget({
  birthdays,
  isLoading,
}: {
  birthdays: BirthdayEmployee[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <CardTitle className="text-base font-semibold">
            Aniversariantes do Mês
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-500/20 mb-3">
              <Cake className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum aniversariante este mês
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {birthdays.map(emp => {
              const bdDate = new Date(emp.birthDate);
              const dayStr = String(bdDate.getDate()).padStart(2, '0');
              const monthStr = String(bdDate.getMonth() + 1).padStart(2, '0');
              const initials = emp.fullName
                .split(' ')
                .map(n => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <Link
                  key={emp.id}
                  href={`/hr/employees/${emp.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <Avatar className="h-9 w-9">
                    {emp.photoUrl && (
                      <AvatarImage src={emp.photoUrl} alt={emp.fullName} />
                    )}
                    <AvatarFallback className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {emp.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {emp.departmentName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                      {dayStr}/{monthStr}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PROBATION ENDINGS WIDGET
// ============================================================================

function ProbationEndingsWidget({
  probations,
  isLoading,
}: {
  probations: ProbationEnding[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <CardTitle className="text-base font-semibold">
            Término de Experiência
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : probations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-sky-100 dark:bg-sky-500/20 mb-3">
              <CalendarClock className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum término de experiência nos próximos 30 dias
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {probations.map(emp => {
              const hireDate = new Date(emp.hireDate);
              const urgency =
                emp.daysRemaining <= 7
                  ? 'text-rose-600 dark:text-rose-400'
                  : emp.daysRemaining <= 15
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-sky-600 dark:text-sky-400';

              return (
                <Link
                  key={emp.id}
                  href={`/hr/employees/${emp.id}`}
                  className="block rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {emp.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {emp.departmentName} - Admissão:{' '}
                        {hireDate.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-bold ${urgency}`}>
                        {emp.daysRemaining}d
                      </p>
                      <p className="text-xs text-muted-foreground">restantes</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function HROverviewPage() {
  const router = useRouter();
  const { data, isLoading } = useHRAnalytics();

  const headerButtons: HeaderButton[] = [
    {
      id: 'attendance-panel',
      title: 'Painel de Presença',
      icon: LayoutDashboard,
      onClick: () => router.push('/hr/time-control/overview'),
      variant: 'outline',
    },
  ];

  return (
    <PageLayout data-testid="hr-overview-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Visão Geral', href: '/hr/overview' },
          ]}
          buttons={headerButtons}
        />
        <Header
          title="Visão Geral"
          description="Indicadores e análises do módulo de Recursos Humanos"
        />
      </PageHeader>

      <PageBody>
        {/* KPI Cards - Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Funcionários Ativos"
            value={data?.totalEmployees ?? 0}
            icon={Users}
            iconBg="bg-blue-100 dark:bg-blue-500/20"
            iconColor="text-primary"
            isLoading={isLoading}
          />
          <StatCard
            title="Aprovações Pendentes"
            value={data?.pendingApprovals ?? 0}
            icon={ClipboardCheck}
            iconBg="bg-amber-100 dark:bg-amber-500/20"
            iconColor="text-amber-600 dark:text-amber-400"
            subtitle="Ausências, extras e férias"
            isLoading={isLoading}
            href="/hr/absences"
          />
          <StatCard
            title="Horas Extras Pendentes"
            value={data?.pendingOvertime ?? 0}
            icon={Clock}
            iconBg="bg-orange-100 dark:bg-orange-500/20"
            iconColor="text-orange-600 dark:text-orange-400"
            subtitle="Aguardando aprovação"
            isLoading={isLoading}
          />
          <StatCard
            title="Ausências Ativas"
            value={data?.activeAbsences ?? 0}
            icon={UserX}
            iconBg="bg-rose-100 dark:bg-rose-500/20"
            iconColor="text-rose-600 dark:text-rose-400"
            subtitle="Em andamento ou aprovadas"
            isLoading={isLoading}
          />
          <StatCard
            title="Férias Vencidas"
            value={data?.overdueVacations ?? 0}
            icon={AlertTriangle}
            iconBg="bg-rose-100 dark:bg-rose-500/20"
            iconColor="text-rose-600 dark:text-rose-400"
            subtitle="Funcionários com férias vencidas"
            isLoading={isLoading}
            href="/hr/vacations"
          />
          <StatCard
            title="Folha do Mês"
            value={data ? formatCurrency(data.currentPayrollNet) : 'R$ 0'}
            icon={DollarSign}
            iconBg="bg-emerald-100 dark:bg-emerald-500/20"
            iconColor="text-emerald-600 dark:text-emerald-400"
            subtitle="Valor líquido"
            isLoading={isLoading}
          />
        </div>

        {/* Row 2: Employees by Department + Turnover Rate (replacing Contract Types) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <WidgetErrorBoundary fallbackMessage="Erro ao carregar gráfico de departamentos">
            <ChartCard
              title="Funcionários por Departamento"
              isLoading={isLoading}
              className="lg:col-span-2"
            >
              {data && data.employeesByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data.employeesByDepartment}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      className="text-xs"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 12 }}
                      className="text-xs"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Funcionários"
                      radius={[0, 4, 4, 0]}
                    >
                      {data.employeesByDepartment.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLOR_SCALE[i % CHART_COLOR_SCALE.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Nenhum funcionário cadastrado" />
              )}
            </ChartCard>
          </WidgetErrorBoundary>

          <WidgetErrorBoundary fallbackMessage="Erro ao carregar taxa de turnover">
            <ChartCard title="Taxa de Turnover (6 meses)" isLoading={isLoading}>
              {data && data.turnoverTrend.some(t => t.rate > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.turnoverTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip isPercent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Turnover %"
                      stroke={CHART_COLORS.red}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Nenhuma rescisão nos últimos 6 meses" />
              )}
            </ChartCard>
          </WidgetErrorBoundary>
        </div>

        {/* Row 3: Compliance Alerts + Birthdays + Probation Endings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <WidgetErrorBoundary fallbackMessage="Erro ao carregar alertas de compliance">
            <ComplianceAlertsWidget
              alerts={data?.complianceAlerts ?? []}
              isLoading={isLoading}
            />
          </WidgetErrorBoundary>

          <WidgetErrorBoundary fallbackMessage="Erro ao carregar aniversariantes">
            <BirthdaysWidget
              birthdays={data?.birthdaysThisMonth ?? []}
              isLoading={isLoading}
            />
          </WidgetErrorBoundary>

          <WidgetErrorBoundary fallbackMessage="Erro ao carregar términos de experiência">
            <ProbationEndingsWidget
              probations={data?.probationEndings ?? []}
              isLoading={isLoading}
            />
          </WidgetErrorBoundary>
        </div>

        {/* Row 4: Payroll Trend + Overtime Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WidgetErrorBoundary fallbackMessage="Erro ao carregar folha de pagamento">
            <ChartCard
              title="Folha de Pagamento (6 meses)"
              isLoading={isLoading}
            >
              {data && data.payrollTrend.some(p => p.bruto > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.payrollTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={formatCurrency}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Legend />
                    <Bar
                      dataKey="bruto"
                      name="Bruto"
                      fill={CHART_COLORS.blue}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="liquido"
                      name="Líquido"
                      fill={CHART_COLORS.emerald}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Nenhuma folha processada nos últimos 6 meses" />
              )}
            </ChartCard>
          </WidgetErrorBoundary>

          <WidgetErrorBoundary fallbackMessage="Erro ao carregar horas extras">
            <ChartCard title="Horas Extras (6 meses)" isLoading={isLoading}>
              {data && data.overtimeTrend.some(o => o.horas > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.overtimeTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="horas"
                      name="Horas"
                      stroke={CHART_COLORS.amber}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Registros"
                      stroke={CHART_COLORS.violet}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Nenhuma hora extra nos últimos 6 meses" />
              )}
            </ChartCard>
          </WidgetErrorBoundary>
        </div>

        {/* Row 5: Absences by Type + Bonuses vs Deductions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WidgetErrorBoundary fallbackMessage="Erro ao carregar ausências">
            <ChartCard title="Ausências por Tipo" isLoading={isLoading}>
              {data && data.absencesByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.absencesByType}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      allowDecimals={false}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Ocorrências"
                      fill={CHART_COLORS.red}
                      radius={[4, 4, 0, 0]}
                    >
                      {data.absencesByType.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLOR_SCALE[i % CHART_COLOR_SCALE.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Nenhuma ausência registrada" />
              )}
            </ChartCard>
          </WidgetErrorBoundary>

          <WidgetErrorBoundary fallbackMessage="Erro ao carregar bonificações">
            <ChartCard
              title="Bonificações vs Deduções (6 meses)"
              isLoading={isLoading}
            >
              {data &&
              data.bonusesVsDeductions.some(
                b => b.bonificacoes > 0 || b.deducoes > 0
              ) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.bonusesVsDeductions}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={formatCurrency}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Legend />
                    <Bar
                      dataKey="bonificacoes"
                      name="Bonificações"
                      fill={CHART_COLORS.emerald}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="deducoes"
                      name="Deduções"
                      fill={CHART_COLORS.red}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Nenhuma bonificação ou dedução nos últimos 6 meses" />
              )}
            </ChartCard>
          </WidgetErrorBoundary>
        </div>
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
      {message}
    </div>
  );
}
