/**
 * Planning Page — Planejamento de Produção
 * Gantt chart, programações e entradas de planejamento.
 */

'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CalendarRange,
  Calendar,
  ListChecks,
  Play,
  ClipboardList,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { GanttChart } from '@/components/production/gantt-chart';
import { usePermissions } from '@/hooks/use-permissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';

import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { schedulesService, workstationsService } from '@/services/production';
import type {
  ProductionSchedule,
  ScheduleEntry,
  ScheduleEntryStatus,
} from '@/types/production';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const ENTRY_STATUS_CONFIG: Record<
  ScheduleEntryStatus,
  { label: string; badgeClass: string }
> = {
  PLANNED: {
    label: 'Planejado',
    badgeClass:
      'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/8 dark:text-sky-300',
  },
  CONFIRMED: {
    label: 'Confirmado',
    badgeClass:
      'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/8 dark:text-violet-300',
  },
  IN_PROGRESS: {
    label: 'Em Andamento',
    badgeClass:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300',
  },
  COMPLETED: {
    label: 'Concluído',
    badgeClass:
      'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300',
  },
  CANCELLED: {
    label: 'Cancelado',
    badgeClass:
      'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300',
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Month navigation helpers
// ---------------------------------------------------------------------------

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlanningPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canAccess = hasPermission(PRODUCTION_PERMISSIONS.PLANNING.ACCESS);
  const canRegister = hasPermission(PRODUCTION_PERMISSIONS.PLANNING.REGISTER);

  const [activeTab, setActiveTab] = useState('cronograma');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Wizards & modals
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [createScheduleStep, setCreateScheduleStep] = useState(1);
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [createEntryStep, setCreateEntryStep] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProductionSchedule | null>(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState<ScheduleEntry | null>(null);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  // Entry form state
  const [entryForm, setEntryForm] = useState({
    title: '',
    scheduleId: '',
    workstationId: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED' as ScheduleEntryStatus,
    color: '',
    notes: '',
  });

  // ---- Data queries ---------------------------------------------------------

  const {
    data: schedules,
    isLoading: isLoadingSchedules,
  } = useQuery({
    queryKey: ['production', 'schedules'],
    queryFn: async () => {
      const res = await schedulesService.list();
      return res.schedules;
    },
  });

  const {
    data: allEntries,
    isLoading: isLoadingEntries,
  } = useQuery({
    queryKey: ['production', 'schedule-entries', selectedScheduleId],
    queryFn: async () => {
      const params =
        selectedScheduleId !== 'all'
          ? { scheduleId: selectedScheduleId }
          : undefined;
      const res = await schedulesService.listEntries(params);
      return res.entries;
    },
  });

  const { data: workstations } = useQuery({
    queryKey: ['production', 'workstations'],
    queryFn: async () => {
      const res = await workstationsService.list();
      return res.workstations;
    },
  });

  // ---- Mutations ------------------------------------------------------------

  const createScheduleMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => schedulesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'schedules'] });
      toast.success('Programação criada com sucesso');
      resetScheduleForm();
    },
    onError: () => toast.error('Erro ao criar programação'),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => schedulesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'schedules'] });
      queryClient.invalidateQueries({ queryKey: ['production', 'schedule-entries'] });
      toast.success('Programação excluída com sucesso');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao excluir programação'),
  });

  const createEntryMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => schedulesService.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'schedule-entries'] });
      toast.success('Entrada criada com sucesso');
      resetEntryForm();
    },
    onError: () => toast.error('Erro ao criar entrada'),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => schedulesService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'schedule-entries'] });
      toast.success('Entrada excluída com sucesso');
      setDeleteEntryTarget(null);
    },
    onError: () => toast.error('Erro ao excluir entrada'),
  });

  // ---- Derived data ---------------------------------------------------------

  const { start: monthStart, end: monthEnd } = useMemo(
    () => getMonthRange(currentMonth),
    [currentMonth],
  );

  const filteredEntries = useMemo(() => {
    if (!allEntries) return [];
    return allEntries.filter((e) => {
      const s = new Date(e.startDate);
      const ed = new Date(e.endDate);
      return ed >= monthStart && s <= monthEnd;
    });
  }, [allEntries, monthStart, monthEnd]);

  const workstationNameMap = useMemo(() => {
    if (!workstations) return {};
    const map: Record<string, string> = {};
    for (const ws of workstations) {
      map[ws.id] = ws.name;
    }
    return map;
  }, [workstations]);

  // Stats
  const totalSchedules = schedules?.length ?? 0;
  const activeSchedules = schedules?.filter((s) => s.isActive).length ?? 0;
  const plannedEntries = allEntries?.filter((e) => e.status === 'PLANNED').length ?? 0;
  const inProgressEntries = allEntries?.filter((e) => e.status === 'IN_PROGRESS').length ?? 0;

  // ---- Form helpers ---------------------------------------------------------

  function resetScheduleForm() {
    setShowCreateSchedule(false);
    setCreateScheduleStep(1);
    setScheduleForm({ name: '', description: '', startDate: '', endDate: '' });
  }

  function resetEntryForm() {
    setShowCreateEntry(false);
    setCreateEntryStep(1);
    setEntryForm({
      title: '',
      scheduleId: '',
      workstationId: '',
      startDate: '',
      endDate: '',
      status: 'PLANNED',
      color: '',
      notes: '',
    });
  }

  function handleSubmitSchedule() {
    createScheduleMutation.mutate({
      name: scheduleForm.name,
      description: scheduleForm.description || undefined,
      startDate: scheduleForm.startDate,
      endDate: scheduleForm.endDate,
    });
  }

  function handleSubmitEntry() {
    createEntryMutation.mutate({
      title: entryForm.title,
      scheduleId: entryForm.scheduleId,
      workstationId: entryForm.workstationId || undefined,
      startDate: entryForm.startDate,
      endDate: entryForm.endDate,
      status: entryForm.status,
      color: entryForm.color || undefined,
      notes: entryForm.notes || undefined,
    });
  }

  // ---- Month navigation -----------------------------------------------------

  function prevMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrentMonth(new Date());
  }

  // ---- Wizard steps ---------------------------------------------------------

  const scheduleWizardSteps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Nome e descrição da programação',
      icon: <ClipboardList className="h-12 w-12 text-violet-500" />,
      isValid: scheduleForm.name.trim().length > 0,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-name">Nome *</Label>
            <Input
              id="schedule-name"
              placeholder="Ex: Programação Abril 2026"
              value={scheduleForm.name}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-desc">Descrição</Label>
            <Textarea
              id="schedule-desc"
              placeholder="Descrição opcional"
              value={scheduleForm.description}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Período',
      description: 'Datas de início e fim da programação',
      icon: <CalendarRange className="h-12 w-12 text-violet-500" />,
      isValid:
        scheduleForm.startDate.length > 0 && scheduleForm.endDate.length > 0,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-start">Data de Início *</Label>
            <Input
              id="schedule-start"
              type="date"
              value={scheduleForm.startDate}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-end">Data de Fim *</Label>
            <Input
              id="schedule-end"
              type="date"
              value={scheduleForm.endDate}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex items-center gap-2 w-full justify-end">
          <Button
            variant="outline"
            onClick={() => setCreateScheduleStep(1)}
          >
            ← Voltar
          </Button>
          <Button
            disabled={
              !scheduleForm.startDate ||
              !scheduleForm.endDate ||
              createScheduleMutation.isPending
            }
            onClick={handleSubmitSchedule}
          >
            {createScheduleMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Criar Programação
          </Button>
        </div>
      ),
    },
  ];

  const entryWizardSteps: WizardStep[] = [
    {
      title: 'Detalhes da Entrada',
      description: 'Título, programação e estação de trabalho',
      icon: <Calendar className="h-12 w-12 text-emerald-500" />,
      isValid:
        entryForm.title.trim().length > 0 && entryForm.scheduleId.length > 0,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry-title">Título *</Label>
            <Input
              id="entry-title"
              placeholder="Ex: Corte CNC - Lote 42"
              value={entryForm.title}
              onChange={(e) =>
                setEntryForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Programação *</Label>
            <Select
              value={entryForm.scheduleId}
              onValueChange={(v) =>
                setEntryForm((f) => ({ ...f, scheduleId: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a programação" />
              </SelectTrigger>
              <SelectContent>
                {schedules?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estação de Trabalho</Label>
            <Select
              value={entryForm.workstationId}
              onValueChange={(v) =>
                setEntryForm((f) => ({ ...f, workstationId: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {workstations?.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: 'Datas e Status',
      description: 'Período, status e observações',
      icon: <Play className="h-12 w-12 text-emerald-500" />,
      isValid: entryForm.startDate.length > 0 && entryForm.endDate.length > 0,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-start">Data de Início *</Label>
              <Input
                id="entry-start"
                type="date"
                value={entryForm.startDate}
                onChange={(e) =>
                  setEntryForm((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-end">Data de Fim *</Label>
              <Input
                id="entry-end"
                type="date"
                value={entryForm.endDate}
                onChange={(e) =>
                  setEntryForm((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={entryForm.status}
              onValueChange={(v) =>
                setEntryForm((f) => ({
                  ...f,
                  status: v as ScheduleEntryStatus,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(ENTRY_STATUS_CONFIG) as [
                    ScheduleEntryStatus,
                    { label: string },
                  ][]
                ).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-notes">Observações</Label>
            <Textarea
              id="entry-notes"
              placeholder="Observações opcionais"
              value={entryForm.notes}
              onChange={(e) =>
                setEntryForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex items-center gap-2 w-full justify-end">
          <Button variant="outline" onClick={() => setCreateEntryStep(1)}>
            ← Voltar
          </Button>
          <Button
            disabled={
              !entryForm.startDate ||
              !entryForm.endDate ||
              createEntryMutation.isPending
            }
            onClick={handleSubmitEntry}
          >
            {createEntryMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Criar Entrada
          </Button>
        </div>
      ),
    },
  ];

  // ---- Render ---------------------------------------------------------------

  const isLoading = isLoadingSchedules || isLoadingEntries;

  return (
    <div className="space-y-6" data-testid="planning-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Produção', href: '/production' },
          { label: 'Planejamento', href: '/production/planning' },
        ]}
      />

      <PageHeroBanner
        title="Planejamento"
        description="Cronograma de produção, programações e acompanhamento de entradas planejadas."
        icon={CalendarRange}
        iconGradient="from-violet-500 to-purple-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-xs font-medium text-gray-500 dark:text-white/50">
            Total de Programações
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {isLoading ? '—' : totalSchedules}
          </p>
        </Card>
        <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-xs font-medium text-gray-500 dark:text-white/50">
            Programações Ativas
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {isLoading ? '—' : activeSchedules}
          </p>
        </Card>
        <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-xs font-medium text-gray-500 dark:text-white/50">
            Entradas Planejadas
          </p>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            {isLoading ? '—' : plannedEntries}
          </p>
        </Card>
        <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-xs font-medium text-gray-500 dark:text-white/50">
            Entradas em Andamento
          </p>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
            {isLoading ? '—' : inProgressEntries}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
          <TabsTrigger value="cronograma" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="programacoes" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Programações
          </TabsTrigger>
        </TabsList>

        {/* ---- Tab: Cronograma ---- */}
        <TabsContent value="cronograma" className="space-y-4">
          {/* Filter bar */}
          <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-full sm:w-[220px]">
                <Select
                  value={selectedScheduleId}
                  onValueChange={setSelectedScheduleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as programações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Todas as programações
                    </SelectItem>
                    {schedules?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month navigation */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2.5"
                  onClick={prevMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="text-sm font-medium text-gray-700 dark:text-white/80 min-w-[160px] text-center capitalize hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  {getMonthLabel(currentMonth)}
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2.5"
                  onClick={nextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {canRegister && (
                <Button
                  size="sm"
                  className="h-9 px-2.5 gap-1.5"
                  onClick={() => setShowCreateEntry(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nova Entrada
                </Button>
              )}
            </div>
          </Card>

          {/* Gantt Chart */}
          {isLoading ? (
            <Card className="flex items-center justify-center py-20 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </Card>
          ) : (
            <GanttChart
              entries={filteredEntries}
              startDate={monthStart}
              endDate={monthEnd}
              workstationNames={workstationNameMap}
              onEntryClick={(entry) => {
                // Could navigate to entry detail in the future
                toast.info(`Entrada: ${entry.title}`);
              }}
            />
          )}

          {/* Entry list below Gantt */}
          {!isLoading && filteredEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-white/70">
                Entradas no Período ({filteredEntries.length})
              </h3>
              <div className="grid gap-2">
                {filteredEntries.map((entry) => {
                  const statusCfg = ENTRY_STATUS_CONFIG[entry.status];
                  return (
                    <Card
                      key={entry.id}
                      className="p-3 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {entry.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/50">
                          {formatDate(entry.startDate)} — {formatDate(entry.endDate)}
                          {entry.workstationId &&
                            workstationNameMap[entry.workstationId] &&
                            ` · ${workstationNameMap[entry.workstationId]}`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusCfg.badgeClass}
                      >
                        {statusCfg.label}
                      </Badge>
                      {canRegister && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          onClick={() => setDeleteEntryTarget(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ---- Tab: Programações ---- */}
        <TabsContent value="programacoes" className="space-y-4">
          {canRegister && (
            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-9 px-2.5 gap-1.5"
                onClick={() => setShowCreateSchedule(true)}
              >
                <Plus className="h-4 w-4" />
                Nova Programação
              </Button>
            </div>
          )}

          {isLoadingSchedules ? (
            <Card className="flex items-center justify-center py-20 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </Card>
          ) : !schedules || schedules.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <ListChecks className="h-10 w-10 text-gray-300 dark:text-white/20 mb-3" />
              <p className="text-sm text-gray-500 dark:text-white/40">
                Nenhuma programação cadastrada.
              </p>
              {canRegister && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={() => setShowCreateSchedule(true)}
                >
                  <Plus className="h-4 w-4" />
                  Criar Programação
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {schedule.name}
                      </h4>
                      {schedule.description && (
                        <p className="text-xs text-gray-500 dark:text-white/50 mt-1 line-clamp-2">
                          {schedule.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        schedule.isActive
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300'
                          : 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300'
                      }
                    >
                      {schedule.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-white/50">
                    <p>
                      Período: {formatDateLong(schedule.startDate)} — {formatDateLong(schedule.endDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-white/5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex-1"
                      onClick={() => {
                        setSelectedScheduleId(schedule.id);
                        setActiveTab('cronograma');
                      }}
                    >
                      <CalendarRange className="h-3 w-3 mr-1" />
                      Ver Cronograma
                    </Button>
                    {canRegister && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        onClick={() => setDeleteTarget(schedule)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ---- Modals ---- */}

      {/* Create Schedule Wizard */}
      <StepWizardDialog
        open={showCreateSchedule}
        onOpenChange={(open) => {
          if (!open) resetScheduleForm();
        }}
        steps={scheduleWizardSteps}
        currentStep={createScheduleStep}
        onStepChange={setCreateScheduleStep}
        onClose={resetScheduleForm}
      />

      {/* Create Entry Wizard */}
      <StepWizardDialog
        open={showCreateEntry}
        onOpenChange={(open) => {
          if (!open) resetEntryForm();
        }}
        steps={entryWizardSteps}
        currentStep={createEntryStep}
        onStepChange={setCreateEntryStep}
        onClose={resetEntryForm}
      />

      {/* Delete Schedule PIN */}
      <VerifyActionPinModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          if (deleteTarget) deleteScheduleMutation.mutate(deleteTarget.id);
        }}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir a programação "${deleteTarget?.name}".`}
      />

      {/* Delete Entry PIN */}
      <VerifyActionPinModal
        isOpen={!!deleteEntryTarget}
        onClose={() => setDeleteEntryTarget(null)}
        onSuccess={() => {
          if (deleteEntryTarget) deleteEntryMutation.mutate(deleteEntryTarget.id);
        }}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir a entrada "${deleteEntryTarget?.title}".`}
      />
    </div>
  );
}
