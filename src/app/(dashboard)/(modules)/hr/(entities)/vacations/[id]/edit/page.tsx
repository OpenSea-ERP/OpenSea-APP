/**
 * OpenSea OS - Vacation Period Edit Page
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
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '../../../../_shared/constants/hr-permissions';
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import type { VacationPeriod } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  Loader2,
  MessageSquareText,
  Palmtree,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  vacationsApi,
  vacationKeys,
  formatDate,
  getStatusLabel,
  getStatusColor,
  useUpdateVacation,
  useDeleteVacation,
} from '../../src';

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

export default function VacationEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const vacationId = params.id as string;
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(HR_PERMISSIONS.VACATIONS.DELETE);

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data: vacation, isLoading } = useQuery<VacationPeriod>({
    queryKey: vacationKeys.detail(vacationId),
    queryFn: async () => {
      const response = await vacationsApi.get(vacationId);
      return response.vacationPeriod;
    },
  });

  const { getName } = useEmployeeMap(vacation ? [vacation.employeeId] : []);

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const updateMutation = useUpdateVacation();
  const deleteMutation = useDeleteVacation({
    onSuccess: () => {
      router.push('/hr/vacations');
    },
  });

  // ==========================================================================
  // COMPUTED
  // ==========================================================================

  const isEditable =
    vacation?.status === 'PENDING' || vacation?.status === 'SCHEDULED';

  const calculatedDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff >= 0 ? diff + 1 : 0;
  }, [formData.startDate, formData.endDate]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (vacation) {
      setFormData({
        startDate: vacation.scheduledStart
          ? vacation.scheduledStart.slice(0, 10)
          : vacation.acquisitionStart
            ? vacation.acquisitionStart.slice(0, 10)
            : '',
        endDate: vacation.scheduledEnd
          ? vacation.scheduledEnd.slice(0, 10)
          : vacation.acquisitionEnd
            ? vacation.acquisitionEnd.slice(0, 10)
            : '',
        notes: vacation.notes || '',
      });
    }
  }, [vacation]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!formData.startDate) {
      setFieldErrors({
        startDate: 'A data de in\u00edcio \u00e9 obrigat\u00f3ria.',
      });
      return;
    }

    if (!formData.endDate) {
      setFieldErrors({
        endDate: 'A data de t\u00e9rmino \u00e9 obrigat\u00f3ria.',
      });
      return;
    }

    if (formData.startDate > formData.endDate) {
      setFieldErrors({
        endDate:
          'A data de t\u00e9rmino deve ser posterior \u00e0 data de in\u00edcio.',
      });
      return;
    }

    try {
      setIsSaving(true);
      setFieldErrors({});
      await updateMutation.mutateAsync({
        id: vacationId,
        data: {
          startDate: formData.startDate,
          endDate: formData.endDate,
          totalDays: calculatedDays,
          notes: formData.notes || undefined,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: vacationKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: vacationKeys.detail(vacationId),
      });
      toast.success('Per\u00edodo de f\u00e9rias atualizado com sucesso!');
      router.push(`/hr/vacations/${vacationId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar período de férias',
        err instanceof Error ? err : undefined
      );
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(translateError(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!vacation) return;
    try {
      await deleteMutation.mutateAsync(vacation.id);
      setDeleteModalOpen(false);
    } catch (err) {
      logger.error(
        'Erro ao excluir período de férias',
        err instanceof Error ? err : undefined
      );
      toast.error(translateError(err));
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = isEditable
    ? ([
        {
          id: 'cancel',
          title: 'Cancelar',
          onClick: () => router.push(`/hr/vacations/${vacationId}`),
          variant: 'ghost',
        },
        canDelete && {
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
      ].filter(Boolean) as HeaderButton[])
    : [
        {
          id: 'back',
          title: 'Voltar',
          onClick: () => router.push(`/hr/vacations/${vacationId}`),
          variant: 'ghost',
        },
      ];

  // ==========================================================================
  // BREADCRUMBS
  // ==========================================================================

  const breadcrumbItems = [
    { label: 'RH', href: '/hr' },
    { label: 'F\u00e9rias', href: '/hr/vacations' },
    {
      label: vacation ? getName(vacation.employeeId) : '...',
      href: `/hr/vacations/${vacationId}`,
    },
    { label: 'Editar' },
  ];

  // ==========================================================================
  // LOADING / ERROR
  // ==========================================================================

  if (isLoading) {
    return (
      <PageLayout data-testid="vacations-edit-page">
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!vacation) {
    return (
      <PageLayout data-testid="vacations-edit-page">
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Per\u00edodo de f\u00e9rias n\u00e3o encontrado"
            message="O per\u00edodo de f\u00e9rias solicitado n\u00e3o foi encontrado."
            action={{
              label: 'Voltar para F\u00e9rias',
              onClick: () => router.push('/hr/vacations'),
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
    <PageLayout data-testid="vacations-edit-page">
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
                  N\u00e3o \u00e9 poss\u00edvel editar este per\u00edodo de
                  f\u00e9rias
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400/80">
                  Este per\u00edodo est\u00e1 com status{' '}
                  <span className="font-semibold">
                    {getStatusLabel(vacation.status)}
                  </span>{' '}
                  e n\u00e3o pode ser modificado.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-cyan-600 shadow-lg">
              <Palmtree className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando per\u00edodo de f\u00e9rias
              </p>
              <h1 className="text-xl font-bold truncate">
                {getName(vacation.employeeId)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatDate(vacation.acquisitionStart)} \u2014{' '}
                {formatDate(vacation.acquisitionEnd)}
              </p>
            </div>
          </div>
        </Card>

        {/* Section: Per\u00edodo de F\u00e9rias */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={CalendarDays}
                title="Per\u00edodo de F\u00e9rias"
                subtitle="Datas e dura\u00e7\u00e3o do per\u00edodo de f\u00e9rias"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Data de In\u00edcio */}
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">
                      Data de In\u00edcio{' '}
                      <span className="text-rose-500">*</span>
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
                      Data de T\u00e9rmino{' '}
                      <span className="text-rose-500">*</span>
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

                  {/* Total de Dias (calculated, read-only) */}
                  <div className="grid gap-2">
                    <Label htmlFor="totalDays">Total de Dias</Label>
                    <Input
                      id="totalDays"
                      type="number"
                      value={calculatedDays}
                      readOnly
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Calculado automaticamente a partir das datas
                    </p>
                  </div>
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
                subtitle="Notas adicionais sobre o per\u00edodo de f\u00e9rias"
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
                    placeholder="Informa\u00e7\u00f5es adicionais sobre o per\u00edodo de f\u00e9rias"
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
        title="Excluir Per\u00edodo de F\u00e9rias"
        description={`Digite seu PIN de a\u00e7\u00e3o para excluir este per\u00edodo de f\u00e9rias de ${getName(vacation.employeeId)}. Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.`}
      />
    </PageLayout>
  );
}
