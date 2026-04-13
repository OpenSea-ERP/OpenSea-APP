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
import {
  useDeal,
  useUpdateDeal,
  useDeleteDeal,
  useChangeDealStage,
} from '@/hooks/sales/use-deals';
import { usePipelines } from '@/hooks/sales/use-pipelines';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { Deal } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  GitBranch,
  Handshake,
  Loader2,
  NotebookText,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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

export default function EditDealPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const dealId = params.id as string;

  const canModify = hasPermission(SALES_PERMISSIONS.DEALS.MODIFY);
  const canDelete = hasPermission(SALES_PERMISSIONS.DEALS.REMOVE);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: dealData, isLoading: isLoadingDeal, error } = useDeal(dealId);

  const deal = dealData?.deal as Deal | undefined;

  const { data: pipelinesData } = usePipelines({ isActive: true });
  const pipelines = useMemo(
    () => pipelinesData?.pipelines ?? [],
    [pipelinesData]
  );

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateDeal();
  const deleteMutation = useDeleteDeal();
  const changeStageMutation = useChangeDealStage();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [probability, setProbability] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [notes, setNotes] = useState('');

  // Stages for the selected pipeline
  const selectedPipeline = useMemo(
    () => pipelines.find(p => p.id === pipelineId),
    [pipelines, pipelineId]
  );

  const availableStages = useMemo(
    () =>
      selectedPipeline?.stages
        ? [...selectedPipeline.stages].sort((a, b) => a.position - b.position)
        : [],
    [selectedPipeline]
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (deal) {
      setTitle(deal.title || '');
      setValue(
        deal.value !== undefined && deal.value !== null
          ? String(deal.value)
          : ''
      );
      setProbability(
        deal.probability !== undefined && deal.probability !== null
          ? String(deal.probability)
          : ''
      );
      setExpectedCloseDate(
        deal.expectedCloseDate ? deal.expectedCloseDate.substring(0, 10) : ''
      );
      setPipelineId(deal.pipelineId || '');
      setStageId(deal.stageId || '');
      setNotes('');
    }
  }, [deal]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('O título do negócio e obrigatório.');
      return;
    }

    try {
      setIsSaving(true);

      // Update deal fields
      await updateMutation.mutateAsync({
        dealId,
        data: {
          title: title.trim(),
          value: value ? parseFloat(value) : undefined,
          probability: probability ? parseInt(probability, 10) : undefined,
          expectedCloseDate: expectedCloseDate || undefined,
        },
      });

      // If pipeline/stage changed, call changeStage
      if (
        deal &&
        (stageId !== deal.stageId || pipelineId !== deal.pipelineId)
      ) {
        await changeStageMutation.mutateAsync({
          dealId,
          data: {
            stageId,
            pipelineId: pipelineId !== deal.pipelineId ? pipelineId : undefined,
          },
        });
      }

      toast.success('Negócio atualizado com sucesso!');
      await queryClient.invalidateQueries({ queryKey: ['deals', dealId] });
      router.push(`/sales/deals/${dealId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar negócio',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar negócio', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(dealId);
      toast.success('Negócio excluído com sucesso!');
      router.push(
        deal?.pipelineId
          ? `/sales/pipelines/${deal.pipelineId}`
          : '/sales/pipelines'
      );
    } catch (err) {
      logger.error(
        'Erro ao deletar negócio',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir negócio', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
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
    ...(canModify
      ? [
          {
            id: 'save',
            title: isSaving ? 'Salvando...' : 'Salvar',
            icon: isSaving ? Loader2 : Save,
            onClick: handleSubmit,
            variant: 'default' as const,
            disabled: isSaving || !title.trim(),
          },
        ]
      : []),
  ];

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Pipelines', href: '/sales/pipelines' },
    ...(deal?.pipeline
      ? [
          {
            label: deal.pipeline.name,
            href: `/sales/pipelines/${deal.pipelineId}`,
          },
        ]
      : []),
    {
      label: deal?.title || '...',
      href: `/sales/deals/${dealId}`,
    },
    { label: 'Editar' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoadingDeal) {
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

  if (error || !deal) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Negócio não encontrado"
            message="O negócio solicitado não foi encontrado."
            action={{
              label: 'Voltar para Pipelines',
              onClick: () => router.push('/sales/pipelines'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-emerald-500 to-teal-600">
              <Handshake className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando negócio</p>
              <h1 className="text-xl font-bold truncate">{deal.title}</h1>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados do Negócio */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={DollarSign}
                title="Dados do Negócio"
                subtitle="Informações principais do negócio"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="title">
                      Título <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Título do negócio"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input
                      id="value"
                      type="number"
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="probability">Probabilidade (%)</Label>
                    <Input
                      id="probability"
                      type="number"
                      value={probability}
                      onChange={e => setProbability(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="expectedCloseDate">
                      Previsao de Fechamento
                    </Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={expectedCloseDate}
                      onChange={e => setExpectedCloseDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Pipeline */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={GitBranch}
                title="Pipeline"
                subtitle="Pipeline e etapa atual do negócio"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pipelineId">Pipeline</Label>
                    <Select
                      value={pipelineId}
                      onValueChange={v => {
                        setPipelineId(v);
                        setStageId('');
                      }}
                    >
                      <SelectTrigger id="pipelineId">
                        <SelectValue placeholder="Selecione um pipeline..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelines.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="stageId">Etapa</Label>
                    <Select
                      value={stageId}
                      onValueChange={setStageId}
                      disabled={!pipelineId}
                    >
                      <SelectTrigger id="stageId">
                        <SelectValue placeholder="Selecione uma etapa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStages.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Observações */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Observações"
                subtitle="Notas internas sobre o negócio"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notas internas sobre o negócio..."
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
        title="Excluir Negócio"
        description={`Digite seu PIN de ação para excluir o negócio "${deal.title}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
