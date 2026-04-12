'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Header } from '@/components/layout/header';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GridLoading } from '@/components/handlers/grid-loading';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  ClipboardCheck,
  Scale,
  Activity,
  CalendarX2,
  CalendarHeart,
  ArrowRight,
  Settings,
  Download,
} from 'lucide-react';
import type { HeaderButton } from '@/components/layout/types/header.types';
import {
  useAttendanceData,
  type AttendanceEmployee,
} from './use-attendance-data';

// ============================================================================
// KPI CARD
// ============================================================================

type KPIColor = 'violet' | 'emerald' | 'amber' | 'rose';

interface KPICardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  color: KPIColor;
  isLoading?: boolean;
}

const KPI_GRADIENT: Record<KPIColor, string> = {
  violet: 'from-violet-500 to-violet-600',
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
};

function KPICard({ icon: Icon, title, value, color, isLoading }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${KPI_GRADIENT[color]} text-white shrink-0`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EMPLOYEE ROW
// ============================================================================

const STATUS_DOT: Record<string, string> = {
  present: 'bg-emerald-500',
  late: 'bg-amber-500',
  absent: 'bg-rose-500',
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EmployeeRow({ emp }: { emp: AttendanceEmployee }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[emp.status]}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{emp.name}</p>
        {emp.department && (
          <p className="text-xs text-muted-foreground">{emp.department}</p>
        )}
      </div>
      {emp.clockInTime && (
        <span className="text-xs tabular-nums text-muted-foreground shrink-0">
          Entrada: {formatTime(emp.clockInTime)}
        </span>
      )}
      {emp.status === 'late' && emp.lateMinutes > 0 && (
        <Badge
          variant="outline"
          className="text-xs font-medium text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600 shrink-0"
        >
          +{emp.lateMinutes}min
        </Badge>
      )}
      {emp.status === 'absent' && emp.scheduledStart && (
        <span className="text-xs tabular-nums text-muted-foreground shrink-0">
          Previsto: {formatTime(emp.scheduledStart)}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// APPROVAL ROW
// ============================================================================

interface ApprovalRowProps {
  icon: React.ElementType;
  label: string;
  count: number;
  href: string;
}

function ApprovalRow({ icon: Icon, label, count, href }: ApprovalRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-accent/50 transition-colors group"
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm flex-1">{label}</span>
      <Badge
        variant={count > 0 ? 'default' : 'secondary'}
        className="tabular-nums"
      >
        {count}
      </Badge>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

// ============================================================================
// STAT ROW
// ============================================================================

type StatColor = 'emerald' | 'rose' | 'slate';

const STAT_COLORS: Record<StatColor, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-muted-foreground',
};

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: StatColor;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium tabular-nums ${STAT_COLORS[color]}`}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// RECENT ENTRY ROW
// ============================================================================

const ENTRY_LABELS: Record<string, string> = {
  CLOCK_IN: 'Entrada',
  CLOCK_OUT: 'Saída',
  BREAK_START: 'Intervalo',
  BREAK_END: 'Retorno',
  OVERTIME_START: 'HE Início',
  OVERTIME_END: 'HE Fim',
};

const ENTRY_DOT_COLORS: Record<string, string> = {
  CLOCK_IN: 'bg-emerald-500',
  CLOCK_OUT: 'bg-rose-500',
  BREAK_START: 'bg-amber-500',
  BREAK_END: 'bg-amber-500',
  OVERTIME_START: 'bg-violet-500',
  OVERTIME_END: 'bg-violet-500',
};

function RecentEntryRow({
  name,
  type,
  timestamp,
}: {
  name: string;
  type: string;
  timestamp: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${ENTRY_DOT_COLORS[type] ?? 'bg-slate-400'}`}
      />
      <span className="text-xs font-medium truncate flex-1">{name}</span>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {ENTRY_LABELS[type] ?? type}
      </span>
      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
        {formatTime(timestamp)}
      </span>
    </div>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyList({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function AttendanceOverviewPage() {
  return (
    <Suspense
      fallback={<GridLoading count={4} layout="list" size="md" gap="gap-2" />}
    >
      <AttendanceOverviewContent />
    </Suspense>
  );
}

function AttendanceOverviewContent() {
  const { data, isLoading } = useAttendanceData();

  const actionButtons: HeaderButton[] = [
    {
      id: 'settings',
      title: 'Configurações',
      icon: Settings,
      onClick: () => {
        window.location.href = '/hr/settings?tab=ponto';
      },
      variant: 'outline',
    },
    {
      id: 'export',
      title: 'Exportar',
      icon: Download,
      onClick: () => {
        // Future: export attendance report
      },
      variant: 'outline',
    },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Controle de Ponto', href: '/hr/time-control' },
            { label: 'Painel', href: '/hr/time-control/overview' },
          ]}
          buttons={actionButtons}
        />
        <Header
          title="Painel de Presença"
          description="Visão integrada da presença, ausências e registros de ponto dos funcionários"
        />
      </PageHeader>

      <PageBody>
        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Users}
            title="Total Funcionários"
            value={data?.totalEmployees ?? 0}
            color="violet"
            isLoading={isLoading}
          />
          <KPICard
            icon={UserCheck}
            title="Presentes Hoje"
            value={data?.presentToday ?? 0}
            color="emerald"
            isLoading={isLoading}
          />
          <KPICard
            icon={Clock}
            title="Atrasados"
            value={data?.lateToday ?? 0}
            color="amber"
            isLoading={isLoading}
          />
          <KPICard
            icon={UserX}
            title="Ausentes"
            value={data?.absentToday ?? 0}
            color="rose"
            isLoading={isLoading}
          />
        </div>

        {/* Row 2: Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Col 1-2: Attendance tabs */}
          <Card className="lg:col-span-2 overflow-hidden">
            <SectionHeader
              icon={Users}
              title="Presença Hoje"
              subtitle="Funcionários que registraram ponto hoje"
            />

            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="present" className="gap-0">
                <TabsList className="mx-4 mt-3">
                  <TabsTrigger value="present">
                    Presentes ({data?.presentToday ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="late">
                    Atrasados ({data?.lateToday ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="absent">
                    Ausentes ({data?.absentToday ?? 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="present" className="flex-col mt-0">
                  {data?.presentEmployees.length ? (
                    <div className="max-h-[400px] overflow-y-auto">
                      {data.presentEmployees.map(emp => (
                        <EmployeeRow key={emp.id} emp={emp} />
                      ))}
                    </div>
                  ) : (
                    <EmptyList message="Nenhum funcionário presente até o momento" />
                  )}
                </TabsContent>

                <TabsContent value="late" className="flex-col mt-0">
                  {data?.lateEmployees.length ? (
                    <div className="max-h-[400px] overflow-y-auto">
                      {data.lateEmployees.map(emp => (
                        <EmployeeRow key={emp.id} emp={emp} />
                      ))}
                    </div>
                  ) : (
                    <EmptyList message="Nenhum funcionário atrasado hoje" />
                  )}
                </TabsContent>

                <TabsContent value="absent" className="flex-col mt-0">
                  {data?.absentEmployees.length ? (
                    <div className="max-h-[400px] overflow-y-auto">
                      {data.absentEmployees.map(emp => (
                        <EmployeeRow key={emp.id} emp={emp} />
                      ))}
                    </div>
                  ) : (
                    <EmptyList message="Todos os funcionários registraram ponto" />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </Card>

          {/* Col 3: Side panels */}
          <div className="space-y-4">
            {/* Pending Approvals */}
            <Card className="overflow-hidden">
              <SectionHeader
                icon={ClipboardCheck}
                title="Aprovações Pendentes"
              />
              <div className="space-y-1 p-3">
                <ApprovalRow
                  icon={Clock}
                  label="Horas Extras"
                  count={data?.pendingOvertime ?? 0}
                  href="/hr/overtime"
                />
                <ApprovalRow
                  icon={CalendarX2}
                  label="Ausências"
                  count={data?.pendingAbsences ?? 0}
                  href="/hr/absences"
                />
                <ApprovalRow
                  icon={CalendarHeart}
                  label="Férias"
                  count={data?.pendingVacations ?? 0}
                  href="/hr/vacations"
                />
              </div>
            </Card>

            {/* Time Bank Summary */}
            <Card className="overflow-hidden">
              <SectionHeader
                icon={Scale}
                title="Banco de Horas"
                subtitle="Resumo geral"
              />
              <div className="space-y-1 p-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </>
                ) : (
                  <>
                    <StatRow
                      label="Saldo Positivo"
                      value={`${data?.positiveBankCount ?? 0} funcionários`}
                      color="emerald"
                    />
                    <StatRow
                      label="Saldo Negativo"
                      value={`${data?.negativeBankCount ?? 0} funcionários`}
                      color="rose"
                    />
                    <StatRow
                      label="Saldo Zero"
                      value={`${data?.zeroBankCount ?? 0} funcionários`}
                      color="slate"
                    />
                  </>
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="overflow-hidden">
              <SectionHeader icon={Activity} title="Últimos Registros" />
              <div className="space-y-0.5 p-3 max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))
                ) : data?.recentEntries.length ? (
                  data.recentEntries.map((entry, i) => (
                    <RecentEntryRow
                      key={`${entry.timestamp}-${i}`}
                      name={entry.employeeName}
                      type={entry.type}
                      timestamp={entry.timestamp}
                    />
                  ))
                ) : (
                  <EmptyList message="Nenhum registro hoje" />
                )}
              </div>
            </Card>
          </div>
        </div>
      </PageBody>
    </PageLayout>
  );
}
