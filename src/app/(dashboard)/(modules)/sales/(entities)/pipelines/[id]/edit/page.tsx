/**
 * OpenSea OS - Edit Pipeline Page
 * Página de edicao de pipeline (nome e descrição apenas)
 * Stages sao gerenciados na página de detalhes (Kanban)
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
import { Textarea } from '@/components/ui/textarea';
import {
  usePipeline,
  useUpdatePipeline,
  useDeletePipeline,
} from '@/hooks/sales/use-pipelines';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { Pipeline } from '@/types/sales';
import { PIPELINE_TYPE_LABELS } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  GitBranch,
  Loader2,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function EditPipelinePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const pipelineId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: pipelineData, isLoading, error } = usePipeline(pipelineId);

  const pipeline = pipelineData?.pipeline as Pipeline | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdatePipeline();
  const deleteMutation = useDeletePipeline();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (pipeline) {
      setName(pipeline.name || '');
      setDescription(pipeline.description || '');
    }
  }, [pipeline]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('O nome do pipeline e obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        pipelineId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      });

      toast.success('Pipeline atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['pipelines', pipelineId],
      });
      router.push(`/sales/pipelines/${pipelineId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar pipeline',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar pipeline', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(pipelineId);
      toast.success('Pipeline excluído com sucesso!');
      router.push('/sales/pipelines');
    } catch (err) {
      logger.error(
        'Erro ao deletar pipeline',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar pipeline', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.PIPELINES.ADMIN)
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
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Pipelines', href: '/sales/pipelines' },
    {
      label: pipeline?.name || '...',
      href: `/sales/pipelines/${pipelineId}`,
    },
    { label: 'Editar' },
  ];

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

  if (error || !pipeline) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Pipeline não encontrado"
            message="O pipeline solicitado não foi encontrado."
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-sky-500 to-blue-600">
              <GitBranch className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando pipeline</p>
              <h1 className="text-xl font-bold truncate">{pipeline.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2">
                <span className="text-xs text-muted-foreground">
                  {PIPELINE_TYPE_LABELS[pipeline.type] ?? pipeline.type}
                </span>
              </div>
              {pipeline.stages && (
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    {pipeline.stages.length} etapa(s)
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Form Card: Dados do Pipeline */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Settings2}
                title="Dados do Pipeline"
                subtitle="Nome e descrição do pipeline"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome do pipeline"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Descrição do pipeline..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Info Card: Stages */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={GitBranch}
                title="Etapas"
                subtitle="As etapas sao gerenciadas na página de detalhes do pipeline"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <p className="text-sm text-muted-foreground">
                  Para adicionar, remover ou reordenar etapas, acesse a{' '}
                  <button
                    onClick={() =>
                      router.push(`/sales/pipelines/${pipelineId}`)
                    }
                    className="text-sky-600 dark:text-sky-400 underline hover:no-underline"
                  >
                    página de detalhes
                  </button>{' '}
                  do pipeline, onde você pode gerenciar o Kanban completo.
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
        title="Excluir Pipeline"
        description={`Digite seu PIN de ação para excluir o pipeline "${pipeline.name}". Todas as etapas serao removidas. Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
