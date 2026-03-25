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
import type { WorkSchedule } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CalendarDays,
  Clock,
  Coffee,
  Edit,
  NotebookText,
  Timer,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  formatWeeklyHours,
  getDayLabel,
  getDaySchedule,
  WEEK_DAYS,
  workSchedulesApi,
} from '../src';

type DayKey = (typeof WEEK_DAYS)[number];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export default function WorkScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;

  const { data: schedule, isLoading } = useQuery<WorkSchedule>({
    queryKey: ['work-schedules', scheduleId],
    queryFn: () => workSchedulesApi.get(scheduleId),
  });

  // Calculate per-day hours
  const dayData = useMemo(() => {
    if (!schedule) return [];

    return WEEK_DAYS.map(day => {
      const { start, end } = getDaySchedule(schedule, day);
      const isWorking = !!start && !!end;
      let minutes = 0;
      if (isWorking) {
        const worked = timeToMinutes(end!) - timeToMinutes(start!);
        minutes = Math.max(0, worked - schedule.breakDuration);
      }
      return {
        day: day as DayKey,
        label: getDayLabel(day),
        start,
        end,
        isWorking,
        minutes,
      };
    });
  }, [schedule]);

  const handleEdit = () => {
    router.push(`/hr/work-schedules/${scheduleId}/edit`);
  };



  // Loading
  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Escalas de Trabalho', href: '/hr/work-schedules' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!schedule) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Escalas de Trabalho', href: '/hr/work-schedules' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Escala de trabalho não encontrada
            </h2>
            <Button onClick={() => router.push('/hr/work-schedules')}>
              Voltar para Escalas de Trabalho
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const workDaysCount = dayData.filter(d => d.isWorking).length;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Escalas de Trabalho', href: '/hr/work-schedules' },
            { label: schedule.name },
          ]}
          buttons={[
            {
              id: 'edit',
              title: 'Editar',
              icon: Edit,
              onClick: handleEdit,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-indigo-500 to-violet-600">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {schedule.name}
                </h1>
                <Badge variant={schedule.isActive ? 'success' : 'secondary'}>
                  {schedule.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {schedule.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {schedule.description}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {schedule.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span>
                    {new Date(schedule.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {schedule.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(schedule.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Resumo */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Resumo da Escala
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Horas Semanais"
              value={formatWeeklyHours(schedule.weeklyHours)}
              badge={
                <Badge variant="outline" className="gap-1">
                  <Timer className="h-3 w-3" />
                  {formatWeeklyHours(schedule.weeklyHours)}
                </Badge>
              }
            />
            <InfoField
              label="Dias de Trabalho"
              value={`${workDaysCount} dias`}
              badge={
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {workDaysCount} dias
                </Badge>
              }
            />
            <InfoField
              label="Intervalo"
              value={`${schedule.breakDuration} minutos`}
              badge={
                <Badge variant="outline" className="gap-1">
                  <Coffee className="h-3 w-3" />
                  {schedule.breakDuration}min
                </Badge>
              }
            />
          </div>
        </Card>

        {/* Jornada Semanal */}
        <Card className="bg-white/5 overflow-hidden py-2">
          <div className="space-y-5 px-6 py-4">
            {/* Section header with pills */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-foreground" />
                  <div>
                    <h3 className="text-base font-semibold">Jornada Semanal</h3>
                    <p className="text-sm text-muted-foreground">Horários de trabalho por dia da semana</p>
                  </div>
                </div>
                <div className="border-b border-border" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="rounded-lg bg-muted/60 px-3 h-[42px] flex flex-col items-center justify-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">Intervalo</p>
                  <p className="text-base font-semibold tabular-nums leading-none">{schedule.breakDuration}min</p>
                </div>
                <div className="rounded-lg bg-muted/60 px-3 h-[42px] flex flex-col items-center justify-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">Dias</p>
                  <p className="text-base font-semibold tabular-nums leading-none">{workDaysCount}</p>
                </div>
                <div className="rounded-lg bg-muted/60 px-3 h-[42px] flex flex-col items-center justify-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">Horas/Sem.</p>
                  <p className="text-base font-semibold tabular-nums leading-none">
                    {formatWeeklyHours(schedule.weeklyHours)}
                  </p>
                </div>
              </div>
            </div>

            {/* Day cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {dayData.map(({ day, label, start, end, isWorking, minutes }) => (
                <div
                  key={day}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    isWorking
                      ? 'bg-white border-border dark:bg-slate-800/60'
                      : 'bg-muted/40 border-transparent'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-full h-7 rounded-md text-xs font-semibold mb-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {label}
                  </span>

                  {isWorking ? (
                    <>
                      <p className="text-lg font-bold tabular-nums leading-none mb-1">
                        {formatHoursMinutes(minutes)}
                      </p>
                      <p className="text-[11px] tabular-nums text-muted-foreground">
                        {start} – {end}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Folga
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </PageBody>

    </PageLayout>
  );
}
