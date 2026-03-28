/**
 * OpenSea OS - Bonus Edit Page
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
import type { Bonus } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Gift,
  Loader2,
  NotebookText,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  bonusesApi,
  bonusKeys,
  formatCurrency,
  useDeleteBonus,
  useUpdateBonus,
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

export default function BonusEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bonusId = params.id as string;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    reason: '',
    date: '',
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data: bonus, isLoading } = useQuery<Bonus>({
    queryKey: bonusKeys.detail(bonusId),
    queryFn: () => bonusesApi.get(bonusId),
  });

  const { getName } = useEmployeeMap(bonus ? [bonus.employeeId] : []);

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const updateMutation = useUpdateBonus();
  const deleteMutation = useDeleteBonus({
    onSuccess: () => {
      router.push('/hr/bonuses');
    },
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (bonus) {
      setFormData({
        name: bonus.name,
        amount: String(bonus.amount),
        reason: bonus.reason || '',
        date: bonus.date ? bonus.date.slice(0, 10) : '',
      });
    }
  }, [bonus]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFieldErrors({ name: 'O nome é obrigatório.' });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFieldErrors({ amount: 'O valor deve ser maior que zero.' });
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: bonusId,
        data: {
          name: formData.name,
          amount,
          reason: formData.reason || undefined,
          date: formData.date || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: bonusKeys.lists() });
      await queryClient.invalidateQueries({
        queryKey: bonusKeys.detail(bonusId),
      });
      toast.success('Bonificação atualizada com sucesso!');
      router.push(`/hr/bonuses/${bonusId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar bonificação',
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
    if (!bonus) return;
    try {
      await deleteMutation.mutateAsync(bonus.id);
      setDeleteModalOpen(false);
    } catch (err) {
      logger.error(
        'Erro ao excluir bonificação',
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
      onClick: () => router.push(`/hr/bonuses/${bonusId}`),
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
    { label: 'Bônus', href: '/hr/bonuses' },
    {
      label: bonus?.name || '...',
      href: `/hr/bonuses/${bonusId}`,
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

  if (!bonus) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Bonificação não encontrada"
            message="A bonificação solicitada não foi encontrada."
            action={{
              label: 'Voltar para Bonificações',
              onClick: () => router.push('/hr/bonuses'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-lime-500 to-lime-600 shadow-lg">
              <Gift className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando bonificação
              </p>
              <h1 className="text-xl font-bold truncate">{bonus.name}</h1>
              <p className="text-sm text-muted-foreground">
                {getName(bonus.employeeId)} · {formatCurrency(bonus.amount)}
              </p>
            </div>
          </div>
        </Card>

        {/* Section: Informações do Bônus */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Informações do Bônus"
                subtitle="Dados principais da bonificação"
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
                        placeholder="Nome da bonificação"
                        aria-invalid={!!fieldErrors.name}
                      />
                      {fieldErrors.name && (
                        <FormErrorIcon message={fieldErrors.name} />
                      )}
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="grid gap-2">
                    <Label htmlFor="amount">
                      Valor (R$) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={e => {
                          setFormData({ ...formData, amount: e.target.value });
                          if (fieldErrors.amount)
                            setFieldErrors(prev => ({ ...prev, amount: '' }));
                        }}
                        placeholder="0,00"
                        aria-invalid={!!fieldErrors.amount}
                      />
                      {fieldErrors.amount && (
                        <FormErrorIcon message={fieldErrors.amount} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={e =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Motivo */}
                <div className="grid gap-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={e =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Descreva o motivo da bonificação"
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
        title="Excluir Bonificação"
        description={`Digite seu PIN de ação para excluir a bonificação "${bonus.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
