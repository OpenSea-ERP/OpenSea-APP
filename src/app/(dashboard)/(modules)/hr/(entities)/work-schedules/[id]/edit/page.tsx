'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TimePicker } from '@/components/ui/time-picker';
import { logger } from '@/lib/logger';
import type { WorkSchedule, UpdateWorkScheduleData } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  Loader2,
  NotebookText,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deleteWorkSchedule, getDayLabel, WEEK_DAYS, workSchedulesApi } from '../../src';

// =============================================================================
// TYPES & HELPERS
// =============================================================================

type DayKey = (typeof WEEK_DAYS)[number];

interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
}

const WEEKDAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function calcDayMinutes(day: DaySchedule, breakMin: number): number {
  if (!day.enabled || !day.start || !day.end) return 0;
  const worked = timeToMinutes(day.end) - timeToMinutes(day.start);
  return Math.max(0, worked - breakMin);
}

function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function WorkScheduleEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scheduleId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [breakDuration, setBreakDuration] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [days, setDays] = useState<Record<DayKey, DaySchedule>>(
    {} as Record<DayKey, DaySchedule>
  );
  const [replicateMonday, setReplicateMonday] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Data fetching
  const { data: schedule, isLoading } = useQuery<WorkSchedule>({
    queryKey: ['work-schedules', scheduleId],
    queryFn: () => workSchedulesApi.get(scheduleId),
  });

  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setDescription(schedule.description ?? '');
      setBreakDuration(schedule.breakDuration);
      setIsActive(schedule.isActive);

      const newDays: Record<DayKey, DaySchedule> = {} as Record<DayKey, DaySchedule>;
      for (const day of WEEK_DAYS) {
        const startKey = `${day}Start` as keyof WorkSchedule;
        const endKey = `${day}End` as keyof WorkSchedule;
        const start = (schedule[startKey] as string | null) ?? '';
        const end = (schedule[endKey] as string | null) ?? '';
        newDays[day] = { start, end, enabled: !!start && !!end };
      }
      setDays(newDays);
    }
  }, [schedule]);

  // ==========================================================================
  // REPLICATE MONDAY
  // ==========================================================================

  const handleReplicateMondayChange = useCallback((enabled: boolean) => {
    setReplicateMonday(enabled);
    if (enabled) {
      setDays(prev => {
        const updated = { ...prev };
        for (const d of WEEKDAYS) {
          if (d === 'monday') continue;
          if (prev[d]?.enabled) {
            updated[d] = { ...prev[d], start: prev.monday.start, end: prev.monday.end };
          }
        }
        return updated;
      });
    }
  }, []);

  const handleUpdateDay = useCallback(
    (day: DayKey, field: keyof DaySchedule, value: string | boolean) => {
      if (field === 'enabled') {
        setDays(prev => {
          const updated = { ...prev, [day]: { ...prev[day], enabled: value } };
          if (value && replicateMonday && day !== 'monday' && WEEKDAYS.includes(day) && prev.monday) {
            updated[day] = { ...updated[day], start: prev.monday.start, end: prev.monday.end };
          }
          return updated;
        });
        return;
      }

      if (day === 'monday' && replicateMonday) {
        setDays(prev => {
          const updated = { ...prev };
          updated.monday = { ...prev.monday, [field]: value };
          for (const d of WEEKDAYS) {
            if (d === 'monday') continue;
            if (prev[d]?.enabled) {
              updated[d] = { ...prev[d], [field]: value };
            }
          }
          return updated;
        });
      } else {
        if (replicateMonday && day !== 'monday' && WEEKDAYS.includes(day)) {
          setReplicateMonday(false);
        }
        setDays(prev => ({
          ...prev,
          [day]: { ...prev[day], [field]: value },
        }));
      }
    },
    [replicateMonday]
  );

  // ==========================================================================
  // CALCULATIONS
  // ==========================================================================

  const dayMinutes = useMemo(() => {
    const result: Record<string, number> = {};
    for (const day of WEEK_DAYS) {
      result[day] = days[day] ? calcDayMinutes(days[day], breakDuration) : 0;
    }
    return result;
  }, [days, breakDuration]);

  const totalWeeklyMinutes = useMemo(
    () => Object.values(dayMinutes).reduce((sum, m) => sum + m, 0),
    [dayMinutes]
  );

  const enabledDaysCount = WEEK_DAYS.filter(d => days[d]?.enabled).length;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSave = async () => {
    if (!schedule || name.trim().length < 2) return;

    setIsSaving(true);
    try {
      const data: UpdateWorkScheduleData = {
        name,
        description: description || undefined,
        breakDuration,
        isActive,
      };

      for (const day of WEEK_DAYS) {
        const d = days[day];
        const startKey = `${day}Start` as keyof UpdateWorkScheduleData;
        const endKey = `${day}End` as keyof UpdateWorkScheduleData;
        if (d?.enabled && d.start && d.end) {
          (data as Record<string, unknown>)[startKey] = d.start;
          (data as Record<string, unknown>)[endKey] = d.end;
        } else {
          (data as Record<string, unknown>)[startKey] = null;
          (data as Record<string, unknown>)[endKey] = null;
        }
      }

      await workSchedulesApi.update(scheduleId, data);
      await queryClient.invalidateQueries({ queryKey: ['work-schedules'] });
      toast.success('Escala de trabalho atualizada com sucesso!');
      router.push(`/hr/work-schedules/${scheduleId}`);
    } catch (error) {
      logger.error('Erro ao salvar escala de trabalho', error instanceof Error ? error : undefined);
      toast.error('Erro ao salvar escala de trabalho');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!schedule) return;
    try {
      await deleteWorkSchedule(schedule.id);
      await queryClient.invalidateQueries({ queryKey: ['work-schedules'] });
      toast.success('Escala de trabalho excluída com sucesso!');
      router.push('/hr/work-schedules');
    } catch (error) {
      logger.error('Erro ao excluir escala de trabalho', error instanceof Error ? error : undefined);
      toast.error('Erro ao excluir escala de trabalho');
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'delete',
      title: 'Excluir',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'default',
      className:
        'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
    },
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSave,
      variant: 'default',
      disabled: isSaving || !name.trim(),
    },
  ];

  // ==========================================================================
  // LOADING / NOT FOUND
  // ==========================================================================

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

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Escalas de Trabalho', href: '/hr/work-schedules' },
            { label: schedule.name, href: `/hr/work-schedules/${scheduleId}` },
            { label: 'Editar' },
          ]}
          buttons={actionButtons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando escala</p>
              <h1 className="text-xl font-bold truncate">{schedule.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        {/* Mobile status toggle */}
        <div className="grid grid-cols-1 sm:hidden gap-4 mb-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Status</Label>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full h-12 mb-4 grid-cols-2">
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="schedule">Jornada Semanal</TabsTrigger>
          </TabsList>

          {/* Tab 1: Geral */}
          <TabsContent value="general" className="flex-col w-full space-y-6">
            <Card className="bg-white/5 overflow-hidden py-2">
              <div className="space-y-8 px-6 py-4">
                <div className="space-y-5">
                  <SectionHeader
                    icon={NotebookText}
                    title="Dados da Escala"
                    subtitle="Informações básicas de identificação"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Nome <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="Ex: Comercial, Administrativo"
                          value={name}
                          onChange={e => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          id="description"
                          placeholder="Descreva a escala de trabalho"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 2: Jornada Semanal */}
          <TabsContent value="schedule" className="flex-col w-full space-y-6">
            <Card className="bg-white/5 overflow-hidden py-2">
              <div className="space-y-8 px-6 py-4">
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-5 w-5 text-foreground" />
                        <div>
                          <h3 className="text-base font-semibold">Horários</h3>
                          <p className="text-sm text-muted-foreground">Defina os horários de entrada e saída de cada dia</p>
                        </div>
                      </div>
                      <div className="border-b border-border" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 h-[42px]">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Intervalo</p>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            max={480}
                            value={breakDuration}
                            onChange={e => setBreakDuration(Number(e.target.value))}
                            className="w-[4.5rem] h-7 text-xs px-2 pr-7 text-center"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            min
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 h-[42px]">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Replicar Seg.</p>
                        <Switch
                          checked={replicateMonday}
                          onCheckedChange={handleReplicateMondayChange}
                          className="scale-90"
                        />
                      </div>
                      <div className="rounded-lg bg-muted/60 px-3 h-[42px] flex flex-col items-center justify-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
                          Dias
                        </p>
                        <p className="text-base font-semibold tabular-nums leading-none">
                          {enabledDaysCount}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/60 px-3 h-[42px] flex flex-col items-center justify-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
                          Horas/Sem.
                        </p>
                        <p className="text-base font-semibold tabular-nums leading-none">
                          {totalWeeklyMinutes > 0 ? formatHoursMinutes(totalWeeklyMinutes) : '0h'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Day rows */}
                  <div className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60">
                    <div className="space-y-1.5">
                      {WEEK_DAYS.map(day => {
                        const d = days[day];
                        if (!d) return null;
                        const dailyMin = dayMinutes[day];

                        return (
                          <div
                            key={day}
                            className={`flex items-center gap-3 h-11 px-3 rounded-lg border transition-colors ${
                              d.enabled
                                ? 'bg-background border-border'
                                : 'bg-muted/50 border-transparent'
                            }`}
                          >
                            <Switch
                              checked={d.enabled}
                              onCheckedChange={checked =>
                                handleUpdateDay(day, 'enabled', checked)
                              }
                              className="scale-90"
                            />
                            <span className={`inline-flex items-center justify-center w-20 h-7 rounded-md text-xs font-semibold ${
                              d.enabled
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                : 'bg-slate-100/60 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500'
                            }`}>
                              {getDayLabel(day)}
                            </span>
                            {d.enabled ? (
                              <>
                                <div className="flex items-center gap-1.5 flex-1">
                                  <TimePicker
                                    value={d.start}
                                    onChange={v => handleUpdateDay(day, 'start', v)}
                                  />
                                  <span className="text-muted-foreground text-xs">até</span>
                                  <TimePicker
                                    value={d.end}
                                    onChange={v => handleUpdateDay(day, 'end', v)}
                                  />
                                </div>
                                <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                                  {dailyMin > 0 ? formatHoursMinutes(dailyMin) : '-'}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground italic flex-1">
                                Folga
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Escala de Trabalho"
        description={`Digite seu PIN de ação para excluir a escala "${schedule.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
