/**
 * OpenSea OS - Workplace Risk Edit Page
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
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import { safetyProgramsService } from '@/services/hr/safety-programs.service';
import type {
  SafetyProgram,
  WorkplaceRisk,
  WorkplaceRiskCategory,
  WorkplaceRiskSeverity,
} from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Loader2,
  NotebookText,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  workplaceRiskKeys,
  getRiskCategoryLabel,
  getRiskSeverityLabel,
  RISK_CATEGORY_OPTIONS,
  RISK_SEVERITY_OPTIONS,
  formatDate,
  useUpdateWorkplaceRisk,
  useDeleteWorkplaceRiskDynamic,
} from '../../src';
import { safetyProgramKeys } from '../../../safety-programs/src';

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

export default function WorkplaceRiskEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const riskId = params.id as string;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    category: '' as WorkplaceRiskCategory | '',
    severity: '' as WorkplaceRiskSeverity | '',
    source: '',
    affectedArea: '',
    controlMeasures: '',
    epiRequired: '',
    isActive: true,
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data: riskData, isLoading } = useQuery<{
    risk: WorkplaceRisk;
    program: SafetyProgram;
  } | null>({
    queryKey: workplaceRiskKeys.detail(riskId),
    queryFn: async () => {
      const programsResponse = await safetyProgramsService.list({
        perPage: 100,
      });
      const programs = programsResponse.safetyPrograms ?? [];

      for (const program of programs) {
        const risksResponse = await safetyProgramsService.listRisks(program.id);
        const risks = risksResponse.risks ?? [];
        const found = risks.find(r => r.id === riskId);
        if (found) {
          return { risk: found, program };
        }
      }

      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const risk = riskData?.risk;
  const program = riskData?.program;

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const updateMutation = useUpdateWorkplaceRisk(program?.id ?? '', {
    showSuccessToast: false,
    showErrorToast: false,
  });
  const deleteMutation = useDeleteWorkplaceRiskDynamic({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workplaceRiskKeys.lists() });
      if (program) {
        queryClient.invalidateQueries({
          queryKey: safetyProgramKeys.risks(program.id),
        });
      }
      router.push('/hr/workplace-risks');
    },
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (risk) {
      setFormData({
        name: risk.name,
        category: risk.category,
        severity: risk.severity,
        source: risk.source || '',
        affectedArea: risk.affectedArea || '',
        controlMeasures: risk.controlMeasures || '',
        epiRequired: risk.epiRequired || '',
        isActive: risk.isActive,
      });
    }
  }, [risk]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!risk || !program) return;

    if (!formData.name.trim()) {
      setFieldErrors({ name: 'O nome é obrigatório.' });
      return;
    }

    if (!formData.category) {
      setFieldErrors({ category: 'A categoria é obrigatória.' });
      return;
    }

    if (!formData.severity) {
      setFieldErrors({ severity: 'A severidade é obrigatória.' });
      return;
    }

    try {
      setIsSaving(true);
      setFieldErrors({});
      await updateMutation.mutateAsync({
        riskId: risk.id,
        data: {
          name: formData.name,
          category: formData.category as WorkplaceRiskCategory,
          severity: formData.severity as WorkplaceRiskSeverity,
          source: formData.source || undefined,
          affectedArea: formData.affectedArea || undefined,
          controlMeasures: formData.controlMeasures || undefined,
          epiRequired: formData.epiRequired || undefined,
          isActive: formData.isActive,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: workplaceRiskKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: workplaceRiskKeys.detail(riskId),
      });
      if (program) {
        await queryClient.invalidateQueries({
          queryKey: safetyProgramKeys.risks(program.id),
        });
      }
      toast.success('Risco ocupacional atualizado com sucesso!');
      router.push(`/hr/workplace-risks/${riskId}`);
    } catch (err) {
      logger.error(
        'Failed to update workplace risk',
        err instanceof Error ? err : undefined
      );
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists') || msg.includes('name already')) {
        setFieldErrors({ name: translateError(msg) });
      } else {
        toast.error(translateError(msg));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!risk || !program) return;
    try {
      await deleteMutation.mutateAsync({
        programId: program.id,
        riskId: risk.id,
      });
      setDeleteModalOpen(false);
    } catch (err) {
      logger.error(
        'Failed to delete workplace risk',
        err instanceof Error ? err : undefined
      );
      toast.error(translateError(err));
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/hr/workplace-risks/${riskId}`),
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
      title: isSaving ? 'Salvando...' : 'Salvar Alterações',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  // ==========================================================================
  // BREADCRUMBS
  // ==========================================================================

  const breadcrumbItems = [
    { label: 'RH', href: '/hr' },
    { label: 'Riscos Ocupacionais', href: '/hr/workplace-risks' },
    {
      label: risk?.name || '...',
      href: `/hr/workplace-risks/${riskId}`,
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

  if (!risk || !program) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Risco ocupacional não encontrado"
            message="O risco ocupacional solicitado não foi encontrado."
            action={{
              label: 'Voltar para Riscos Ocupacionais',
              onClick: () => router.push('/hr/workplace-risks'),
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
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-lg">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando risco ocupacional
              </p>
              <h1 className="text-xl font-bold truncate">{risk.name}</h1>
              <p className="text-sm text-muted-foreground">
                {getRiskCategoryLabel(risk.category)} ·{' '}
                {getRiskSeverityLabel(risk.severity)} ·{' '}
                Programa: {program.name} ·{' '}
                Criado em {formatDate(risk.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Section: Informações do Risco */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Informações do Risco"
                subtitle="Nome, categoria, severidade e status"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => {
                          setFormData({ ...formData, name: e.target.value });
                          if (fieldErrors.name)
                            setFieldErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="Nome do risco"
                        aria-invalid={!!fieldErrors.name}
                      />
                      {fieldErrors.name && (
                        <FormErrorIcon message={fieldErrors.name} />
                      )}
                    </div>
                  </div>

                  {/* Categoria */}
                  <div className="grid gap-2">
                    <Label htmlFor="category">
                      Categoria <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={formData.category}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            category: e.target.value as WorkplaceRiskCategory,
                          });
                          if (fieldErrors.category)
                            setFieldErrors(prev => ({
                              ...prev,
                              category: '',
                            }));
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-invalid={!!fieldErrors.category}
                      >
                        <option value="">Selecione a categoria</option>
                        {RISK_CATEGORY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.category && (
                        <FormErrorIcon message={fieldErrors.category} />
                      )}
                    </div>
                  </div>

                  {/* Severidade */}
                  <div className="grid gap-2">
                    <Label htmlFor="severity">
                      Severidade <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        id="severity"
                        value={formData.severity}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            severity: e.target.value as WorkplaceRiskSeverity,
                          });
                          if (fieldErrors.severity)
                            setFieldErrors(prev => ({
                              ...prev,
                              severity: '',
                            }));
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-invalid={!!fieldErrors.severity}
                      >
                        <option value="">Selecione a severidade</option>
                        {RISK_SEVERITY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.severity && (
                        <FormErrorIcon message={fieldErrors.severity} />
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-3 h-10">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        Risco ativo
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Fonte e Área Afetada */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Zap}
                title="Fonte e Área Afetada"
                subtitle="Origem do risco e área de impacto"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fonte do Risco */}
                  <div className="grid gap-2">
                    <Label htmlFor="source">Fonte do Risco</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={e =>
                        setFormData({ ...formData, source: e.target.value })
                      }
                      placeholder="Ex: Máquinas industriais"
                    />
                  </div>

                  {/* Área Afetada */}
                  <div className="grid gap-2">
                    <Label htmlFor="affectedArea">Área Afetada</Label>
                    <Input
                      id="affectedArea"
                      value={formData.affectedArea}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          affectedArea: e.target.value,
                        })
                      }
                      placeholder="Ex: Galpão de produção"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Medidas de Controle */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Shield}
                title="Medidas de Controle"
                subtitle="Ações preventivas e corretivas para mitigar o risco"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="controlMeasures">
                    Medidas de Controle
                  </Label>
                  <Textarea
                    id="controlMeasures"
                    value={formData.controlMeasures}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        controlMeasures: e.target.value,
                      })
                    }
                    placeholder="Descreva as medidas de controle aplicadas"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: EPI Necessário */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={ShieldCheck}
                title="EPI Necessário"
                subtitle="Equipamentos de proteção individual requeridos"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="epiRequired">EPI Necessário</Label>
                  <Textarea
                    id="epiRequired"
                    value={formData.epiRequired}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        epiRequired: e.target.value,
                      })
                    }
                    placeholder="Ex: Luvas, óculos de proteção, protetor auricular"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Programa Vinculado (read-only) */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={ShieldCheck}
                title="Programa Vinculado"
                subtitle="Programa de segurança ao qual este risco pertence"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Programa</p>
                    <p className="text-sm font-medium text-foreground">
                      {program.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="text-sm font-medium text-foreground">
                      {program.type}
                    </p>
                  </div>
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
        title="Excluir Risco Ocupacional"
        description={`Digite seu PIN de ação para excluir o risco "${risk.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
