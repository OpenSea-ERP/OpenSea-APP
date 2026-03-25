/**
 * Edit Cost Center Page
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PermissionCodes from '@/config/rbac/permission-codes';
import {
  useCostCenter,
  useDeleteCostCenter,
  useUpdateCostCenter,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { logger } from '@/lib/logger';
import {
  DollarSign,
  Loader2,
  Save,
  Settings,
  Target,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';

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

export default function EditCostCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data, isLoading } = useCostCenter(id);
  const updateMutation = useUpdateCostCenter();
  const deleteMutation = useDeleteCostCenter();
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(PermissionCodes.FINANCE.COST_CENTERS.REMOVE);
  const costCenter = data?.costCenter;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    monthlyBudget: '',
    annualBudget: '',
    isActive: true,
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (costCenter) {
      setFormData({
        name: costCenter.name,
        code: costCenter.code,
        description: costCenter.description || '',
        monthlyBudget:
          costCenter.monthlyBudget != null
            ? String(costCenter.monthlyBudget)
            : '',
        annualBudget:
          costCenter.annualBudget != null
            ? String(costCenter.annualBudget)
            : '',
        isActive: costCenter.isActive,
      });
    }
  }, [costCenter]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório.');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('O código é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id,
        data: {
          name: formData.name,
          code: formData.code,
          isActive: formData.isActive,
          description: formData.description || undefined,
          monthlyBudget: formData.monthlyBudget
            ? parseFloat(formData.monthlyBudget)
            : undefined,
          annualBudget: formData.annualBudget
            ? parseFloat(formData.annualBudget)
            : undefined,
        },
      });
      toast.success('Centro de custo atualizado com sucesso!');
      router.push(`/finance/cost-centers/${id}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar centro de custo',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar centro de custo', {
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Centro de custo excluído com sucesso.');
      router.push('/finance/cost-centers');
    } catch (err) {
      logger.error(
        'Erro ao excluir centro de custo',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir centro de custo', { description: message });
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/finance/cost-centers/${id}`),
      variant: 'ghost',
    },
    ...(canDelete
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
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
    { label: 'Financeiro', href: '/finance' },
    { label: 'Centros de Custo', href: '/finance/cost-centers' },
    ...(costCenter
      ? [
          {
            label: costCenter.name,
            href: `/finance/cost-centers/${id}`,
          },
          { label: 'Editar' },
        ]
      : [{ label: 'Editar' }]),
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

  if (!costCenter) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Centro de custo não encontrado"
            message="O centro de custo solicitado não foi encontrado."
            action={{
              label: 'Voltar para Centros de Custo',
              onClick: () => router.push('/finance/cost-centers'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-pink-600 shadow-lg">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando centro de custo
              </p>
              <h1 className="text-xl font-bold truncate">{costCenter.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Código</p>
                <p className="text-[11px] text-muted-foreground">
                  {costCenter.code}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 1: Identificação */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Target}
                title="Identificação"
                subtitle="Nome e código do centro de custo"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nome do centro de custo"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="code">
                      Código <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={e =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="Código do centro de custo"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Orçamento */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={DollarSign}
                title="Orçamento"
                subtitle="Limites orçamentários mensal e anual"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="monthlyBudget">Orçamento Mensal (R$)</Label>
                    <Input
                      id="monthlyBudget"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthlyBudget}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          monthlyBudget: e.target.value,
                        })
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="annualBudget">Orçamento Anual (R$)</Label>
                    <Input
                      id="annualBudget"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.annualBudget}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          annualBudget: e.target.value,
                        })
                      }
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Configurações */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Settings}
                title="Configurações"
                subtitle="Status e descrição do centro de custo"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onValueChange={v =>
                        setFormData({
                          ...formData,
                          isActive: v === 'active',
                        })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Descrição opcional do centro de custo"
                    rows={4}
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
        title="Excluir Centro de Custo"
        description={`Digite seu PIN de ação para excluir o centro de custo "${costCenter.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
