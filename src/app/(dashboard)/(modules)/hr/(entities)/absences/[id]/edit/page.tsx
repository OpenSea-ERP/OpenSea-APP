/**
 * OpenSea OS - Absence Edit Page
 * Follows pattern: PageLayout > PageActionBar (Delete + Save) > Identity Card > Section Cards
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Card } from '@/components/ui/card';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import type { Absence, AbsenceType } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarOff,
  FileText,
  Loader2,
  MessageSquareText,
  NotebookText,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  absencesApi,
  absenceKeys,
  getTypeLabel,
  getStatusLabel,
  getStatusColor,
  useUpdateAbsence,
  useDeleteAbsence,
} from '../../src';

// =============================================================================
// ABSENCE TYPE OPTIONS
// =============================================================================

const ABSENCE_TYPE_OPTIONS: { value: AbsenceType; label: string }[] = [
  { value: 'SICK_LEAVE', label: 'Atestado M\u00e9dico' },
  { value: 'PERSONAL_LEAVE', label: 'Licen\u00e7a Pessoal' },
  { value: 'MATERNITY_LEAVE', label: 'Licen\u00e7a Maternidade' },
  { value: 'PATERNITY_LEAVE', label: 'Licen\u00e7a Paternidade' },
  { value: 'BEREAVEMENT_LEAVE', label: 'Licen\u00e7a Nojo' },
  { value: 'WEDDING_LEAVE', label: 'Licen\u00e7a Casamento' },
  { value: 'MEDICAL_APPOINTMENT', label: 'Consulta M\u00e9dica' },
  { value: 'JURY_DUTY', label: 'J\u00fari/Convoca\u00e7\u00e3o' },
  { value: 'UNPAID_LEAVE', label: 'Licen\u00e7a n\u00e3o Remunerada' },
  { value: 'OTHER', label: 'Outro' },
];

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
// PAGE
// =============================================================================

export default function AbsenceEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const absenceId = params.id as string;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    type: '' as AbsenceType | '',
    startDate: '',
    endDate: '',
    reason: '',
    notes: '',
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data: absence, isLoading } = useQuery<Absence>({
    queryKey: absenceKeys.detail(absenceId),
    queryFn: async () => {
      const response = await absencesApi.get(absenceId);
      return response.absence;
    },
  });

  const { getName } = useEmployeeMap(absence ? [absence.employeeId] : []);

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const updateMutation = useUpdateAbsence();
  const deleteMutation = useDeleteAbsence({
    onSuccess: () => {
      router.push('/hr/absences');
    },
  });

  // ==========================================================================
  // COMPUTED
  // ==========================================================================

  const isEditable = absence?.status === 'PENDING';

  const formatDatePtBr = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR');

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (absence) {
      setFormData({
        type: absence.type,
        startDate: absence.startDate ? absence.startDate.slice(0, 10) : '',
        endDate: absence.endDate ? absence.endDate.slice(0, 10) : '',
        reason: absence.reason || '',
        notes: absence.notes || '',
      });
    }
  }, [absence]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!formData.type) {
      setFieldErrors({ type: 'O tipo de aus\u00eancia \u00e9 obrigat\u00f3rio.' });
      return;
    }

    if (!formData.startDate) {
      setFieldErrors({ startDate: 'A data de in\u00edcio \u00e9 obrigat\u00f3ria.' });
      return;
    }

    if (!formData.endDate) {
      setFieldErrors({ endDate: 'A data de t\u00e9rmino \u00e9 obrigat\u00f3ria.' });
      return;
    }

    if (formData.startDate > formData.endDate) {
      setFieldErrors({
        endDate: 'A data de t\u00e9rmino deve ser posterior \u00e0 data de in\u00edcio.',
      });
      return;
    }

    try {
      setIsSaving(true);
      setFieldErrors({});
      await updateMutation.mutateAsync({
        id: absenceId,
        data: {
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason || undefined,
          notes: formData.notes || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: absenceKeys.lists() });
      await queryClient.invalidateQueries({
        queryKey: absenceKeys.detail(absenceId),
      });
      toast.success('Aus\u00eancia atualizada com sucesso!');
      router.push(`/hr/absences/${absenceId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar ausência',
        err instanceof Error ? err : undefined
      );
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(translateError(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!absence) return;
    try {
      await deleteMutation.mutateAsync(absence.id);
      setDeleteModalOpen(false);
    } catch (err) {
      logger.error(
        'Erro ao excluir ausência',
        err instanceof Error ? err : undefined
      );
      toast.error(translateError(err));
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = isEditable
    ? [
        {
          id: 'cancel',
          title: 'Cancelar',
          onClick: () => router.push(`/hr/absences/${absenceId}`),
          variant: 'ghost',
        },
        {
          id: 'delete',
          title: 'Excluir',
          icon: Trash2,
          onClick: () => setDeleteModalOpen(true),
          variant: 'default' as const,
          className:
            'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-rose-600',
        },
        {
          id: 'save',
          title: isSaving ? 'Salvando...' : 'Salvar Altera\u00e7\u00f5es',
          icon: isSaving ? Loader2 : Save,
          onClick: handleSubmit,
          variant: 'default',
          disabled: isSaving,
        },
      ]
    : [
        {
          id: 'back',
          title: 'Voltar',
          onClick: () => router.push(`/hr/absences/${absenceId}`),
          variant: 'ghost',
        },
      ];

  // ==========================================================================
  // BREADCRUMBS
  // ==========================================================================

  const breadcrumbItems = [
    { label: 'RH', href: '/hr' },
    { label: 'Aus\u00eancias', href: '/hr/absences' },
    {
      label: absence ? getTypeLabel(absence.type) : '...',
      href: `/hr/absences/${absenceId}`,
    },
    { label: 'Editar' },
  ];

  // ==========================================================================
  // LOADING / ERROR
  // ==========================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!absence) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Aus\u00eancia n\u00e3o encontrada"
            message="A aus\u00eancia solicitada n\u00e3o foi encontrada."
            action={{
              label: 'Voltar para Aus\u00eancias',
              onClick: () => router.push('/hr/absences'),
            }}
          />
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
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Non-editable alert */}
        {!isEditable && (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  N\u00e3o \u00e9 poss\u00edvel editar esta aus\u00eancia
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400/80">
                  Esta aus\u00eancia est\u00e1 com status{' '}
                  <span className="font-semibold">
                    {getStatusLabel(absence.status)}
                  </span>{' '}
                  e n\u00e3o pode ser modificada.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-orange-600 shadow-lg">
              <CalendarOff className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando aus\u00eancia
              </p>
              <h1 className="text-xl font-bold truncate">
                {getTypeLabel(absence.type)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {getName(absence.employeeId)} \u00b7{' '}
                {formatDatePtBr(absence.startDate)} \u2014 {formatDatePtBr(absence.endDate)}
              </p>
            </div>
            <div className="shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(absence.status)}`}
              >
                {getStatusLabel(absence.status)}
              </span>
            </div>
          </div>
        </Card>

        {/* Section: Dados da Aus\u00eancia */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Dados da Aus\u00eancia"
                subtitle="Tipo, per\u00edodo e informa\u00e7\u00f5es principais"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Tipo */}
                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        id="type"
                        value={formData.type}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            type: e.target.value as AbsenceType,
                          });
                          if (fieldErrors.type)
                            setFieldErrors(prev => ({ ...prev, type: '' }));
                        }}
                        disabled={!isEditable}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-invalid={!!fieldErrors.type}
                      >
                        <option value="">Selecione o tipo</option>
                        {ABSENCE_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.type && (
                        <FormErrorIcon message={fieldErrors.type} />
                      )}
                    </div>
                  </div>

                  {/* Data de In\u00edcio */}
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">
                      Data de In\u00edcio <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          });
                          if (fieldErrors.startDate)
                            setFieldErrors(prev => ({
                              ...prev,
                              startDate: '',
                            }));
                        }}
                        disabled={!isEditable}
                        aria-invalid={!!fieldErrors.startDate}
                      />
                      {fieldErrors.startDate && (
                        <FormErrorIcon message={fieldErrors.startDate} />
                      )}
                    </div>
                  </div>

                  {/* Data de T\u00e9rmino */}
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">
                      Data de T\u00e9rmino <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            endDate: e.target.value,
                          });
                          if (fieldErrors.endDate)
                            setFieldErrors(prev => ({ ...prev, endDate: '' }));
                        }}
                        disabled={!isEditable}
                        aria-invalid={!!fieldErrors.endDate}
                      />
                      {fieldErrors.endDate && (
                        <FormErrorIcon message={fieldErrors.endDate} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Justificativa */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FileText}
                title="Justificativa"
                subtitle="Motivo ou justificativa da aus\u00eancia"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={e =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Descreva o motivo da aus\u00eancia"
                    rows={4}
                    disabled={!isEditable}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Observa\u00e7\u00f5es */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={MessageSquareText}
                title="Observa\u00e7\u00f5es"
                subtitle="Notas adicionais sobre a aus\u00eancia"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observa\u00e7\u00f5es</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Informa\u00e7\u00f5es adicionais"
                    rows={3}
                    disabled={!isEditable}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Aus\u00eancia"
        description={`Digite seu PIN de a\u00e7\u00e3o para excluir esta aus\u00eancia (${getTypeLabel(absence.type)}). Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.`}
      />
    </PageLayout>
  );
}
