'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
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
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { employeesService } from '@/services/hr/employees.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Coffee,
  Moon,
  Pencil,
  Plus,
  Timer,
  UserMinus,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { translateError } from '@/lib/error-messages';
import dynamic from 'next/dynamic';
import {
  shiftsApi,
  shiftKeys,
  SHIFT_TYPE_LABELS,
  SHIFT_TYPE_COLORS,
} from '../src';

const AssignEmployeeModal = dynamic(
  () =>
    import('../src/modals/assign-employee-modal').then(m => ({
      default: m.AssignEmployeeModal,
    })),
  { ssr: false }
);

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

/**
 * Converts a time string "HH:MM" to a percentage offset in a 24h bar
 */
function timeToPercent(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return ((h * 60 + m) / (24 * 60)) * 100;
}

/**
 * Visual 24h timeline bar showing when the shift occurs
 */
function ShiftTimelineBar({
  startTime,
  endTime,
  isNightShift,
  color,
}: {
  startTime: string;
  endTime: string;
  isNightShift: boolean;
  color: string | null;
}) {
  const startPct = timeToPercent(startTime);
  const endPct = timeToPercent(endTime);
  const isOvernight = endPct <= startPct;

  const barColor = color ?? (isNightShift ? '#6366f1' : '#0ea5e9');

  const hours = Array.from({ length: 7 }, (_, i) => i * 4);

  return (
    <div className="space-y-2">
      <div className="relative h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {isOvernight ? (
          <>
            {/* First segment: startTime to midnight */}
            <div
              className="absolute inset-y-0 rounded-r-none rounded-l-md opacity-80"
              style={{
                left: `${startPct}%`,
                right: '0%',
                backgroundColor: barColor,
              }}
            />
            {/* Second segment: midnight to endTime */}
            <div
              className="absolute inset-y-0 rounded-l-none rounded-r-md opacity-80"
              style={{
                left: '0%',
                width: `${endPct}%`,
                backgroundColor: barColor,
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-y-0 rounded-md opacity-80"
            style={{
              left: `${startPct}%`,
              width: `${endPct - startPct}%`,
              backgroundColor: barColor,
            }}
          />
        )}

        {/* Hour markers */}
        {hours.map(hour => (
          <div
            key={hour}
            className="absolute top-0 bottom-0 border-l border-slate-300/50 dark:border-slate-600/50"
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}
      </div>

      {/* Hour labels */}
      <div className="relative flex justify-between px-0 text-[10px] text-muted-foreground">
        {hours.map(hour => (
          <span
            key={hour}
            className="tabular-nums"
            style={{
              position: 'absolute',
              left: `${(hour / 24) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {String(hour).padStart(2, '0')}h
          </span>
        ))}
        <span
          className="tabular-nums"
          style={{
            position: 'absolute',
            right: 0,
            transform: 'translateX(50%)',
          }}
        >
          24h
        </span>
      </div>
    </div>
  );
}

export default function ShiftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const shiftId = params.id as string;

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(HR_PERMISSIONS.SHIFTS.MODIFY);
  const canManage = hasPermission(HR_PERMISSIONS.SHIFTS.ADMIN);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<string | null>(null);
  const [isUnassignOpen, setIsUnassignOpen] = useState(false);

  // ==========================================================================
  // DATA
  // ==========================================================================

  const {
    data: shiftData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: shiftKeys.detail(shiftId),
    queryFn: async () => {
      return shiftsApi.get(shiftId);
    },
    enabled: !!shiftId,
  });

  const { data: assignmentsData } = useQuery({
    queryKey: shiftKeys.assignments(shiftId),
    queryFn: async () => {
      const response = await shiftsApi.listAssignments(shiftId);
      return response.shiftAssignments;
    },
    enabled: !!shiftId,
  });

  // Fetch employee details for assignments
  const assignments = assignmentsData ?? [];
  const employeeIds = useMemo(
    () => assignments.map(a => a.employeeId),
    [assignments]
  );

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'for-shift-detail', employeeIds],
    queryFn: async () => {
      const response = await employeesService.listEmployees({ perPage: 200 });
      return response.employees;
    },
    enabled: employeeIds.length > 0,
  });

  const employeeMap = useMemo(() => {
    const map = new Map<
      string,
      { fullName: string; position?: string; department?: string }
    >();
    for (const emp of employeesData ?? []) {
      map.set(emp.id, {
        fullName: emp.fullName,
        position: emp.position?.name,
        department: emp.department?.name,
      });
    }
    return map;
  }, [employeesData]);

  // Unassign mutation
  const unassignMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await shiftsApi.unassignEmployee(assignmentId);
    },
    onSuccess: () => {
      toast.success('Funcionário removido do turno');
      queryClient.invalidateQueries({
        queryKey: shiftKeys.assignments(shiftId),
      });
      queryClient.invalidateQueries({ queryKey: shiftKeys.detail(shiftId) });
    },
    onError: err => {
      toast.error(translateError(err));
    },
  });

  const handleUnassignConfirm = useCallback(async () => {
    if (!unassignTarget) return;
    await unassignMutation.mutateAsync(unassignTarget);
    setUnassignTarget(null);
    setIsUnassignOpen(false);
  }, [unassignTarget, unassignMutation]);

  const shift = shiftData?.shift;
  const assignmentCount = shiftData?.assignmentCount ?? 0;

  // ==========================================================================
  // LOADING / ERROR
  // ==========================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Turnos', href: '/hr/shifts' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={1} layout="grid" size="lg" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !shift) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Turnos', href: '/hr/shifts' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Turno não encontrado"
            message="Não foi possível carregar os detalhes deste turno."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const typeBadgeClass = SHIFT_TYPE_COLORS[shift.type] || '';

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Turnos', href: '/hr/shifts' },
            { label: shift.name },
          ]}
          buttons={[
            ...(canEdit
              ? [
                  {
                    id: 'edit-shift' as const,
                    title: 'Editar',
                    icon: Pencil,
                    onClick: () => router.push(`/hr/shifts/${shiftId}/edit`),
                    variant: 'default' as const,
                  },
                ]
              : []),
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={
                shift.color
                  ? {
                      background: `linear-gradient(135deg, ${shift.color}, ${shift.color}cc)`,
                    }
                  : undefined
              }
            >
              {shift.isNightShift ? (
                <Moon className="h-7 w-7 text-white" />
              ) : (
                <Clock className="h-7 w-7 text-white" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{shift.name}</h1>
                {shift.code && (
                  <span className="text-sm text-muted-foreground">
                    ({shift.code})
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Criado em{' '}
                {new Date(shift.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={typeBadgeClass}>
                {SHIFT_TYPE_LABELS[shift.type]}
              </Badge>
              {shift.isNightShift && <Badge variant="secondary">Noturno</Badge>}
              {!shift.isActive && <Badge variant="destructive">Inativo</Badge>}
            </div>
          </div>
        </Card>

        {/* Schedule Details */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Timer className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">Detalhes do Horário</h3>
              <p className="text-sm text-muted-foreground">
                Início, término, duração e intervalo
              </p>
            </div>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-500/10">
                  <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="font-semibold">{shift.startTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/10">
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Término</p>
                  <p className="font-semibold">{shift.endTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                  <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-semibold">
                    {formatDuration(shift.durationHours)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10">
                  <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Intervalo</p>
                  <p className="font-semibold">{shift.breakMinutes} min</p>
                </div>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="mt-6 pt-4 border-t">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Visualização do Turno (24h)
              </p>
              <ShiftTimelineBar
                startTime={shift.startTime}
                endTime={shift.endTime}
                isNightShift={shift.isNightShift}
                color={shift.color}
              />
            </div>
          </div>
        </Card>

        {/* Assignments */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Users className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">
                Funcionários Atribuídos
              </h3>
              <p className="text-sm text-muted-foreground">
                {assignmentCount} funcionário{assignmentCount !== 1 ? 's' : ''}{' '}
                vinculado{assignmentCount !== 1 ? 's' : ''}
              </p>
            </div>

            {canManage && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-2"
                onClick={() => setIsAssignOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Atribuir Funcionário
              </Button>
            )}
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            {assignments.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhum funcionário atribuído a este turno
                </p>
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setIsAssignOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Atribuir Primeiro Funcionário
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map(assignment => {
                  const employee = employeeMap.get(assignment.employeeId);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold dark:bg-slate-700">
                          {employee
                            ? employee.fullName
                                .split(' ')
                                .slice(0, 2)
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                            : '??'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {employee?.fullName ??
                              `ID: ${assignment.employeeId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee?.position && employee?.department
                              ? `${employee.position} · ${employee.department}`
                              : ''}
                            {employee?.position || employee?.department
                              ? ' · '
                              : ''}
                            Desde{' '}
                            {new Date(assignment.startDate).toLocaleDateString(
                              'pt-BR'
                            )}
                            {assignment.endDate &&
                              ` até ${new Date(
                                assignment.endDate
                              ).toLocaleDateString('pt-BR')}`}
                          </p>
                          {assignment.notes && (
                            <p className="mt-0.5 text-xs text-muted-foreground italic">
                              {assignment.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            assignment.isActive ? 'default' : 'secondary'
                          }
                        >
                          {assignment.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {canManage && assignment.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            onClick={() => {
                              setUnassignTarget(assignment.id);
                              setIsUnassignOpen(true);
                            }}
                            title="Remover do turno"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Assign Employee Modal */}
        <AssignEmployeeModal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          onSubmit={async data => {
            await shiftsApi.assignEmployee(shiftId, data);
            queryClient.invalidateQueries({
              queryKey: shiftKeys.assignments(shiftId),
            });
            queryClient.invalidateQueries({
              queryKey: shiftKeys.detail(shiftId),
            });
          }}
          shiftName={shift.name}
          excludeEmployeeIds={assignments
            .filter(a => a.isActive)
            .map(a => a.employeeId)}
        />

        {/* Unassign Confirmation */}
        <VerifyActionPinModal
          isOpen={isUnassignOpen}
          onClose={() => {
            setIsUnassignOpen(false);
            setUnassignTarget(null);
          }}
          onSuccess={handleUnassignConfirm}
          title="Remover Funcionário do Turno"
          description="Digite seu PIN de ação para remover este funcionário do turno."
        />
      </PageBody>
    </PageLayout>
  );
}
