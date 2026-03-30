/**
 * OpenSea OS - Dependant Edit Page
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
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import { employeesService } from '@/services/hr/employees.service';
import { dependantsService } from '@/services/hr/dependants.service';
import type { EmployeeDependant, DependantRelationship } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  Loader2,
  NotebookText,
  Save,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  dependantKeys,
  formatDate,
  formatCpf,
  getRelationshipLabel,
  useUpdateDependant,
  useDeleteDependant,
} from '../../src';

// =============================================================================
// RELATIONSHIP OPTIONS
// =============================================================================

const RELATIONSHIP_OPTIONS: { value: DependantRelationship; label: string }[] = [
  { value: 'SPOUSE', label: 'Cônjuge' },
  { value: 'CHILD', label: 'Filho(a)' },
  { value: 'STEPCHILD', label: 'Enteado(a)' },
  { value: 'PARENT', label: 'Pai/Mãe' },
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

export default function DependantEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dependantId = params.id as string;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birthDate: '',
    relationship: '' as DependantRelationship | '',
    isIrrfDependant: false,
    isSalarioFamilia: false,
    hasDisability: false,
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data: detailData, isLoading } = useQuery<{
    dependant: EmployeeDependant;
    employeeName: string;
  } | null>({
    queryKey: dependantKeys.detail(dependantId),
    queryFn: async () => {
      const employeesResponse = await employeesService.listEmployees({
        perPage: 100,
        status: 'ACTIVE',
      });
      const employees = employeesResponse.employees ?? [];

      for (const employee of employees) {
        try {
          const response = await dependantsService.list(employee.id);
          const dependants = response.dependants ?? [];
          const found = dependants.find(
            (d: EmployeeDependant) => d.id === dependantId
          );
          if (found) {
            return {
              dependant: found,
              employeeName: employee.fullName,
            };
          }
        } catch {
          // Skip employees that fail
        }
      }

      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const dependant = detailData?.dependant;
  const employeeName = detailData?.employeeName;

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const updateMutation = useUpdateDependant();
  const deleteMutation = useDeleteDependant({
    onSuccess: () => {
      router.push('/hr/dependants');
    },
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (dependant) {
      setFormData({
        name: dependant.name,
        cpf: dependant.cpf || '',
        birthDate: dependant.birthDate ? dependant.birthDate.slice(0, 10) : '',
        relationship: dependant.relationship,
        isIrrfDependant: dependant.isIrrfDependant,
        isSalarioFamilia: dependant.isSalarioFamilia,
        hasDisability: dependant.hasDisability,
      });
    }
  }, [dependant]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!dependant) return;

    if (!formData.name.trim()) {
      setFieldErrors({ name: 'O nome é obrigatório.' });
      return;
    }

    if (!formData.birthDate) {
      setFieldErrors({ birthDate: 'A data de nascimento é obrigatória.' });
      return;
    }

    if (!formData.relationship) {
      setFieldErrors({ relationship: 'O parentesco é obrigatório.' });
      return;
    }

    try {
      setIsSaving(true);
      setFieldErrors({});
      await updateMutation.mutateAsync({
        employeeId: dependant.employeeId,
        dependantId: dependant.id,
        data: {
          name: formData.name,
          cpf: formData.cpf || undefined,
          birthDate: formData.birthDate,
          relationship: formData.relationship,
          isIrrfDependant: formData.isIrrfDependant,
          isSalarioFamilia: formData.isSalarioFamilia,
          hasDisability: formData.hasDisability,
        },
      });
      await queryClient.invalidateQueries({ queryKey: dependantKeys.lists() });
      await queryClient.invalidateQueries({
        queryKey: dependantKeys.detail(dependantId),
      });
      toast.success('Dependente atualizado com sucesso!');
      router.push(`/hr/dependants/${dependantId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar dependente',
        err instanceof Error ? err : undefined
      );
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(translateError(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!dependant) return;
    try {
      await deleteMutation.mutateAsync({
        employeeId: dependant.employeeId,
        dependantId: dependant.id,
      });
      setDeleteModalOpen(false);
    } catch (err) {
      logger.error(
        'Erro ao excluir dependente',
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
      onClick: () => router.push(`/hr/dependants/${dependantId}`),
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
    { label: 'Dependentes', href: '/hr/dependants' },
    {
      label: dependant?.name || '...',
      href: `/hr/dependants/${dependantId}`,
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

  if (!dependant) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Dependente não encontrado"
            message="O dependente solicitado não foi encontrado."
            action={{
              label: 'Voltar para Dependentes',
              onClick: () => router.push('/hr/dependants'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-pink-600 shadow-lg">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando dependente
              </p>
              <h1 className="text-xl font-bold truncate">{dependant.name}</h1>
              <p className="text-sm text-muted-foreground">
                {employeeName ?? 'Funcionário desconhecido'} ·{' '}
                {getRelationshipLabel(dependant.relationship)} ·{' '}
                Criado em {formatDate(dependant.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Section: Dados Pessoais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={User}
                title="Dados Pessoais"
                subtitle="Nome, CPF, data de nascimento e parentesco"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome Completo <span className="text-rose-500">*</span>
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
                        placeholder="Ex: Maria Silva"
                        aria-invalid={!!fieldErrors.name}
                      />
                      {fieldErrors.name && (
                        <FormErrorIcon message={fieldErrors.name} />
                      )}
                    </div>
                  </div>

                  {/* CPF */}
                  <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={e =>
                        setFormData({ ...formData, cpf: e.target.value })
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>

                  {/* Data de Nascimento */}
                  <div className="grid gap-2">
                    <Label htmlFor="birthDate">
                      Data de Nascimento <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            birthDate: e.target.value,
                          });
                          if (fieldErrors.birthDate)
                            setFieldErrors(prev => ({
                              ...prev,
                              birthDate: '',
                            }));
                        }}
                        aria-invalid={!!fieldErrors.birthDate}
                      />
                      {fieldErrors.birthDate && (
                        <FormErrorIcon message={fieldErrors.birthDate} />
                      )}
                    </div>
                  </div>

                  {/* Parentesco */}
                  <div className="grid gap-2">
                    <Label htmlFor="relationship">
                      Parentesco <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        id="relationship"
                        value={formData.relationship}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            relationship: e.target.value as DependantRelationship,
                          });
                          if (fieldErrors.relationship)
                            setFieldErrors(prev => ({
                              ...prev,
                              relationship: '',
                            }));
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-invalid={!!fieldErrors.relationship}
                      >
                        <option value="">Selecione o parentesco</option>
                        {RELATIONSHIP_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.relationship && (
                        <FormErrorIcon message={fieldErrors.relationship} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Benefícios Fiscais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Shield}
                title="Benefícios Fiscais"
                subtitle="Configurações de IRRF, Salário Família e deficiência"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Dependente IRRF */}
                  <div className="flex items-center gap-3">
                    <input
                      id="isIrrfDependant"
                      type="checkbox"
                      checked={formData.isIrrfDependant}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          isIrrfDependant: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isIrrfDependant" className="cursor-pointer">
                      Dependente IRRF
                    </Label>
                  </div>

                  {/* Salário Família */}
                  <div className="flex items-center gap-3">
                    <input
                      id="isSalarioFamilia"
                      type="checkbox"
                      checked={formData.isSalarioFamilia}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          isSalarioFamilia: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isSalarioFamilia" className="cursor-pointer">
                      Salário Família
                    </Label>
                  </div>

                  {/* Pessoa com Deficiência */}
                  <div className="flex items-center gap-3">
                    <input
                      id="hasDisability"
                      type="checkbox"
                      checked={formData.hasDisability}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          hasDisability: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="hasDisability" className="cursor-pointer">
                      Pessoa com Deficiência
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Funcionário Vinculado */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Funcionário Vinculado"
                subtitle="Informações do funcionário ao qual o dependente está vinculado"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <p className="text-sm text-muted-foreground">
                  Funcionário:{' '}
                  <span className="font-medium text-foreground">
                    {employeeName ?? 'Desconhecido'}
                  </span>
                </p>
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
        title="Excluir Dependente"
        description={`Digite seu PIN de ação para excluir o dependente "${dependant.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
