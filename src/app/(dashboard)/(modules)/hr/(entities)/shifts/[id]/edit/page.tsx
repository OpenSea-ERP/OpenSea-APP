'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { translateError } from '@/lib/error-messages';
import type { ShiftType, UpdateShiftData } from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Info, Loader2, Moon, Save, Timer, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { shiftsApi, shiftKeys, SHIFT_TYPE_LABELS } from '../../src';

const SHIFT_TYPE_OPTIONS: { value: ShiftType; label: string }[] = [
  { value: 'FIXED', label: 'Fixo' },
  { value: 'ROTATING', label: 'Rotativo' },
  { value: 'FLEXIBLE', label: 'Flexível' },
  { value: 'ON_CALL', label: 'Sobreaviso' },
];

/**
 * Converts a time string "HH:MM" to a percentage offset in a 24h bar
 */
function timeToPercent(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return ((h * 60 + m) / (24 * 60)) * 100;
}

function formatDuration(
  startTime: string,
  endTime: string,
  breakMin: number
): string {
  if (!startTime || !endTime) return '--';
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  const total = end - start - breakMin;
  if (total <= 0) return '--';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function EditTimelinePreview({
  startTime,
  endTime,
  isNightShift,
  color,
}: {
  startTime: string;
  endTime: string;
  isNightShift: boolean;
  color: string;
}) {
  if (!startTime || !endTime) return null;

  const startPct = timeToPercent(startTime);
  const endPct = timeToPercent(endTime);
  const isOvernight = endPct <= startPct;
  const barColor = color || (isNightShift ? '#6366f1' : '#0ea5e9');

  const hours = Array.from({ length: 7 }, (_, i) => i * 4);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Pré-visualização do Turno (24h)
      </p>
      <div className="relative h-8 w-full rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {isOvernight ? (
          <>
            <div
              className="absolute inset-y-0 rounded-l-md opacity-80"
              style={{
                left: `${startPct}%`,
                right: '0%',
                backgroundColor: barColor,
              }}
            />
            <div
              className="absolute inset-y-0 rounded-r-md opacity-80"
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
        {hours.map(hour => (
          <div
            key={hour}
            className="absolute top-0 bottom-0 border-l border-slate-300/50 dark:border-slate-600/50"
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}
      </div>
      <div className="relative flex text-[10px] text-muted-foreground h-3">
        {hours.map(hour => (
          <span
            key={hour}
            className="absolute tabular-nums"
            style={{
              left: `${(hour / 24) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {String(hour).padStart(2, '0')}h
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EditShiftPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const shiftId = params.id as string;

  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(HR_PERMISSIONS.SHIFTS.REMOVE);
  const canSave = hasPermission(HR_PERMISSIONS.SHIFTS.MODIFY);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<ShiftType>('FIXED');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('60');
  const [isNightShift, setIsNightShift] = useState(false);
  const [color, setColor] = useState('#6366F1');
  const [isActive, setIsActive] = useState(true);

  const {
    data: shiftData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: shiftKeys.detail(shiftId),
    queryFn: async () => shiftsApi.get(shiftId),
    enabled: !!shiftId,
  });

  const shift = shiftData?.shift;

  // Populate form when data loads
  useEffect(() => {
    if (shift) {
      setName(shift.name);
      setCode(shift.code ?? '');
      setType(shift.type);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
      setBreakMinutes(String(shift.breakMinutes));
      setIsNightShift(shift.isNightShift);
      setColor(shift.color ?? '#6366F1');
      setIsActive(shift.isActive);
    }
  }, [shift]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateShiftData) => {
      return shiftsApi.update(shiftId, data);
    },
    onSuccess: () => {
      toast.success('Turno atualizado com sucesso');
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
      router.push(`/hr/shifts/${shiftId}`);
    },
    onError: err => {
      toast.error(translateError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return shiftsApi.delete(shiftId);
    },
    onSuccess: () => {
      toast.success('Turno excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
      router.push('/hr/shifts');
    },
    onError: err => {
      toast.error(translateError(err));
    },
  });

  const durationPreview = useMemo(
    () => formatDuration(startTime, endTime, Number(breakMinutes) || 0),
    [startTime, endTime, breakMinutes]
  );

  function handleSave() {
    updateMutation.mutate({
      name,
      code: code || null,
      type,
      startTime,
      endTime,
      breakMinutes: Number(breakMinutes) || 60,
      isNightShift,
      color: color || null,
      isActive,
    });
  }

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
            message="Não foi possível carregar o turno para edição."
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

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Turnos', href: '/hr/shifts' },
            { label: shift.name, href: `/hr/shifts/${shiftId}` },
            { label: 'Editar' },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete-shift' as const,
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteModalOpen(true),
                    variant: 'default' as const,
                    className:
                      'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-rose-600',
                  },
                ]
              : []),
            ...(canSave
              ? [
                  {
                    id: 'save-shift' as const,
                    title: 'Salvar',
                    icon: updateMutation.isPending ? Loader2 : Save,
                    onClick: handleSave,
                    variant: 'default' as const,
                    disabled:
                      updateMutation.isPending ||
                      !name ||
                      !startTime ||
                      !endTime,
                  },
                ]
              : []),
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              }}
            >
              {isNightShift ? (
                <Moon className="h-7 w-7 text-white" />
              ) : (
                <Clock className="h-7 w-7 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{name || shift.name}</h1>
              <p className="text-sm text-muted-foreground">
                Criado em{' '}
                {new Date(shift.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          {/* Section: General Information */}
          <div className="space-y-5 px-6 py-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-foreground" />
              <div>
                <h3 className="text-base font-semibold">Informações Gerais</h3>
                <p className="text-sm text-muted-foreground">
                  Nome, código e tipo do turno
                </p>
              </div>
            </div>
            <div className="border-b border-border" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Nome do Turno <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Turno da Manhã"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-code">Código</Label>
                  <Input
                    id="edit-code"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Ex: TM01"
                    maxLength={32}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Tipo de Turno <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={type}
                    onValueChange={v => setType(v as ShiftType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-color">Cor</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="edit-color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-md border border-input"
                    />
                    <span className="text-sm text-muted-foreground">
                      {color}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Turnos inativos não aceitam novas atribuições
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>

          {/* Section: Schedule */}
          <div className="space-y-5 px-6 py-4 border-t">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-foreground" />
              <div>
                <h3 className="text-base font-semibold">Horários</h3>
                <p className="text-sm text-muted-foreground">
                  Início, término e intervalo do turno
                </p>
              </div>
            </div>
            <div className="border-b border-border" />

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start">
                    Hora de Início <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="edit-start"
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-end">
                    Hora de Término <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="edit-end"
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-break">Intervalo (min)</Label>
                  <Input
                    id="edit-break"
                    type="number"
                    min={0}
                    max={480}
                    value={breakMinutes}
                    onChange={e => setBreakMinutes(e.target.value)}
                  />
                </div>
              </div>

              {/* Duration preview */}
              {startTime && endTime && (
                <div className="rounded-lg bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground">
                      Duração líquida:{' '}
                      <span className="font-semibold text-foreground">
                        {durationPreview}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Tipo:{' '}
                      <span className="font-semibold text-foreground">
                        {SHIFT_TYPE_LABELS[type]}
                      </span>
                    </span>
                    {isNightShift && (
                      <span className="text-muted-foreground">
                        <Moon className="inline-block mr-1 h-3.5 w-3.5" />
                        Noturno
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-sm font-medium">Turno noturno</Label>
                  <p className="text-xs text-muted-foreground">
                    Marque se o turno ocorre predominantemente no período
                    noturno (22h às 5h)
                  </p>
                </div>
                <Switch
                  checked={isNightShift}
                  onCheckedChange={setIsNightShift}
                />
              </div>

              {/* Timeline Preview */}
              <EditTimelinePreview
                startTime={startTime}
                endTime={endTime}
                isNightShift={isNightShift}
                color={color}
              />
            </div>
          </div>
        </Card>

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={() => deleteMutation.mutate()}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este turno. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
