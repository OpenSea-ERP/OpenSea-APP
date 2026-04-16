/**
 * OpenSea OS - Employee Salary History Page
 *
 * Página dedicada à timeline salarial de um funcionário.
 *  - Exibe salário atual destacado + próxima revisão sugerida
 *  - Renderiza timeline vertical com promotion markers
 *  - Permite registrar nova mudança via wizard com PIN obrigatório
 *
 * Permissão: `hr.salary.access` para visualizar; `hr.salary.modify`
 * para registrar nova mudança. Sem permissão de view, valores são
 * mascarados (R$ ***).
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { RegisterSalaryChangeModal } from '@/components/hr/register-salary-change-modal';
import {
  SalaryTimelineCard,
  type SalaryTimelineUserSummary,
} from '@/components/hr/salary-timeline-card';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { translateError } from '@/lib/error-messages';
import { calculateNextReviewDate } from '@/lib/hr/calculate-salary-change';
import { usersService } from '@/services/auth';
import { salaryHistoryService } from '@/services/hr';
import type { SalaryHistoryRecord } from '@/services/hr/salary-history.service';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CalendarClock,
  CalendarRange,
  Lock,
  Plus,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { PiUserRectangleDuotone } from 'react-icons/pi';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { employeesApi, formatSalary } from '../../src';
import type { Employee } from '@/types/hr';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function maskSalary(): string {
  return 'R$ ***';
}

export default function EmployeeSalaryHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = params.id as string;

  const { hasPermission } = usePermissions();
  const canViewSalary = hasPermission(HR_PERMISSIONS.SALARY.VIEW);
  const canRegister = hasPermission(HR_PERMISSIONS.SALARY.CREATE);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const { data: employee, isLoading: isLoadingEmployee } = useQuery<Employee>({
    queryKey: ['employees', employeeId],
    queryFn: () => employeesApi.get(employeeId),
  });

  const { data: salaryHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['salary-history', employeeId],
    queryFn: () => salaryHistoryService.listByEmployee(employeeId),
    enabled: canViewSalary,
  });

  const history = useMemo<SalaryHistoryRecord[]>(
    () => salaryHistoryData?.history ?? [],
    [salaryHistoryData]
  );

  // Resolve unique authors so we can show "Quem registrou" with name + avatar
  const uniqueAuthorIds = useMemo(() => {
    return Array.from(new Set(history.map(record => record.changedBy)));
  }, [history]);

  const authorQueries = useQueries({
    queries: uniqueAuthorIds.map(authorId => ({
      queryKey: ['users', authorId],
      queryFn: () => usersService.getUser(authorId),
      enabled: !!authorId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const authorById = useMemo(() => {
    const map = new Map<string, SalaryTimelineUserSummary>();
    authorQueries.forEach((query, index) => {
      const authorId = uniqueAuthorIds[index];
      if (!authorId) return;
      const user = query.data?.user;
      if (!user) return;
      const profileName =
        [user.profile?.name, user.profile?.surname]
          .filter(Boolean)
          .join(' ')
          .trim() || user.username;
      map.set(authorId, {
        id: authorId,
        name: profileName,
        avatarUrl: user.profile?.avatarUrl ?? null,
      });
    });
    return map;
  }, [authorQueries, uniqueAuthorIds]);

  const resolveAuthor = (userId: string) => authorById.get(userId);

  const latestEntry = history[0];
  const currentSalary = employee?.baseSalary ?? null;
  const nextReviewDate = latestEntry?.effectiveDate
    ? calculateNextReviewDate(latestEntry.effectiveDate)
    : employee?.hireDate
      ? calculateNextReviewDate(employee.hireDate)
      : null;

  const registerMutation = useMutation({
    mutationFn: async (payload: {
      newSalary: number;
      reason: SalaryHistoryRecord['reason'];
      notes?: string;
      effectiveDate: string;
      pin: string;
    }) => salaryHistoryService.register(employeeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['salary-history', employeeId],
      });
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
      toast.success('Mudança salarial registrada com sucesso!');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao registrar mudança salarial';
      toast.error(translateError(message));
      throw error;
    },
  });

  if (isLoadingEmployee) {
    return (
      <PageLayout data-testid="salary-history-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Funcionários', href: '/hr/employees' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!employee) {
    return (
      <PageLayout data-testid="salary-history-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Funcionários', href: '/hr/employees' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <h2 className="text-2xl font-semibold mb-2">
              Funcionário não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/employees')}>
              Voltar para Funcionários
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout data-testid="salary-history-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Funcionários', href: '/hr/employees' },
            { label: employee.fullName, href: `/hr/employees/${employeeId}` },
            { label: 'Salário' },
          ]}
          buttons={
            canRegister
              ? [
                  {
                    id: 'register-salary-change',
                    title: 'Registrar mudança',
                    icon: Plus,
                    onClick: () => setIsRegisterModalOpen(true),
                  },
                ]
              : undefined
          }
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5" data-testid="salary-identity-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600">
              <PiUserRectangleDuotone className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {employee.fullName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {employee.position?.name ?? 'Cargo não definido'}
                {employee.department?.name
                  ? ` • ${employee.department.name}`
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Histórico salarial auditado</span>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        {!canViewSalary ? (
          <Card
            className="bg-white dark:bg-slate-800/60 border border-border p-12 text-center"
            data-testid="salary-permission-denied"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
              <Lock className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              Sem permissão para visualizar salário
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Solicite à equipe administrativa o acesso{' '}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
                hr.salary.access
              </code>{' '}
              para consultar o histórico salarial deste funcionário.
            </p>
            <p className="mt-6 font-mono text-2xl">{maskSalary()}</p>
          </Card>
        ) : (
          <>
            {/* Salário Atual destacado */}
            <Card
              className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden p-0"
              data-testid="salary-current-card"
            >
              <div className="bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Salário atual
                    </div>
                    <p
                      className="mt-2 font-mono text-4xl font-bold tracking-tight sm:text-5xl"
                      data-testid="salary-current-value"
                    >
                      {formatSalary(currentSalary)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      {latestEntry?.effectiveDate ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                        >
                          <CalendarRange className="h-3 w-3" />
                          Vigente desde{' '}
                          {DATE_FORMATTER.format(
                            new Date(latestEntry.effectiveDate)
                          )}
                        </Badge>
                      ) : employee.hireDate ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-300"
                        >
                          <CalendarRange className="h-3 w-3" />
                          Desde a admissão em{' '}
                          {DATE_FORMATTER.format(new Date(employee.hireDate))}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {nextReviewDate && (
                    <div className="rounded-xl border border-border bg-white p-4 text-sm shadow-xs dark:bg-slate-900/60">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                        Próxima revisão sugerida
                      </div>
                      <p
                        className="mt-1 font-mono text-base font-semibold"
                        data-testid="salary-next-review"
                      >
                        {DATE_FORMATTER.format(nextReviewDate)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        12 meses após a última mudança efetiva
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <SalaryTimelineCard
              entries={history}
              isLoading={isLoadingHistory}
              userResolver={resolveAuthor}
              emptyAction={
                canRegister ? (
                  <Button
                    onClick={() => setIsRegisterModalOpen(true)}
                    data-testid="salary-register-button"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar primeira mudança
                  </Button>
                ) : undefined
              }
            />
          </>
        )}
      </PageBody>

      {canRegister && (
        <RegisterSalaryChangeModal
          open={isRegisterModalOpen}
          onOpenChange={setIsRegisterModalOpen}
          employeeName={employee.fullName}
          currentSalary={currentSalary}
          isSubmitting={registerMutation.isPending}
          onSubmit={async payload => {
            await registerMutation.mutateAsync(payload);
          }}
        />
      )}
    </PageLayout>
  );
}
