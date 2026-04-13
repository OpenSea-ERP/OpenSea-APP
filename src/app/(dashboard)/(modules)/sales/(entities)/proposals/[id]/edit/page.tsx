/**
 * OpenSea OS - Edit Proposal Page
 * Página de edição da proposta (apenas DRAFT)
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useProposal,
  useUpdateProposal,
  useDeleteProposal,
} from '@/hooks/sales/use-proposals';
import { usePermissions } from '@/hooks/use-permissions';
import { proposalsConfig } from '@/config/entities/proposals.config';
import { logger } from '@/lib/logger';
import type { Proposal, ProposalItem } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileCheck,
  Loader2,
  Minus,
  NotebookText,
  Package,
  Plus,
  Save,
  ScrollText,
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
// ITEM ROW TYPE
// =============================================================================

interface ItemRow {
  description: string;
  quantity: number;
  unitPrice: number;
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const proposalId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: proposalData,
    isLoading: isLoadingProposal,
    error,
  } = useProposal(proposalId);

  const proposal = proposalData?.proposal as Proposal | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateProposal();
  const deleteMutation = useDeleteProposal();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (proposal) {
      setTitle(proposal.title || '');
      setDescription(proposal.description || '');
      setValidUntil(
        proposal.validUntil
          ? new Date(proposal.validUntil).toISOString().split('T')[0]
          : ''
      );
      setTerms(proposal.terms || '');
      setItems(
        (proposal.items ?? []).map((item: ProposalItem) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );
    }
  }, [proposal]);

  // ============================================================================
  // ITEM HANDLERS
  // ============================================================================

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof ItemRow,
    value: string | number
  ) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: proposalId,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          validUntil: validUntil || undefined,
          terms: terms.trim() || undefined,
          items: items
            .filter(item => item.description.trim())
            .map(item => ({
              description: item.description.trim(),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
        },
      });

      toast.success('Proposta atualizada com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['proposals', proposalId],
      });
      router.push(`/sales/proposals/${proposalId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar proposta',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar proposta', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(proposalId);
      toast.success('Proposta excluída com sucesso!');
      router.push('/sales/proposals');
    } catch (err) {
      logger.error(
        'Erro ao deletar proposta',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar proposta', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(proposalsConfig.permissions!.delete &&
    hasPermission(proposalsConfig.permissions!.delete)
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
      disabled: isSaving || !title.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Propostas', href: '/sales/proposals' },
    {
      label: proposal?.title || '...',
      href: `/sales/proposals/${proposalId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingProposal) {
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

  if (error || !proposal) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Proposta não encontrada"
            message="A proposta solicitada não foi encontrada."
            action={{
              label: 'Voltar para Propostas',
              onClick: () => router.push('/sales/proposals'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  if (proposal.status !== 'DRAFT') {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Edição não permitida"
            message="Apenas propostas com status Rascunho podem ser editadas."
            action={{
              label: 'Ver Proposta',
              onClick: () => router.push(`/sales/proposals/${proposalId}`),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-violet-500 to-purple-600">
              <FileCheck className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando proposta</p>
              <h1 className="text-xl font-bold truncate">{proposal.title}</h1>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados da Proposta */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Dados da Proposta"
                subtitle="Informações básicas da proposta"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">
                      Título <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Título da proposta"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="validUntil">Válida até</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição da proposta..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Itens */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Package}
                title="Itens"
                subtitle="Produtos e serviços da proposta"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_40px] gap-3 items-end border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="grid gap-2">
                      <Label>Descrição</Label>
                      <Input
                        value={item.description}
                        onChange={e =>
                          updateItem(index, 'description', e.target.value)
                        }
                        placeholder="Descrição do item"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Qtd.</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e =>
                          updateItem(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Preço Unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e =>
                          updateItem(
                            index,
                            'unitPrice',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      className="h-10 w-10 text-muted-foreground hover:text-rose-600"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="h-9 px-2.5"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Termos e Condições */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={ScrollText}
                title="Termos e Condições"
                subtitle="Condições comerciais da proposta"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="terms">Termos</Label>
                  <Textarea
                    id="terms"
                    value={terms}
                    onChange={e => setTerms(e.target.value)}
                    placeholder="Termos e condições da proposta..."
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
        title="Excluir Proposta"
        description={`Digite seu PIN de ação para excluir a proposta "${proposal.title}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
